import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("v3.13.0 API runtime co quorum anomaly va asymmetric signing", () => {
  const service = read("../src/quan-tri/quan-tri.service.ts");
  const controller = read("../src/quan-tri/quan-tri.controller.ts");
  const probe = read("../src/quan-tri/probe-agent.controller.ts");
  assert.match(service, /multi_region_quorum/);
  assert.match(service, /asymmetric_probe_signing/);
  assert.match(service, /ED25519_PUBLIC_KEYRING/);
  assert.match(service, /QUORUM_OK/);
  assert.match(service, /DEGRADED/);
  assert.match(controller, /trang_thai_ops_v3140/);
  assert.match(probe, /x-nhienin3d-signature-alg/);
});

test("v3.13.0 API health va OpenAPI dong bo version", () => {
  const health = read("../src/suc-khoe/suc-khoe.controller.ts");
  const main = read("../src/main.ts");
  assert.match(health, /phien_ban: "v3\.14\.0"/);
  assert.match(main, /setVersion\("3\.14\.0"\)/);
});
