import type { ApiEnvelope, ApiErrorEnvelope, ChatEvent, TurnRequest } from './contracts.ts';
import { parseChatStream } from './stream.ts';

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId: string;
  constructor(code: string, message: string, status: number, requestId: string) {
    super(message); this.code = code; this.status = status; this.requestId = requestId;
  }
}
export interface ApiClientOptions {
  baseUrl?: string;
  getAccessToken: () => Promise<string | null>;
  fetch?: typeof fetch;
}
export function createApiClient(options: ApiClientOptions) {
  const fetcher = options.fetch ?? globalThis.fetch;
  const baseUrl = (options.baseUrl ?? '').replace(/\/$/, '');
  const send = async (path: string, init: RequestInit): Promise<Response> => {
    if (!path.startsWith('/api/') || path.includes('\\') || path.includes('#')) throw new Error('Expected a local /api/ path');
    init.signal?.throwIfAborted();
    const token = await options.getAccessToken();
    init.signal?.throwIfAborted();
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    else headers.delete('Authorization');
    const response = await fetcher(`${baseUrl}${path}`, { ...init, headers, redirect: 'error' });
    if (!response.ok) {
      let error: ApiErrorEnvelope;
      try { error = await response.json(); }
      catch { throw new ApiClientError('INVALID_RESPONSE', '서버 응답을 확인할 수 없습니다.', response.status, ''); }
      if (!error || typeof error !== 'object' || typeof error.error?.code !== 'string' || typeof error.error?.message !== 'string' || typeof error.requestId !== 'string')
        throw new ApiClientError('INVALID_RESPONSE', '서버 응답을 확인할 수 없습니다.', response.status, '');
      throw new ApiClientError(error.error.code, error.error.message, response.status, error.requestId);
    }
    return response;
  };
  return {
    async request<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
      const response = await send(path, init);
      const envelope = await response.json();
      if (!envelope || typeof envelope !== 'object' || typeof envelope.requestId !== 'string' || !('data' in envelope))
        throw new ApiClientError('INVALID_RESPONSE', '서버 응답을 확인할 수 없습니다.', response.status, '');
      return envelope as ApiEnvelope<T>;
    },
    async *streamTurn(chatId: string, body: TurnRequest, options: { idempotencyKey: string; signal?: AbortSignal }): AsyncGenerator<ChatEvent> {
      if (!options.idempotencyKey.trim()) throw new Error('An idempotency key is required');
      const response = await send(`/api/chats/${encodeURIComponent(chatId)}/turns`, {
        method: 'POST', signal: options.signal,
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', 'Idempotency-Key': options.idempotencyKey },
        body: JSON.stringify(body),
      });
      yield* parseChatStream(response, options.signal);
    },
  };
}
