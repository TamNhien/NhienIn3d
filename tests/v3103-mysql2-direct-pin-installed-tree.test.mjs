import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.10.3 khai bao mysql2 truc tiep va override tham chieu cung spec", () => {
  const root = JSON.parse(read("package.json"));
  assert.equal(root.devDependencies?.mysql2, "3.22.0");
  assert.equal(root.overrides?.mysql2, "$mysql2");
  assert.equal(root.scripts?.["security:mysql2"], "node scripts/kiem-tra-mysql2-security.mjs");
  assert.match(root.scripts?.["audit:security"] || "", /security:mysql2/);
});

test("v3.10.3 kiem tra installed mysql2 tree thay vi chi kiem package override", () => {
  const script = read("scripts/kiem-tra-mysql2-security.mjs");
  const verify = read("scripts/kiem-tra.ps1");
  assert.match(script, /node_modules\/mysql2\/package\.json/);
  assert.match(script, /3, 22, 0/);
  assert.match(verify, /npm ls mysql2 --all/);
  assert.match(verify, /npm run security:mysql2/);
  const ci = read(".github/workflows/ci.yml");
  assert.match(ci, /npm ls mysql2 --all/);
  assert.match(ci, /npm run security:mysql2/);
});

test("v3.10.3 dong bo Runtime Browser CI va health", () => {
  const root = JSON.parse(read("package.json"));
  const ci = read(".github/workflows/ci.yml");
  const health = read("apps/api/src/suc-khoe/suc-khoe.controller.ts");
  const main = read("apps/api/src/main.ts");
  assert.equal(read("VERSION").trim(), "3.10.3");
  assert.equal(root.version, "3.10.3");
  assert.equal(root.scripts["e2e:browser"], "node scripts/e2e-browser-v3103.mjs");
  assert.equal(existsSync("scripts/e2e-runtime-v3103.ps1"), true);
  assert.equal(existsSync("scripts/e2e-browser-v3103.mjs"), true);
  assert.match(ci, /e2e-runtime-v3103\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v3\.10\.3/);
  assert.match(health, /phien_ban: "v3\.10\.3"/);
  assert.match(main, /setVersion\("3\.10\.3"\)/);
});
