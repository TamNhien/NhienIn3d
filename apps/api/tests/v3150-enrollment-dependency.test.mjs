import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("v3.15.0 API probe enrollment one-time Ed25519 va metadata persistent", () => {
  const service = read("../src/quan-tri/quan-tri.service.ts");
  const publicController = read("../src/quan-tri/probe-agent.controller.ts");
  const adminController = read("../src/quan-tri/quan-tri.controller.ts");
  assert.match(service, /tao_probe_enrollment_token_v3150/);
  assert.match(service, /probe_agent_enroll_v3150/);
  assert.match(service, /sloProbeNonce\.create/);
  assert.match(service, /enrollment_v3150/);
  assert.match(service, /ED25519-ENROLLED-v3150/);
  assert.match(publicController, /@Post\("enroll"\)/);
  assert.match(adminController, /probe-enrollment-token/);
});

test("v3.15.0 API service dependency blast radius runtime va version", () => {
  const service = read("../src/quan-tri/quan-tri.service.ts");
  const controller = read("../src/quan-tri/quan-tri.controller.ts");
  const health = read("../src/suc-khoe/suc-khoe.controller.ts");
  const main = read("../src/main.ts");
  assert.match(service, /phan_tich_blast_radius_v3150/);
  assert.match(service, /trang_thai_ops_v3170/);
  assert.match(service, /service_dependency/);
  assert.match(service, /probe_enrollment/);
  assert.match(controller, /trang_thai_ops_v3170/);
  assert.match(health, /phien_ban: "v3\.17\.0"/);
  assert.match(main, /setVersion\("3\.17\.0"\)/);
});
