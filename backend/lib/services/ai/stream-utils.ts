/**
 * 流式输出辅助函数。
 *
 * - prependChunkToStream: 把 peek 过的 chunk 拼回流
 * - createStreamFromText: 纯文本模拟成流式输出（仅用于兜底）
 */

import type {
  EnhancedGenerateContentResponse,
  GenerateContentStreamResult,
} from '@google/generative-ai';

/**
 * 将已 peek 过的第一个 chunk 和剩余 iterator 重新组装成 GenerateContentStreamResult。
 * 这样路由层完全不用改 —— 拿到的仍是标准 stream 接口，
 * 只是第一个 chunk 已经被我们提前读过了。
 */
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
 * 兜底用：当达到最大步数等异常情况时，把一段文本模拟成流式输出。
 *
 * 主路径已改用 sendMessageStream + peek 实现真流式，
 * 这个函数仅在以下场景使用：
 * - 达到 MAX_REACT_STEPS 上限时的错误提示
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
