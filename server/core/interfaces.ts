import type { ChatEvent, CreatorWorkDto, CreditBalanceDto, CreditReservation, PrivateWorkVersionDto, PublicWorkDetailDto, PublicWorkDto, TurnRequest, WorkDraftInput } from '../../src/shared/contracts.ts';
import type { Database } from '../db/index.ts';

export interface StreamTurnInput {
  userId: string; chatId: string; requestId: string; idempotencyKey: string;
  body: TurnRequest; signal: AbortSignal;
}
export interface StreamService { streamTurn(input: StreamTurnInput): AsyncIterable<ChatEvent> }
export interface DiscoveryService { listWorks(): Promise<PublicWorkDto[]>; getWork(workId: string): Promise<PublicWorkDetailDto | null> }
/** Every operation must atomically validate user ownership and deduplicate by turnId.
 * Same reserve payload replays; changed payload conflicts. Terminal states never change.
 * Completion charges actualCredits <= reserved and releases the remainder atomically.
 * Failure/cancellation releases the entire reservation. Repeated terminal calls replay.
 */
export interface CreditsService {
  getBalance(userId: string): Promise<CreditBalanceDto>;
  reserveTurn(input: { userId: string; turnId: string; credits: number }): Promise<CreditReservation>;
  completeTurn(input: { userId: string; turnId: string; actualCredits: number }): Promise<CreditReservation>;
  releaseTurn(input: { userId: string; turnId: string; reason: 'failed' | 'cancelled' }): Promise<CreditReservation>;
}
export interface ApiServices { stream: StreamService; discovery: DiscoveryService; credits: CreditsService }
export class ServiceUnavailableError extends Error {
  readonly code = 'SERVICE_UNAVAILABLE';
  readonly status = 503;
  constructor() { super('이 기능은 아직 준비 중입니다.'); }
}
const unavailable = async (): Promise<never> => { throw new ServiceUnavailableError(); };
/** Fail closed until a real implementation is explicitly injected. */
export function createUnavailableServices(): ApiServices {
  return {
    stream: { async *streamTurn() { throw new ServiceUnavailableError(); } },
    discovery: { listWorks: unavailable, getWork: unavailable },
    credits: { getBalance: unavailable, reserveTurn: unavailable, completeTurn: unavailable, releaseTurn: unavailable },
  };
}

export interface ModelMessage { role: 'system' | 'user' | 'assistant'; content: string }
export interface ModelStreamInput { messages: readonly ModelMessage[]; signal: AbortSignal }
export type ModelEvent =
  | { type: 'delta'; text: string }
  | { type: 'usage'; inputTokens: number; outputTokens: number };
export interface ModelService { stream(input: ModelStreamInput): AsyncIterable<ModelEvent> }
export interface StudioService {
  getWork(userId: string, id: string): Promise<CreatorWorkDto>;
  saveDraft(userId: string, input: WorkDraftInput): Promise<CreatorWorkDto>;
  publishVersion(userId: string, id: string): Promise<PrivateWorkVersionDto>;
}
/** A–D export these factory signatures from their owned server modules. */
export interface ChatServiceDependencies { db: Database; model: ModelService; credits: CreditsService }
export interface StudioServiceDependencies { db: Database }
export interface DiscoveryServiceDependencies { db: Database }
export interface CreditsServiceDependencies { db: Database }
export type CreateChatService = (dependencies: ChatServiceDependencies) => StreamService;
export type CreateStudioService = (dependencies: StudioServiceDependencies) => StudioService;
export type CreateDiscoveryService = (dependencies: DiscoveryServiceDependencies) => DiscoveryService;
export type CreateCreditsService = (dependencies: CreditsServiceDependencies) => CreditsService;
