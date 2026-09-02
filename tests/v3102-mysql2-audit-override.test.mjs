import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.11.0 pin mysql2 3.22.0 de va GHSA-3f6p-5ww8-9rcr ma khong downgrade Prisma", () => {
  const root = JSON.parse(read("package.json"));
  const api = JSON.parse(read("apps/api/package.json"));
  assert.ok(["3.22.0", "$mysql2"].includes(root.overrides?.mysql2));
  assert.equal(api.devDependencies?.prisma, "7.10.0");
  assert.equal(api.dependencies?.["@prisma/client"], "7.10.0");
  assert.equal(api.dependencies?.["@prisma/adapter-pg"], "7.10.0");
});

test("v3.11.0 dong bo Runtime Browser CI va health", () => {
  const root = JSON.parse(read("package.json"));
  const ci = read(".github/workflows/ci.yml");
  const health = read("apps/api/src/suc-khoe/suc-khoe.controller.ts");
  const main = read("apps/api/src/main.ts");
  const runtime = read("scripts/e2e-runtime-v3110.ps1");
  assert.equal(read("VERSION").trim(), "3.12.0");
  assert.equal(root.version, "3.12.0");
  assert.equal(root.scripts["e2e:browser"], "node scripts/e2e-browser-v3120.mjs");
  assert.equal(existsSync("scripts/e2e-runtime-v3110.ps1"), true);
  assert.equal(existsSync("scripts/e2e-browser-v3110.mjs"), true);
  assert.match(ci, /e2e-runtime-v3120\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v3\.12\.0/);
  assert.match(health, /phien_ban: "v3\.12\.0"/);
  assert.match(main, /setVersion\("3\.12\.0"\)/);
  assert.match(runtime, /202609020001_v3110_distributed_probe_dlq_keyring_oncall_archive/);
});
