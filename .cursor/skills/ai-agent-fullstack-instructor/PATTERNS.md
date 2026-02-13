# Agent 开发模式 & UI 设计模式

每个 section 展示模式名称、适用场景、代码示例。

---

## Part 1: Agent 架构模式

### 1. ReAct Agent 模式

**适用场景**: 出行规划中的搜索 -> 筛选 -> 规划链路

Agent 交替执行 Reasoning（思考）和 Acting（行动），直到任务完成。

```typescript
// lib/services/ai.ts — ReAct 循环核心
async function runAgentLoop(
  model: GenerativeModel,
  messages: Content[],
  tools: Tool[],
  maxSteps: number = 5,
): Promise<AgentResult> {
  for (let step = 0; step < maxSteps; step++) {
    const response = await model.generateContent({
      contents: messages,
      tools,
    });

    const candidate = response.response.candidates?.[0];
    if (!candidate) break;

    // 检查是否有 tool call
    const toolCalls = candidate.content.parts.filter(
      (p) => 'functionCall' in p,
    );

    if (toolCalls.length === 0) {
      // 没有 tool call = Agent 认为任务完成
      return { type: 'complete', content: candidate.content };
    }

    // 执行工具并将结果加入消息
    for (const call of toolCalls) {
      const result = await executeToolCall(call.functionCall);
      messages.push({
        role: 'function',
        parts: [
          {
            functionResponse: {
              name: call.functionCall.name,
              response: result,
            },
          },
        ],
      });
    }
  }

  return { type: 'max_steps_reached' };
}
```

---

### 2. Tool Registry 模式

**适用场景**: 统一管理地图 API、支付识别、天气查询等工具

```typescript
// lib/services/ai-tools.ts
interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  getSchemas(): FunctionDeclaration[] {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }

  async execute(
    name: string,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool not found: ${name}`);
    return tool.execute(params);
  }
}

// 注册工具
const registry = new ToolRegistry();
registry.register(searchAttractionsTool);
registry.register(planRouteTool);
registry.register(recognizePaymentTool);
registry.register(getWeatherTool);
```

---

### 3. Multimodal Agent 模式

**适用场景**: 支付截图/小票拍照 -> Gemini Vision 识别

```typescript
// lib/services/tools/recognize-payment.ts
interface PaymentRecognitionResult {
  amount: number;
  merchant: string;
  category: string;
  date: string;
  confidence: number;
}

async function recognizePayment(
  imageBase64: string,
): Promise<PaymentRecognitionResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    },
    {
      text: `分析这张支付截图或购物小票，提取以下信息并以 JSON 格式返回：
      {
        "amount": 金额(数字),
        "merchant": "商家名称",
        "category": "消费分类(餐饮/交通/娱乐/购物/其他)",
        "date": "日期(YYYY-MM-DD)",
        "confidence": 置信度(0-1)
      }
      如果无法识别某个字段，用 null 表示。`,
    },
  ]);

  return JSON.parse(result.response.text()) as PaymentRecognitionResult;
}
```

---

### 4. Streaming Response 模式

**适用场景**: AI 聊天的流式打字效果

```typescript
// 后端: app/piko/ai/chat/v1/route.ts
export async function POST(request: Request): Promise<Response> {
  const { messages } = await request.json();

  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
  const result = await model.generateContentStream({
    contents: messages,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller): Promise<void> {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
        );
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

// 前端: 消费 SSE
async function streamChat(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
): Promise<void> {
  const response = await fetch(`${API_BASE}/ai/chat/v1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        const { text } = JSON.parse(line.slice(6));
        onChunk(text);
      }
    }
  }
}
```

---

### 5. Memory 模式

**适用场景**: AI 记住用户消费习惯和偏好

```typescript
// 短期记忆: 对话上下文窗口
function getRecentContext(
  messages: ChatMessage[],
  maxTokens: number = 4000,
): ChatMessage[] {
  // 保留最近 N 条消息，不超过 token 限制
  const recent: ChatMessage[] = [];
  let tokens = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(messages[i].content);
    if (tokens + msgTokens > maxTokens) break;
    recent.unshift(messages[i]);
    tokens += msgTokens;
  }
  return recent;
}

// 长期记忆: 从数据库查询消费模式
async function getUserSpendingProfile(userId: string): Promise<string> {
  const expenses = await prisma.expense.groupBy({
    by: ['category'],
    where: { userId, date: { gte: thirtyDaysAgo() } },
    _sum: { amount: true },
    _count: true,
  });

  return `用户近30天消费概况:\n${expenses
    .map((e) => `- ${e.category}: ¥${e._sum.amount}, ${e._count}笔`)
    .join('\n')}`;
}
```

---

### 6. Scheduled Agent 模式

**适用场景**: 每日简报、预算预警

```typescript
// lib/scheduler/jobs/daily-briefing.ts
import cron from 'node-cron';

function scheduleDailyBriefing(): void {
  cron.schedule('0 8 * * *', async () => {
    const users = await prisma.user.findMany({
      where: { pushToken: { not: null } },
    });

    for (const user of users) {
      try {
        const weather = await getWeather(user.city);
        const advice = await generateDailyAdvice(user.id);
        const trips = await getUpcomingTrips(user.id);

        const briefing = composeBriefing(weather, advice, trips);
        await sendPushNotification(user.pushToken, briefing);
      } catch (error: unknown) {
        console.error(`[DailyBriefing] Failed for user ${user.id}:`, error);
        // 单用户失败不影响其他用户
      }
    }
  });
}
```

---

### 7. Multi-Agent Router 模式

**适用场景**: 出行/记账/建议 Agent 协作

```typescript
// lib/agents/router.ts
type AgentType = 'travel' | 'budget' | 'advice' | 'weather' | 'general';

async function routeToAgent(userMessage: string): Promise<AgentType> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
  const result = await model.generateContent(
    `判断用户意图，返回以下之一: travel, budget, advice, weather, general\n用户消息: "${userMessage}"`,
  );
  return result.response.text().trim() as AgentType;
}

// lib/agents/orchestrator.ts
async function orchestrate(
  userMessage: string,
  userId: string,
): Promise<AgentResult> {
  const agentType = await routeToAgent(userMessage);

  switch (agentType) {
    case 'travel': {
      const tripResult = await travelAgent.run(userMessage, userId);
      // 联动: 通知记账 Agent 预估开支
      void budgetAgent.estimateTripCost(tripResult.destination, userId);
      // 联动: 通知天气 Agent 查询目的地天气
      void weatherAgent.getForecast(
        tripResult.destination,
        tripResult.startDate,
      );
      return tripResult;
    }
    case 'budget':
      return budgetAgent.run(userMessage, userId);
    case 'advice':
      return adviceAgent.run(userMessage, userId);
    case 'weather':
      return weatherAgent.run(userMessage, userId);
    default:
      return generalAgent.run(userMessage, userId);
  }
}
```

---

### 8. Embedded H5 模式

**适用场景**: React Native WebView 嵌入 H5 地图

```typescript
// pages/ai-chat/components/ai-chat-map-view.tsx
interface Props {
  routeData: RouteData;
  attractions: Attraction[];
}

export default function AiChatMapView({ routeData, attractions }: Props): ReactNode {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = (event: WebViewMessageEvent): void => {
    const data = JSON.parse(event.nativeEvent.data);
    // 处理 H5 地图发来的消息（如用户点击景点）
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: `${API_BASE}/map.html` }}
      onMessage={handleMessage}
      onLoad={() => {
        // 加载完成后发送路线数据
        webViewRef.current?.postMessage(
          JSON.stringify({ type: 'drawRoute', routeData, attractions }),
        );
      }}
      style={{ height: 300 }}
      scrollEnabled={false}
    />
  );
}
```

---

## Part 2: UI 设计一致性模式

### 1. 统一组件库模式

```
✅ 正确: 所有按钮使用 PikoButton
<PikoButton variant="primary" label="确认" onPress={handleConfirm} />
<PikoButton variant="secondary" label="取消" onPress={handleCancel} />
<PikoButton variant="ghost" label="跳过" onPress={handleSkip} />

❌ 反模式: 各页面自建按钮
<Button bg="$blue9" .../>          // 首页的按钮
<TouchableOpacity bg="#007AFF" />  // 记账页的按钮
<Pressable bg="blue" />            // AI 页的按钮
```

### 2. Token-Only 色彩模式

```
✅ 正确:
<YStack bg="$background">
  <Text color="$color">标题</Text>
  <Text color="$gray10">副标题</Text>
</YStack>

// 业务色走常量
import { BUDGET_RING_COLOR } from '@/common/consts/theme';
<PikoRingChart color={BUDGET_RING_COLOR} />

❌ 反模式:
<YStack bg="#FFFFFF">              // 硬编码白色
  <Text color="rgba(0,0,0,0.8)">  // 硬编码颜色
<PikoRingChart color="#F5A623" />  // 硬编码黄色
```

### 3. 动画参数集中管理模式

```
✅ 正确:
import { SPRING_CONFIG, TIMING_NORMAL, STAGGER_DELAY } from '@/common/consts/animation';

const animatedProgress = useSharedValue(0);
animatedProgress.value = withSpring(targetProgress, SPRING_CONFIG);

<Animated.View entering={FadeInDown.delay(index * STAGGER_DELAY).duration(TIMING_NORMAL)} />

❌ 反模式:
animatedProgress.value = withSpring(targetProgress, { damping: 15, stiffness: 150 });
<Animated.View entering={FadeInDown.delay(index * 50).duration(300)} />
```

### 4. 列表入场动画模式

每个列表项延迟入场，产生瀑布流效果：

```typescript
// 列表项组件
interface Props {
  data: ExpenseItem;
  index: number;
}

export default function HomeExpenseItem({ data, index }: Props): ReactNode {
  return (
    <Animated.View entering={FadeInDown.delay(index * STAGGER_DELAY).duration(TIMING_NORMAL)}>
      <PikoCard>
        {/* 消费记录内容 */}
      </PikoCard>
    </Animated.View>
  );
}
```

### 5. 弹性交互反馈模式

卡片/按钮按下时微缩，松开回弹：

```typescript
const scale = useSharedValue(1);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));

const handlePressIn = (): void => {
  scale.value = withSpring(0.98, SPRING_CONFIG);
};

const handlePressOut = (): void => {
  scale.value = withSpring(1, SPRING_CONFIG);
};
```

### 6. 数据可视化动画模式

环形图、数字等数据变化时平滑过渡：

```typescript
// 环形图进度动画
const animatedProgress = useSharedValue(0);

useEffect(() => {
  animatedProgress.value = withSpring(progress, SPRING_CONFIG);
}, [progress]);

// 金额数字滚动
const animatedAmount = useSharedValue(0);

useEffect(() => {
  animatedAmount.value = withTiming(amount, {
    duration: TIMING_SLOW,
    easing: EASING_STANDARD,
  });
}, [amount]);
```

### 7. 骨架屏加载模式

数据加载时展示骨架屏，不用空白或 spinner：

```typescript
// common/components/skeleton.tsx
export default function Skeleton({ width, height, borderRadius }: Props): ReactNode {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,  // 无限循环
      true, // 反向
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.7]),
  }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: '$gray4' }, animatedStyle]}
    />
  );
}
```

### 8. 状态穷尽匹配模式

参考 local_service_c 的 ts-pattern，对 Agent 状态做穷尽分支：

```typescript
import { match } from 'ts-pattern';

type AgentState =
  | { status: 'idle' }
  | { status: 'thinking'; step: string }
  | { status: 'tool_calling'; toolName: string }
  | { status: 'streaming'; text: string }
  | { status: 'complete'; result: AgentResult }
  | { status: 'error'; error: PageErrorType };

function renderAgentState(state: AgentState): ReactNode {
  return match(state)
    .with({ status: 'idle' }, () => null)
    .with({ status: 'thinking' }, ({ step }) => <ThinkingIndicator step={step} />)
    .with({ status: 'tool_calling' }, ({ toolName }) => <ToolCallCard name={toolName} />)
    .with({ status: 'streaming' }, ({ text }) => <StreamingBubble text={text} />)
    .with({ status: 'complete' }, ({ result }) => <ResultCard result={result} />)
    .with({ status: 'error' }, ({ error }) => <PageStatusView errorType={error} />)
    .exhaustive();
}
```
