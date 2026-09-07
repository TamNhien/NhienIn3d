import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("v3.22.0 dark/trust UI duoc giu khi current v3.26.0", () => {
  const page = read("app/quan-tri/ops/page.tsx");
  const lib = read("lib/quan-tri.ts");
  const globals = read("app/globals.css");
  assert.match(page, /OPS v3\.27\.0/);
  assert.match(page, /immutable envelope \+ decision receipt \+ tamper-evident receipt chain/);
  assert.match(page, /proposal_envelope_sha256_valid/);
  assert.match(page, /decision_receipt_sha256_valid/);
  assert.match(page, /trust anchor/);
  assert.match(page, /evidence_key_trusted/);
  assert.match(lib, /proposal_envelope_sha256\?: string/);
  assert.match(lib, /decision_receipt_sha256\?: string/);
  assert.match(lib, /evidence_trust_source\?: string/);
  assert.match(lib, /key_trusted\?: boolean/);
  // Hotfix UI: native select/date/time/datetime/month popover phải theo dark palette,
  // tránh menu/calendar trắng trên Chromium/Brave/Edge trong Admin và Ops.
  assert.match(globals, /:root\{\s*color-scheme:dark;/);
  assert.match(globals, /select,[\s\S]*input\[type="date"\][\s\S]*input\[type="time"\][\s\S]*input\[type="datetime-local"\][\s\S]*input\[type="month"\][\s\S]*color-scheme:dark;/);
  assert.match(globals, /select option,select optgroup\{[\s\S]*background-color:#0b1322;[\s\S]*color:#f8fafc;/);
});
