import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const json = (p) => JSON.parse(readFileSync(p, "utf8"));

test("v3.6.1 tu choi fsevents optional trong strict allowScripts de Docker Web build duoc tren Linux", () => {
  const root = json("package.json");
  assert.equal(root.allowScripts["fsevents@2.3.2"], false);
  assert.equal(root.allowScripts["fsevents@2.3.3"], false);
  assert.equal(root.allowScripts["@scarf/scarf"], false);
  assert.match(readFileSync(".npmrc", "utf8"), /^strict-allow-scripts=true$/m);
});

test("v3.6.1 giu security gate Docker Web va E2E preflight stale-container", () => {
  const docker = readFileSync("apps/web/Dockerfile", "utf8");
  assert.match(docker, /npm install --workspace=@nhienin3d\/web --include-workspace-root=false/);
  assert.match(docker, /npm audit --workspace=@nhienin3d\/web --audit-level=high/);
  const runtime = readFileSync("scripts/e2e-runtime-v361.ps1", "utf8");
  assert.match(runtime, /API đang chạy .*không phải v3\.6\.1/);
  assert.match(runtime, /202609010001_v350_incident_slo_rollup/);
});
