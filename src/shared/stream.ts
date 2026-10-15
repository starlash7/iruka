import type { ChatEvent } from './contracts.ts';

export class StreamProtocolError extends Error {}
function parseEvent(data: string, name: string): ChatEvent {
  let value: Record<string, unknown>;
  try { value = JSON.parse(data); } catch { throw new StreamProtocolError('Invalid SSE JSON'); }
  return validateChatEvent(value, name);
}

/** Validate and project public fields before either side exposes provider data. */
export function validateChatEvent(input: unknown, name = ''): ChatEvent {
  const value = input as Record<string, unknown>;
  if (!value || typeof value !== 'object' || typeof value.requestId !== 'string' || !value.requestId ||
      !Number.isSafeInteger(value.sequence) || (value.sequence as number) < 0 ||
      (name !== '' && name !== value.type)) throw new StreamProtocolError('Invalid SSE envelope');
  const string = (key: string) => typeof value[key] === 'string';
  const number = (key: string) => typeof value[key] === 'number' && Number.isFinite(value[key]) && (value[key] as number) >= 0;
  let valid = false;
  let fields: string[] = [];
  switch (value.type) {
    case 'ready': fields = ["turnId"]; valid = string('turnId'); break;
    case 'delta': fields = ["text"]; valid = string('text'); break;
    case 'image': fields = ["url", "alt"]; valid = string('url') && string('alt'); break;
    case 'status': fields = ["status"]; valid = string('status'); break;
    case 'ending': fields = ["endingId", "title"]; valid = string('endingId') && string('title'); break;
    case 'usage': fields = ["inputTokens", "outputTokens", "credits"]; valid = number('inputTokens') && number('outputTokens') && number('credits'); break;
    case 'done': fields = ["turnId", "status", "messageId"]; valid = string('turnId') && ['completed', 'cancelled'].includes(value.status as string) && (value.messageId === null || string('messageId')); break;
    case 'error': fields = ["code", "message"]; valid = string('code') && string('message'); break;
  }
  if (!valid) throw new StreamProtocolError('Invalid SSE event payload');
  return Object.fromEntries(['type', 'requestId', 'sequence', ...fields].map(key => [key, value[key]])) as ChatEvent;
}

/** UTF-8 decoding and line buffering survive arbitrary byte boundaries, CRLF and multiline data. */
export async function* parseChatStream(response: Response, signal?: AbortSignal): AsyncGenerator<ChatEvent> {
  if (!response.headers.get('content-type')?.toLowerCase().startsWith('text/event-stream') || !response.body)
    throw new StreamProtocolError('Expected an SSE response');
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let buffer = '', name = '', data: string[] = [];
  let terminal = false, sequence = -1, requestId: string | undefined;
  const abort = () => { void reader.cancel(signal?.reason).catch(() => {}); };
  signal?.addEventListener('abort', abort, { once: true });
  const processLine = (line: string): ChatEvent | undefined => {
    if (line === '') {
      if (data.length === 0) { name = ''; return; }
      const event = parseEvent(data.join('\n'), name);
      data = []; name = '';
      if (terminal || event.sequence <= sequence || (requestId !== undefined && requestId !== event.requestId))
        throw new StreamProtocolError('Invalid SSE event order');
      requestId = event.requestId; sequence = event.sequence;
      terminal = event.type === 'done' || event.type === 'error';
      return event;
    }
    if (line.startsWith(':')) return;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    const raw = colon === -1 ? '' : line.slice(colon + 1);
    const value = raw.startsWith(' ') ? raw.slice(1) : raw;
    if (field === 'data') data.push(value);
    if (field === 'event') name = value;
  };
  try {
    signal?.throwIfAborted();
    while (true) {
      const { value, done } = await reader.read();
      signal?.throwIfAborted();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newline).replace(/\r$/, '');
        buffer = buffer.slice(newline + 1);
        const event = processLine(line);
        if (event) yield event;
      }
      if (done) break;
    }
    if (buffer.trim() || data.length || !terminal) throw new StreamProtocolError('Incomplete SSE stream');
  } finally {
    signal?.removeEventListener('abort', abort);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
