import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.10.4 bo npm ls false-fail va contract nay duoc giu o v3.10.5", () => {
  const ci = read(".github/workflows/ci.yml");
  const verify = read("scripts/kiem-tra.ps1");
  const pkg = JSON.parse(read("package.json"));
  assert.doesNotMatch(ci, /npm ls mysql2 --all/);
  assert.doesNotMatch(verify, /npm ls mysql2 --all/);
  assert.equal(pkg.devDependencies.mysql2, "3.22.0");
  assert.equal(pkg.overrides.mysql2, "$mysql2");
  assert.match(ci, /npm run security:mysql2/);
  assert.match(verify, /npm run security:mysql2/);
});

test("v3.10.4 historical E2E scripts van duoc giu", () => {
  assert.equal(existsSync("scripts/e2e-runtime-v3104.ps1"), true);
  assert.equal(existsSync("scripts/e2e-browser-v3104.mjs"), true);
});
