import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.10.5 pin mysql2 3.22.0 de va GHSA-3f6p-5ww8-9rcr ma khong downgrade Prisma", () => {
  const root = JSON.parse(read("package.json"));
  const api = JSON.parse(read("apps/api/package.json"));
  assert.ok(["3.22.0", "$mysql2"].includes(root.overrides?.mysql2));
  assert.equal(api.devDependencies?.prisma, "7.10.0");
  assert.equal(api.dependencies?.["@prisma/client"], "7.10.0");
  assert.equal(api.dependencies?.["@prisma/adapter-pg"], "7.10.0");
});

test("v3.10.5 dong bo Runtime Browser CI va health", () => {
  const root = JSON.parse(read("package.json"));
  const ci = read(".github/workflows/ci.yml");
  const health = read("apps/api/src/suc-khoe/suc-khoe.controller.ts");
  const main = read("apps/api/src/main.ts");
  const runtime = read("scripts/e2e-runtime-v3105.ps1");
  assert.equal(read("VERSION").trim(), "3.10.5");
  assert.equal(root.version, "3.10.5");
  assert.equal(root.scripts["e2e:browser"], "node scripts/e2e-browser-v3105.mjs");
  assert.equal(existsSync("scripts/e2e-runtime-v3105.ps1"), true);
  assert.equal(existsSync("scripts/e2e-browser-v3105.mjs"), true);
  assert.match(ci, /e2e-runtime-v3105\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v3\.10\.5/);
  assert.match(health, /phien_ban: "v3\.10\.5"/);
  assert.match(main, /setVersion\("3\.10\.5"\)/);
  assert.match(runtime, /202609010003_v3100_ops_persistence_dlq_oncall/);
});
