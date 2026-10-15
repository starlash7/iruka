import type { ChatEvent } from '../../src/shared/contracts.ts';
import type { ModelEvent, ModelService, ModelStreamInput, StreamService, StreamTurnInput } from './interfaces.ts';

/** Test-only provider. Construct and inject explicitly; never selected by environment. */
export class TestStreamService implements StreamService {
  private readonly chunks: readonly string[];
  constructor(chunks: readonly string[]) { this.chunks = chunks; }
  async *streamTurn(input: StreamTurnInput): AsyncIterable<ChatEvent> {
    let sequence = 0;
    const turnId = `test:${input.idempotencyKey}`;
    const base = () => ({ requestId: input.requestId, sequence: sequence++ });
    yield { ...base(), type: 'ready', turnId };
    for (const text of this.chunks) {
      if (input.signal.aborted) break;
      yield { ...base(), type: 'delta', text };
    }
    yield { ...base(), type: 'done', turnId, status: input.signal.aborted ? 'cancelled' : 'completed', messageId: null };
  }
}

/** Deterministic provider fixture; no authentication, network calls or environment switches. */
export class TestModelService implements ModelService {
  private readonly chunks: readonly string[];
  private readonly usage: { inputTokens: number; outputTokens: number };
  constructor(chunks: readonly string[], usage: { inputTokens: number; outputTokens: number }) {
    this.chunks = [...chunks];
    this.usage = { ...usage };
  }
  async *stream({ signal }: ModelStreamInput): AsyncIterable<ModelEvent> {
    signal.throwIfAborted();
    for (const text of this.chunks) {
      signal.throwIfAborted();
      yield { type: 'delta', text };
    }
    signal.throwIfAborted();
    yield { type: 'usage', ...this.usage };
  }
}
