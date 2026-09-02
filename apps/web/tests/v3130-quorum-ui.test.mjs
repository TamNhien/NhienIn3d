import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("v3.13.0 Ops Dashboard hien quorum anomaly va Ed25519 state", () => {
  const page = read("../app/quan-tri/ops/page.tsx");
  const css = read("../app/quan-tri/ops/page.module.css");
  const lib = read("../lib/quan-tri.ts");
  assert.match(page, />Multi-region quorum · anomaly detection</);
  assert.match(page, /runtime\?\.multi_region_quorum\?\.summary\.quorum_ok/);
  assert.match(page, /Ed25519 public key/);
  assert.match(page, /QUORUM OK/);
  assert.match(css, /\.quorumList\{/);
  assert.match(css, /\.quorumOk\{/);
  assert.match(lib, /export type OpsMultiRegionQuorum/);
  assert.match(lib, /asymmetric_probe_signing/);
});
