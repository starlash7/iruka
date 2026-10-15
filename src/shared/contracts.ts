/** Wire contracts shared by browser and server. Dates are ISO-8601 strings. */
export interface UserDto { id: string; privyDid: string; displayName: string | null; createdAt: string }
export interface ProfileDto { nickname: string; bio: string; avatar: string | null }
export interface PersonaDto { id: string; userId: string; name: string; description: string; createdAt: string }
export interface PublicWorkDto {
  id: string; creatorId: string; mode: 'character' | 'story'; title: string;
  description: string; coverUrl: string | null; tags: string[];
  publishedVersionId: string | null; createdAt: string;
}
export interface PublicWorkDetailDto extends PublicWorkDto { snapshot: PublicWorkSnapshot | null }
/** Only an authenticated creator may receive this DTO. Never spread it into public responses. */
export interface PrivateWorkVersionDto {
  id: string; workId: string; version: number; systemPrompt: string;
  hiddenSettings: Record<string, unknown>; publicSnapshot: Partial<PublicWorkSnapshot>; createdAt: string;
}
export interface CreatorWorkDto { work: PublicWorkDto; versions: PrivateWorkVersionDto[] }
export interface ChatDto {
  id: string; userId: string; workId: string; workVersionId: string;
  personaSnapshot: { name: string; description: string } | null;
  activeMessageId: string | null; createdAt: string;
}
export interface MessageDto {
  id: string; chatId: string; parentMessageId: string | null;
  role: 'user' | 'assistant'; content: string; createdAt: string;
}
export interface TurnRequest { content: string; parentMessageId: string | null; model: string }
export interface ApiEnvelope<T> { data: T; requestId: string }
export interface ApiErrorEnvelope { error: { code: string; message: string }; requestId: string }
export type ChatEvent = { requestId: string; sequence: number } & (
  | { type: 'ready'; turnId: string }
  | { type: 'delta'; text: string }
  | { type: 'image'; url: string; alt: string }
  | { type: 'status'; status: string }
  | { type: 'ending'; endingId: string; title: string }
  | { type: 'usage'; inputTokens: number; outputTokens: number; credits: number }
  | { type: 'done'; turnId: string; status: 'completed' | 'cancelled'; messageId: string | null }
  | { type: 'error'; code: string; message: string }
);
export interface CreditBalanceDto { available: number; reserved: number }
export interface CreditReservation { turnId: string; reserved: number; state: 'reserved' | 'completed' | 'released' }

/** Public version content; character details and opening contexts live only in privateConfig. */
export interface PublicWorkSnapshot {
  tagline: string;
  playGuide: string;
  characters: Array<{ id: string; name: string; imageUrl: string | null }>;
  openings: Array<{
    id: string; title: string; prologue: string; firstMessage: string;
    suggestedReplies: string[];
  }>;
}
export interface PrivateWorkConfig {
  systemPrompt: string;
  outputRules: string;
  statusTemplate: string;
  characterSettings: Array<{ characterId: string; description: string; speechStyle: string }>;
  examples: Array<{ user: string; assistant: string }>;
  openingContexts: Array<{ openingId: string; hiddenContext: string }>;
  lorebook: Array<{
    id: string; category: string; keywords: string[]; content: string;
    hidden: boolean; priority: number; alwaysOn: boolean;
  }>;
  endings: Array<{ id: string; title: string; condition: string; text: string; imageUrl: string | null }>;
}
/** Creation omits id; editing identifies an owned draft. Publishing is a separate operation. */
export interface WorkDraftInput {
  id?: string;
  mode: 'character' | 'story';
  title: string;
  description: string;
  coverUrl: string | null;
  tags: string[];
  publicSnapshot: PublicWorkSnapshot;
  privateConfig: PrivateWorkConfig;
}
