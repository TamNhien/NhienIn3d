import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.3.0 API audit diff them danh muc vat lieu mau ca phan ca", () => {
  const svc = doc("src/quan-tri/quan-tri.service.ts");
  for (const event of ["ADMIN_CAP_NHAT_DANH_MUC", "ADMIN_CAP_NHAT_VAT_LIEU", "ADMIN_CAP_NHAT_MAU_SAC", "ADMIN_CAP_NHAT_CA_LAM", "ADMIN_CAP_NHAT_PHAN_CA"]) assert.match(svc, new RegExp(event));
  assert.match(svc, /tao_diff\(truoc, sau\)/);
});

test("v3.3.0 API thong ke va Excel lich su van hanh", () => {
  const ctl = doc("src/quan-tri/quan-tri.controller.ts");
  const svc = doc("src/quan-tri/quan-tri.service.ts");
  assert.match(ctl, /he-thong\/thong-ke/);
  assert.match(ctl, /he-thong\/lich-su\/excel/);
  assert.match(svc, /groupBy\(\{ by: \["trang_thai"\]/);
  assert.match(svc, /xuat_excel_lich_su_van_hanh/);
});

test("v3.3.0 API silence escalation health alert", () => {
  const svc = doc("src/quan-tri/quan-tri.service.ts");
  const mail = doc("src/thu-dien-tu/thu-dien-tu.service.ts");
  assert.match(svc, /SYSTEM_HEALTH_ALERT_SILENCE_MINUTES/);
  assert.match(svc, /SYSTEM_HEALTH_ALERT_ESCALATION_MINUTES/);
  assert.match(svc, /cap_leo_thang/);
  assert.match(mail, /ESCALATION/);
});
