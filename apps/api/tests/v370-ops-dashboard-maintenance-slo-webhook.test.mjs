import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.7.0 API co nhieu maintenance window va recurring schedule", () => {
  const svc = read("src/quan-tri/quan-tri.service.ts");
  const ctl = read("src/quan-tri/quan-tri.controller.ts");
  assert.equal(existsSync("src/quan-tri/dto/cap-nhat-bao-tri-nang-cao.dto.ts"), true);
  assert.match(svc, /BAO_TRI_HE_THONG_V370/);
  assert.match(svc, /HANG_NGAY/);
  assert.match(svc, /HANG_TUAN/);
  assert.match(ctl, /bao-tri\/danh-sach/);
  assert.match(ctl, /bao-tri\/:id\/cap-nhat/);
  assert.match(ctl, /bao-tri\/:id\/xoa/);
});

test("v3.7.0 API co multi-window burn policy MTTA MTTR va service budgets", () => {
  const svc = read("src/quan-tri/quan-tri.service.ts");
  const ctl = read("src/quan-tri/quan-tri.controller.ts");
  assert.equal(existsSync("src/quan-tri/dto/cap-nhat-slo-nang-cao.dto.ts"), true);
  assert.match(svc, /SLO_NANG_CAO_V370/);
  assert.match(svc, /burn_rate_policy/);
  assert.match(svc, /ngan_sach_dich_vu/);
  assert.match(svc, /mtta_phut/);
  assert.match(svc, /mttr_phut/);
  assert.match(ctl, /cau-hinh-slo-nang-cao/);
});

test("v3.7.0 webhook co delivery log retry backoff HMAC va doc lap email", () => {
  const svc = read("src/quan-tri/quan-tri.service.ts");
  const ctl = read("src/quan-tri/quan-tri.controller.ts");
  assert.match(svc, /createHmac/);
  assert.match(svc, /x-nhienin3d-signature/);
  assert.match(svc, /max_retries/);
  assert.match(svc, /backoff_ms/);
  assert.match(svc, /"WEBHOOK"/);
  assert.match(svc, /const da_gui = email\.da_gui \|\| webhook\.da_gui/);
  assert.match(ctl, /webhook\/delivery/);
});

test("v3.7.0 API export Ops SLO Incident tong hop", () => {
  const svc = read("src/quan-tri/quan-tri.service.ts");
  const ctl = read("src/quan-tri/quan-tri.controller.ts");
  assert.match(svc, /xuat_excel_ops_tong_hop/);
  assert.match(svc, /Ops v(?:3\.7\.[012]|3\.8\.0)/);
  assert.match(ctl, /he-thong\/ops\/excel/);
});
