import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("v3.5.4 cleanup xoa .npmrc workspace legacy khi chep source moi de len v3.5.2", () => {
  const cleanup = readFileSync("scripts/don-dep-legacy.mjs", "utf8");
  assert.match(cleanup, /"apps\/api\/\.npmrc"/);
  assert.match(cleanup, /"apps\/web\/\.npmrc"/);
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.match(pkg.scripts.test, /^node scripts\/don-dep-legacy\.mjs &&/);
});
