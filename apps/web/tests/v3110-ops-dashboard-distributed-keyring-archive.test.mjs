import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("v3.11.0 Ops Dashboard hien distributed probe region node", () => {
  const page = read("../app/quan-tri/ops/page.tsx");
  assert.match(page, /OPS v3\.13\.0/);
  assert.match(page, /Distributed probe agents/);
  assert.match(page, /by_region/);
  assert.match(page, /by_node/);
});

test("v3.11.0 Ops Dashboard co keyring replay job archive", () => {
  const page = read("../app/quan-tri/ops/page.tsx");
  assert.match(page, /DLQ keyring \+ bulk replay jobs/);
  assert.match(page, /Telemetry archive · verify before prune/);
  assert.match(page, /taoWebhookReplayJobAdmin/);
  assert.match(page, /rotateDlqKeyAdmin/);
  assert.match(page, /archiveOpsAdmin/);
});

test("v3.11.0 Ops Dashboard co on-call schedule escalation va incident owner", () => {
  const page = read("../app/quan-tri/ops/page.tsx");
  assert.match(page, /On-call schedule \/ rotation/);
  assert.match(page, /Escalation routing theo dịch vụ/);
  assert.match(page, /ganChuSoHuuSuCoAdmin/);
});
