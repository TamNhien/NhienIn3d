import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.3.0 audit diff mo rong cho danh muc vat lieu mau ca va phan ca", () => {
  const svc = doc("apps/api/src/quan-tri/quan-tri.service.ts");
  for (const event of ["ADMIN_CAP_NHAT_DANH_MUC", "ADMIN_CAP_NHAT_VAT_LIEU", "ADMIN_CAP_NHAT_MAU_SAC", "ADMIN_CAP_NHAT_CA_LAM", "ADMIN_CAP_NHAT_PHAN_CA"]) {
    const pos = svc.indexOf(event);
    assert.ok(pos >= 0, `${event} phải tồn tại`);
    const chunk = svc.slice(Math.max(0, pos - 900), pos + 900);
    assert.match(chunk, /truoc/);
    assert.match(chunk, /sau/);
    assert.match(chunk, /tao_diff\(truoc, sau\)/);
  }
});

test("v3.3.0 co thong ke 7 30 ngay va xuat Excel lich su van hanh", () => {
  const ctl = doc("apps/api/src/quan-tri/quan-tri.controller.ts");
  const svc = doc("apps/api/src/quan-tri/quan-tri.service.ts");
  assert.match(ctl, /he-thong\/thong-ke/);
  assert.match(ctl, /he-thong\/lich-su\/excel/);
  assert.match(svc, /thong_ke_van_hanh/);
  assert.match(svc, /Promise\.all\(\[tinh\(7\), tinh\(30\)\]\)/);
  assert.match(svc, /tao_xlsx\(rows, "Lịch sử vận hành"\)/u);
});

test("v3.3.0 canh bao co silence escalation va persistence", () => {
  const env = doc(".env.example");
  const compose = doc("docker-compose.yml");
  const svc = doc("apps/api/src/quan-tri/quan-tri.service.ts");
  for (const key of ["SYSTEM_HEALTH_ALERT_SILENCE_MINUTES", "SYSTEM_HEALTH_ALERT_ESCALATION_MINUTES"]) {
    assert.match(env, new RegExp(key));
    assert.match(compose, new RegExp(key));
  }
  assert.match(svc, /im_lang_phut/);
  assert.match(svc, /leo_thang_phut/);
  assert.match(svc, /cap_leo_thang/);
  assert.match(svc, /phat_hien_luc/);
});

test("v3.3.0 migration them index audit don hang va van hanh", () => {
  const path = "apps/api/prisma/migrations/202608310007_v330_audit_ops_indexes/migration.sql";
  assert.equal(existsSync(path), true);
  const migration = doc(path);
  assert.match(migration, /nhat_ky_bao_mat_nguoi_dung_id_ngay_tao_idx/);
  assert.match(migration, /nhat_ky_bao_mat_loai_su_kien_ngay_tao_idx/);
  assert.match(migration, /don_hang_trang_thai_ngay_tao_idx/);
  assert.match(migration, /lich_su_van_hanh_ngay_tao_idx/);
});

test("v3.3.0 CI co runtime Docker migration API va backup restore", () => {
  const ci = doc(".github/workflows/ci.yml");
  assert.match(ci, /runtime-docker:/);
  assert.match(ci, /docker compose up -d --build postgres migrate api/);
  assert.match(ci, /api\/v1\/suc-khoe/);
  assert.match(ci, /e2e-runtime-v320\.ps1/);
});
