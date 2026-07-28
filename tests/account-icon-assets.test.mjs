import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const iconNames = ["overview", "inventory", "wallet", "account", "settings"];

test("Account icons keep transparent PNG backgrounds", async () => {
  for (const name of iconNames) {
    const image = await readFile(`public/assets/iruka-icon-${name}.png`);

    assert.equal(image.toString("ascii", 1, 4), "PNG");
    assert.equal(image[25], 6, `${name} icon must use RGBA color`);
  }
});
