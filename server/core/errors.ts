import { ServiceUnavailableError } from './interfaces.ts';
export type ErrorCode = 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INVALID_REQUEST' | 'CONFLICT' | 'SERVICE_UNAVAILABLE' | 'INTERNAL_ERROR';
const statuses: Record<ErrorCode, number> = { UNAUTHORIZED:401, FORBIDDEN:403, NOT_FOUND:404, INVALID_REQUEST:400, CONFLICT:409, SERVICE_UNAVAILABLE:503, INTERNAL_ERROR:500 };
export class ApiError extends Error {
  code: ErrorCode;
  status: number;
  constructor(code: ErrorCode, message: string) { super(message); this.code = code; this.status = statuses[code]; }
}
export function toApiError(error: unknown): ApiError {
  if (error instanceof ServiceUnavailableError) return new ApiError('SERVICE_UNAVAILABLE', error.message);
  return error instanceof ApiError ? error : new ApiError('INTERNAL_ERROR', '요청을 처리하지 못했어요.');
}
