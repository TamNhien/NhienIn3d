import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.22.0 Ops UI hien rollout envelope receipt va recovery trust anchor", () => {
  const page = read("app/quan-tri/ops/page.tsx");
  const lib = read("lib/quan-tri.ts");
  assert.match(page, /OPS v3\.22\.0/);
  assert.match(page, /immutable envelope \+ decision receipt/);
  assert.match(page, /proposal_envelope_sha256_valid/);
  assert.match(page, /decision_receipt_sha256_valid/);
  assert.match(page, /trust anchor/);
  assert.match(page, /evidence_key_trusted/);
  assert.match(lib, /proposal_envelope_sha256\?: string/);
  assert.match(lib, /decision_receipt_sha256\?: string/);
  assert.match(lib, /evidence_trust_source\?: string/);
  assert.match(lib, /key_trusted\?: boolean/);
});
