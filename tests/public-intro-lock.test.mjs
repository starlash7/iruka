import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const appSource = await readFile(
  new URL("../src/App.tsx", import.meta.url),
  "utf8"
);
const entrySource = await readFile(
  new URL("../src/HomeEntry.tsx", import.meta.url),
  "utf8"
);

test("production visitors stay on intro even with a deep link", () => {
  assert.match(appSource, /shouldShowHomeEntryForEnvironment\(import\.meta\.env\.PROD/);
  assert.match(appSource, /isIntroOnlyEnvironment\(import\.meta\.env\.PROD\)/);
  assert.match(appSource, /canEnter=\{!isIntroOnlyEnvironment\(import\.meta\.env\.PROD\)\}/);
  assert.match(
    appSource,
    /function enterHome\(\) \{[\s\S]*?if \(isIntroOnlyEnvironment\(import\.meta\.env\.PROD\)\) return;/
  );
});

test("the intro entry supports a disabled product action", () => {
  assert.match(entrySource, /canEnter\?: boolean/);
  assert.match(entrySource, /disabled=\{canEnter === false\}/);
});
