import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfigFromFile } from 'vite';

test('build configuration rejects an unknown deployment before emitting assets', async () => {
  const previous = process.env.VITE_IRUKA_DEPLOYMENT;
  process.env.VITE_IRUKA_DEPLOYMENT = 'unknown';
  try {
    await assert.rejects(loadConfigFromFile({command: 'build', mode: 'production'}), /Unknown Iruka deployment/);
  } finally {
    if (previous === undefined) delete process.env.VITE_IRUKA_DEPLOYMENT;
    else process.env.VITE_IRUKA_DEPLOYMENT = previous;
  }
});
