import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.6.0 API maintenance window luu cau_hinh_he_thong va audit", () => {
  const svc = doc("src/quan-tri/quan-tri.service.ts");
  const ctl = doc("src/quan-tri/quan-tri.controller.ts");
  assert.equal(existsSync("src/quan-tri/dto/cap-nhat-bao-tri-he-thong.dto.ts"), true);
  assert.match(ctl, /he-thong\/bao-tri/);
  assert.match(svc, /BAO_TRI_HE_THONG_CAU_HINH/);
  assert.match(svc, /ADMIN_CAP_NHAT_BAO_TRI_HE_THONG/);
  assert.match(svc, /maintenance window/);
});

test("v3.6.0 API tinh error budget burn-rate 1h 6h 24h", () => {
  const svc = doc("src/quan-tri/quan-tri.service.ts");
  assert.match(svc, /ngan_sach_loi/);
  assert.match(svc, /burn_rate/);
  assert.match(svc, /mot_gio/);
  assert.match(svc, /sau_gio/);
  assert.match(svc, /hai_muoi_bon_gio/);
  assert.match(svc, /Burn-rate/);
});

test("v3.6.0 API export Incident Timeline Excel va webhook payload", () => {
  const svc = doc("src/quan-tri/quan-tri.service.ts");
  const ctl = doc("src/quan-tri/quan-tri.controller.ts");
  assert.match(svc, /xuat_excel_danh_sach_su_co_van_hanh/);
  assert.match(svc, /xuat_excel_chi_tiet_su_co_van_hanh/);
  assert.match(ctl, /su-co\/:chu_ky\/excel/);
  assert.match(svc, /nhienin3d\.system\.alert/);
  assert.match(svc, /SYSTEM_ALERT_WEBHOOK_BEARER_TOKEN/);
});
