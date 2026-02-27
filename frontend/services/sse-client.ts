import { API_HOST } from '@/common/config';
import { authClient } from '@/services/auth-client';

interface SSEEvent {
  event: string;
  data: string;
}

interface SSEClientOptions {
  path: string;
  body: Record<string, unknown>;
  onEvent: (event: SSEEvent) => void;
  onError: (error: string) => void;
  onDone?: () => void;
}

export function createSSEClient({
  path,
  body,
  onEvent,
  onError,
  onDone,
}: SSEClientOptions): () => void {
  const xhr = new XMLHttpRequest();
  let lastIndex = 0;
  let buffer = '';
  let finished = false;

  function processNewData(): void {
    if (finished) return;
    const newText = xhr.responseText.slice(lastIndex);
    lastIndex = xhr.responseText.length;
    if (!newText) return;

    buffer += newText;
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      if (!part.trim()) continue;
      let eventType = 'message';
      let dataStr = '';

      for (const line of part.split('\n')) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataStr += line.slice(5).trim();
        }
      }

      if (dataStr) {
        onEvent({ event: eventType, data: dataStr });
      }
    }
  }

  const url = `${API_HOST}/piko/${path}`;
  xhr.open('POST', url);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Accept', 'text/event-stream');
  const cookie = authClient.getCookie();
  if (cookie) xhr.setRequestHeader('Cookie', cookie);
  xhr.timeout = 120_000;

  xhr.onprogress = processNewData;

  xhr.onload = () => {
    processNewData();
    if (!finished) {
      finished = true;
      onDone?.();
    }
  };

  xhr.onerror = () => {
    if (!finished) {
      finished = true;
      onError('连接中断，请稍后重试');
    }
  };

  xhr.ontimeout = () => {
    if (!finished) {
      finished = true;
      onError('请求超时，请稍后重试');
    }
  };

  xhr.send(JSON.stringify(body));

  return () => {
    finished = true;
    xhr.abort();
  };
}
