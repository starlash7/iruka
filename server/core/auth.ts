import { importSPKI, jwtVerify } from 'jose';
import { ApiError } from './errors.ts';
export type VerifiedIdentity = { privyDid: string };
export type TokenVerifier = (token: string) => Promise<VerifiedIdentity>;
export function createTokenVerifier(config: {appId?:string; verificationKey?:string}): TokenVerifier {
  let key: ReturnType<typeof importSPKI> | undefined;
  return async (token) => {
    if (!config.appId || !config.verificationKey) throw new ApiError('SERVICE_UNAVAILABLE','서버 인증 설정이 필요해요.');
    try {
      key ??= importSPKI(config.verificationKey.replace(/\\n/g,'\n'), 'ES256');
      const {payload} = await jwtVerify(token, await key, {algorithms:['ES256'], issuer:'privy.io', audience:config.appId, requiredClaims:['sub','exp','iat']});
      if (typeof payload.sub !== 'string' || !/^did:privy:[a-zA-Z0-9_-]+$/.test(payload.sub)) throw new Error('Invalid subject');
      return {privyDid:payload.sub};
    } catch { throw new ApiError('UNAUTHORIZED','로그인이 필요해요.'); }
  };
}
export async function authenticateRequest(request: Request, verify: TokenVerifier) {
  const match = /^Bearer ([^\s]+)$/.exec(request.headers.get('authorization') ?? '');
  if (!match) throw new ApiError('UNAUTHORIZED','로그인이 필요해요.');
  return verify(match[1]);
}
