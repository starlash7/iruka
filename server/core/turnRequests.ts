import { createHash } from 'node:crypto';
import type { Database } from '../db/index.ts';
import type { TurnRequest } from '../../src/shared/contracts.ts';
import { ApiError } from './errors.ts';
import { getOwnedChat } from './chats.ts';

export type TurnStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'aborted';
export type TerminalTurnStatus = Exclude<TurnStatus, 'pending' | 'running'>;
export interface TurnResult { turnId: string; status: TurnStatus; response: unknown }
export interface BeginTurnResult extends TurnResult { state: 'new' | 'replay' | 'in_progress' }
type TurnRow = { id: string; payload_hash: string; status: TurnStatus; response: unknown };
const terminal = (status: TurnStatus) => status !== 'pending' && status !== 'running';
const result = (row: TurnRow): TurnResult => ({ turnId: row.id, status: row.status, response: row.response });

/** Claims a pending turn. A replay/in_progress result must never invoke the model again. */
export async function beginTurnRequest(db: Database, input: {
  userId: string; chatId: string; idempotencyKey: string; body: TurnRequest;
}): Promise<BeginTurnResult> {
  const { userId, chatId, idempotencyKey, body } = input;
  if (!idempotencyKey || idempotencyKey.length > 200) {
    throw new ApiError('INVALID_REQUEST', '유효한 요청 키가 필요해요.');
  }
  // Explicit ordering and fields keep equivalent request objects byte-identical.
  const hash = createHash('sha256').update(JSON.stringify({
    chatId, content: body.content, parentMessageId: body.parentMessageId, model: body.model,
  })).digest('hex');
  return db.transaction(async tx => {
    await getOwnedChat(tx, chatId, userId);
    const inserted = await tx.query<TurnRow>(`
      INSERT INTO turn_requests(user_id,chat_id,idempotency_key,payload_hash)
      VALUES ($1,$2,$3,$4) ON CONFLICT(user_id,idempotency_key) DO NOTHING
      RETURNING id,payload_hash,status,response`, [userId, chatId, idempotencyKey, hash]);
    if (inserted.rows[0]) return { ...result(inserted.rows[0]), state: 'new' };
    const { rows } = await tx.query<TurnRow>(`
      SELECT id,payload_hash,status,response FROM turn_requests
      WHERE user_id=$1 AND idempotency_key=$2`, [userId, idempotencyKey]);
    const row = rows[0];
    if (row.payload_hash !== hash) throw new ApiError('CONFLICT', '같은 요청 키에 다른 내용을 사용할 수 없어요.');
    return { ...result(row), state: terminal(row.status) ? 'replay' : 'in_progress' };
  });
}

/** Terminal retries return the persisted response; credit changes belong in the caller's transaction. */
export async function finishTurnRequest(db: Database, input: {
  userId: string; turnId: string; status: TerminalTurnStatus; response: unknown;
}): Promise<TurnResult> {
  return db.transaction(async tx => {
    const updated = await tx.query<TurnRow>(`
      UPDATE turn_requests SET status=$3,response=$4
      WHERE id=$1 AND user_id=$2 AND status IN ('pending','running')
      RETURNING id,payload_hash,status,response`,
    [input.turnId, input.userId, input.status, JSON.stringify(input.response)]);
    if (updated.rows[0]) return result(updated.rows[0]);
    const { rows } = await tx.query<TurnRow>(`
      SELECT id,payload_hash,status,response FROM turn_requests WHERE id=$1 AND user_id=$2`,
    [input.turnId, input.userId]);
    if (!rows[0]) throw new ApiError('NOT_FOUND', '요청을 찾을 수 없어요.');
    if (rows[0].status !== input.status) throw new ApiError('CONFLICT', '이미 확정된 요청 결과를 바꿀 수 없어요.');
    return result(rows[0]);
  });
}
