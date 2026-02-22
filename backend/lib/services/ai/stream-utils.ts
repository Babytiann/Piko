import type {
  EnhancedGenerateContentResponse,
  GenerateContentStreamResult,
} from '@google/generative-ai';

export function prependChunkToStream(
  firstChunk: EnhancedGenerateContentResponse,
  remainingIterator: AsyncIterator<EnhancedGenerateContentResponse>,
  responsePromise: Promise<EnhancedGenerateContentResponse>,
): GenerateContentStreamResult {
  let yieldedFirst = false;

  const stream = {
    [Symbol.asyncIterator]() {
      return {
        async next(): Promise<
          IteratorResult<EnhancedGenerateContentResponse, undefined>
        > {
          if (!yieldedFirst) {
            yieldedFirst = true;
            return { done: false, value: firstChunk };
          }
          // 委托给原始 iterator 的剩余部分
          const result = await remainingIterator.next();
          if (result.done) {
            return { done: true as const, value: undefined };
          }
          return {
            done: false,
            value: result.value as EnhancedGenerateContentResponse,
          };
        },
      };
    },
  };

  return {
    stream,
    response: responsePromise,
  } as unknown as GenerateContentStreamResult;
}

/** 每个模拟 chunk 的大小（字符数） */
const SIMULATED_CHUNK_SIZE = 18;
/** 模拟 chunk 之间的延迟（毫秒） */
const SIMULATED_CHUNK_DELAY_MS = 16;

/**
 * 兜底用：当出现需要手动回退为文本流的异常场景时，把一段文本模拟成流式输出。
 *
 * 主路径已改用 sendMessageStream + peek 实现真流式，
 * 这个函数仅在以下场景使用：
 * - 后端主动降级为文本输出
 */
export function createStreamFromText(
  text: string,
): GenerateContentStreamResult {
  // 把文本拆成小块
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += SIMULATED_CHUNK_SIZE) {
    chunks.push(text.slice(i, i + SIMULATED_CHUNK_SIZE));
  }

  let index = 0;

  const stream = {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          if (index >= chunks.length) {
            return { done: true as const, value: undefined };
          }
          // 第一块立即返回，后续块加延迟
          if (index > 0) {
            await new Promise((r) => setTimeout(r, SIMULATED_CHUNK_DELAY_MS));
          }
          const chunk = chunks[index++]!;
          return {
            done: false as const,
            value: { text: () => chunk },
          };
        },
      };
    },
  };

  return {
    stream,
    response: Promise.resolve({
      text: () => text,
      candidates: [
        {
          content: { role: 'model', parts: [{ text }] },
        },
      ],
    }),
  } as unknown as GenerateContentStreamResult;
}
