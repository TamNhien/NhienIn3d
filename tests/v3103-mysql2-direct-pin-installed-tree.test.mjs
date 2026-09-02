import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.10.3 giu direct pin mysql2 3.22.0 va linked override", () => {
  const root = JSON.parse(read("package.json"));
  assert.equal(root.devDependencies?.mysql2, "3.22.0");
  assert.equal(root.overrides?.mysql2, "$mysql2");
  assert.equal(root.scripts?.["security:mysql2"], "node scripts/kiem-tra-mysql2-security.mjs");
  assert.match(root.scripts?.["audit:security"] || "", /security:mysql2/);
});

test("v3.10.3 security checker van khoa mysql2 >=3.22.0", () => {
  const script = read("scripts/kiem-tra-mysql2-security.mjs");
  assert.match(script, /3, 22, 0/);
  assert.match(script, /mysql2/);
});

test("v3.10.3 historical runtime browser scripts van duoc giu", () => {
  assert.equal(existsSync("scripts/e2e-runtime-v3103.ps1"), true);
  assert.equal(existsSync("scripts/e2e-browser-v3103.mjs"), true);
});
