import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.23.0 Ops UI receipt chain + revoked-key va dark picker", () => {
  const page = read("app/quan-tri/ops/page.tsx");
  const lib = read("lib/quan-tri.ts");
  const css = read("app/globals.css");
  assert.match(page, /OPS v3\.24\.1/);
  assert.match(page, /receipt hash chain/);
  assert.match(page, /tamper-evident receipt chain/);
  assert.match(page, /receipt_chain_valid/);
  assert.match(page, /receipt_chain_length/);
  assert.match(page, /revoked-key fail-closed/);
  assert.match(page, /evidence_key_revoked/);
  assert.match(page, /evidence_revocation_configured/);
  assert.match(page, /evidence_revoked_fingerprints/);

  assert.match(lib, /receipt_chain_valid\?: boolean/);
  assert.match(lib, /receipt_chain_head_sha256\?: string \| null/);
  assert.match(lib, /evidence_key_revoked\?: boolean/);
  assert.match(lib, /evidence_revocation_configured\?: boolean/);
  assert.match(lib, /key_revoked\?: boolean/);

  assert.match(css, /:root\{\s*color-scheme:dark;/);
  assert.match(css, /select option,select optgroup\{/);
  assert.match(css, /input\[type="datetime-local"\]/);
});
