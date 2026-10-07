import assert from "node:assert/strict";
import { test } from "node:test";
import { createPullSession } from "../src/pullSession.ts";

test("logout invalidates a deferred result even after the same wallet returns", async () => {
  const session = createPullSession();
  const original = session.updateWallet("0xAbc");
  let resolve!: () => void;
  const pending = new Promise<void>((done) => { resolve = done; });
  let revealed = false;
  const completion = pending.then(() => { if (session.isCurrent(original)) revealed = true; });
  session.updateWallet(undefined);
  session.updateWallet("0xAbc");
  resolve();
  await completion;
  assert.equal(revealed, false);
});

test("wallet switches invalidate previous work while equivalent addresses preserve it", () => {
  const session = createPullSession();
  const first = session.updateWallet("0xAbc");
  assert.equal(session.updateWallet("0xabc"), first);
  assert.equal(session.isCurrent(first), true);
  const second = session.updateWallet("0xDef");
  assert.equal(session.isCurrent(first), false);
  assert.equal(session.isCurrent(second), true);
});
