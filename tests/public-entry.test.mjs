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

test("public visitors can enter the product and open deep links", () => {
  assert.match(appSource, /return window\.location\.hash\.length === 0;/);
  assert.match(appSource, /setShowHomeEntry\(shouldShowHomeEntry\(\)\)/);
  assert.doesNotMatch(appSource, /isIntroOnlyEnvironment|import\.meta\.env\.PROD/);
  assert.match(
    appSource,
    /function enterHome\(\) \{\s*setShowHomeEntry\(false\);/
  );
  assert.match(appSource, /onEnter=\{enterHome\}/);
});

test("the intro entry is enabled by default and supports an explicit lock", () => {
  assert.match(entrySource, /canEnter = true/);
  assert.match(entrySource, /canEnter\?: boolean/);
  assert.match(entrySource, /aria-disabled=\{canEnter === false \|\| undefined\}/);
  assert.match(entrySource, /onClick=\{canEnter === false \? undefined : onEnter\}/);
  assert.match(entrySource, /tabIndex=\{canEnter === false \? -1 : undefined\}/);
  assert.doesNotMatch(entrySource, /disabled=\{canEnter === false\}/);
});
