/**
 * 路线规划工具 — 构建高德地图导航 Deep Link。
 *
 * AI 提供地点名称与经纬度坐标，本工具负责：
 * 1. 根据高德 URI API 规则拼接导航链接
 * 2. 处理 via（途经点）限制：仅驾车模式支持 1 个途经点
 * 3. 4+ 站或非驾车模式自动拆分为多段链接
 */

import { SchemaType } from '@google/generative-ai';
import { toolRegistry, type ToolDefinition } from '../ai-tools';

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

interface Stop {
  name: string;
  longitude: number;
  latitude: number;
}

interface PlanRouteParams {
  stops: Stop[];
  mode?: 'car' | 'bus' | 'walk' | 'ride';
}

interface NavigationLink {
  url: string;
  label: string;
}

interface PlanRouteResult {
  links: NavigationLink[];
  markdown: string;
}

// ---------------------------------------------------------------------------
// URI 拼接
// ---------------------------------------------------------------------------

const AMAP_NAV_BASE = 'https://uri.amap.com/navigation';

function formatPoint(stop: Stop): string {
  return `${stop.longitude},${stop.latitude},${encodeURIComponent(stop.name)}`;
}

function buildNavUrl(
  from: Stop,
  to: Stop,
  via: Stop | null,
  mode: string,
): string {
  const params = new URLSearchParams();
  params.set('from', formatPoint(from));
  params.set('to', formatPoint(to));
  if (via) params.set('via', formatPoint(via));
  params.set('mode', mode);
  params.set('callnative', '1');
  params.set('src', 'piko');
  return `${AMAP_NAV_BASE}?${params.toString()}`;
}

function buildLabel(stops: Stop[]): string {
  return stops.map((s) => s.name).join(' → ');
}

// ---------------------------------------------------------------------------
// 核心逻辑：根据站点数和出行模式生成链接
// ---------------------------------------------------------------------------

function generateLinks(stops: Stop[], mode: string): NavigationLink[] {
  if (stops.length < 2) return [];

  // 驾车模式且恰好 3 站：使用 via 参数一条链接搞定
  if (mode === 'car' && stops.length === 3) {
    return [
      {
        url: buildNavUrl(stops[0], stops[2], stops[1], mode),
        label: buildLabel(stops),
      },
    ];
  }

  // 驾车模式 4+ 站：每 3 站一组（from -> via -> to），尾部可能只有 2 站
  if (mode === 'car' && stops.length > 3) {
    const links: NavigationLink[] = [];
    let i = 0;
    while (i < stops.length - 1) {
      const remaining = stops.length - i;
      if (remaining >= 3) {
        const segment = stops.slice(i, i + 3);
        links.push({
          url: buildNavUrl(segment[0], segment[2], segment[1], mode),
          label: buildLabel(segment),
        });
        i += 2; // overlap: to of this segment = from of next
      } else {
        // 最后 2 站
        links.push({
          url: buildNavUrl(stops[i], stops[i + 1], null, mode),
          label: buildLabel(stops.slice(i, i + 2)),
        });
        i += 1;
      }
    }
    return links;
  }

  // 2 站或非驾车模式：逐段生成 from -> to
  if (stops.length === 2) {
    return [
      {
        url: buildNavUrl(stops[0], stops[1], null, mode),
        label: buildLabel(stops),
      },
    ];
  }

  // 非驾车 3+ 站：逐段拆分
  const links: NavigationLink[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    links.push({
      url: buildNavUrl(stops[i], stops[i + 1], null, mode),
      label: buildLabel([stops[i], stops[i + 1]]),
    });
  }
  return links;
}

// ---------------------------------------------------------------------------
// 执行入口
// ---------------------------------------------------------------------------

async function execute(params: PlanRouteParams): Promise<PlanRouteResult> {
  const { stops, mode = 'car' } = params;

  if (!stops || stops.length < 2) {
    throw new Error('至少需要 2 个站点才能规划路线');
  }

  const links = generateLinks(stops, mode);

  const markdown = links.map((l) => `[🧭 ${l.label}](${l.url})`).join('\n');

  return { links, markdown };
}

// ---------------------------------------------------------------------------
// 工具定义 & 注册
// ---------------------------------------------------------------------------

const planRouteTool: ToolDefinition<PlanRouteParams, PlanRouteResult> = {
  name: 'plan_route',
  description: [
    '为用户规划出行路线，生成高德地图导航链接。',
    '用户点击链接即可直接打开高德地图开始导航。',
    '',
    '使用场景：',
    '- 用户问"从 A 到 B 怎么走"',
    '- 用户要求规划多地游览路线',
    '- 用户提到出行、导航、路线相关需求',
    '',
    '注意：',
    '- 你需要根据自己的知识提供每个地点的经纬度坐标（中国地区经度约 73~135，纬度约 3~53）',
    '- stops 数组按行程顺序排列，至少 2 个站点',
    '- 工具会返回包含导航链接的 markdown 文本，你必须将其原样附加在回复末尾',
  ].join('\n'),
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      stops: {
        type: SchemaType.ARRAY,
        description: '按行程顺序排列的站点列表，至少 2 个',
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: {
              type: SchemaType.STRING,
              description: '地点名称（中文，如"东方明珠"）',
            },
            longitude: {
              type: SchemaType.NUMBER,
              description: '经度（如 121.4997）',
            },
            latitude: {
              type: SchemaType.NUMBER,
              description: '纬度（如 31.2397）',
            },
          },
          required: ['name', 'longitude', 'latitude'],
        },
      },
      mode: {
        type: SchemaType.STRING,
        description:
          '出行方式: car（驾车，默认）、bus（公交）、walk（步行）、ride（骑行）',
      },
    },
    required: ['stops'],
  },
  execute: async (params) => execute(params),
};

toolRegistry.register(planRouteTool);

export { planRouteTool };
