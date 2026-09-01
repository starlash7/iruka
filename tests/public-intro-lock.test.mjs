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

test("the intro entry locks production without dimming the product action", () => {
  assert.match(entrySource, /canEnter\?: boolean/);
  assert.match(entrySource, /aria-disabled=\{canEnter === false \|\| undefined\}/);
  assert.match(entrySource, /onClick=\{canEnter === false \? undefined : onEnter\}/);
  assert.match(entrySource, /tabIndex=\{canEnter === false \? -1 : undefined\}/);
  assert.doesNotMatch(entrySource, /disabled=\{canEnter === false\}/);
});
