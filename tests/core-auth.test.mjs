import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, exportSPKI, SignJWT } from 'jose';
import { createTokenVerifier } from '../server/core/auth.ts';
const keys = await generateKeyPair('ES256');
const verify = createTokenVerifier({ appId: 'test-app', verificationKey: await exportSPKI(keys.publicKey) });
async function sign(overrides = {}, privateKey = keys.privateKey) {
  return new SignJWT({ iss: 'privy.io', aud: 'test-app', sub: 'did:privy:alice', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+60, ...overrides }).setProtectedHeader({alg:'ES256'}).sign(privateKey);
}
test('verifies DID without wallet or email claims', async () => {
  assert.deepEqual(await verify(await sign()), { privyDid:'did:privy:alice' });
});
test('rejects expired, wrong issuer/audience, absent expiry and bad subjects', async () => {
  for (const fields of [{exp:1},{iss:'attacker'},{aud:'other'},{exp:undefined},{sub:'alice'},{sub:''}]) {
    await assert.rejects(verify(await sign(fields)), error => error.code === 'UNAUTHORIZED');
  }
});
test('rejects forged and malformed tokens', async () => {
  const other = await generateKeyPair('ES256');
  for (const token of ['garbage', await sign({},other.privateKey)]) await assert.rejects(verify(token), error=>error.code==='UNAUTHORIZED');
});
test('missing server configuration fails closed', async () => {
  await assert.rejects(createTokenVerifier({})(await sign()), error=>error.code==='SERVICE_UNAVAILABLE');
});
