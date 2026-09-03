import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.4.0 co migration chu ky canh bao va index incident", () => {
  const path = "apps/api/prisma/migrations/202608310008_v340_incident_signature_cursor_sla/migration.sql";
  assert.equal(existsSync(path), true);
  const migration = doc(path);
  const schema = doc("apps/api/prisma/schema.prisma");
  assert.match(migration, /chu_ky_canh_bao/);
  assert.match(migration, /lich_su_van_hanh_chu_ky_canh_bao_ngay_tao_idx/);
  assert.match(schema, /chu_ky_canh_bao\s+String\?/);
  assert.match(schema, /@@index\(\[chu_ky_canh_bao, ngay_tao\]\)/);
});

test("v3.4.0 API co runtime config SLA incident va cursor", () => {
  const ctl = doc("apps/api/src/quan-tri/quan-tri.controller.ts");
  const svc = doc("apps/api/src/quan-tri/quan-tri.service.ts");
  for (const route of ["he-thong/cau-hinh-canh-bao", "he-thong/sla", "he-thong/su-co", "he-thong/lich-su/cursor", "nhat-ky/cursor"]) assert.match(ctl, new RegExp(route.replaceAll("/", "\\/")));
  assert.match(svc, /CANH_BAO_HE_THONG_CAU_HINH/);
  assert.match(svc, /ADMIN_CAP_NHAT_CAU_HINH_CANH_BAO_HE_THONG/);
  assert.match(svc, /createHash\("sha256"\)/);
  assert.match(svc, /thong_ke_sla_van_hanh/);
  assert.match(svc, /danh_sach_su_co_van_hanh/);
  assert.match(svc, /danh_sach_nhat_ky_admin_cursor/);
});

test("v3.4.0 runtime E2E phu Admin orders stock report va ops", () => {
  const e2e = doc("scripts/e2e-runtime-v340.ps1");
  const ci = doc(".github/workflows/ci.yml");
  for (const text of ["xac-thuc/dang-nhap", "quan-tri/don-hang", "quan-tri/san-pham", "kho/import/kiem-tra", "bao-cao/ton-kho/excel", "he-thong/sla", "nhat-ky/cursor"]) assert.match(e2e, new RegExp(text.replaceAll("/", "\\/")));
  assert.match(e2e, /e2e-runtime-v320\.ps1/);
  assert.match(ci, /e2e-runtime-v(?:34[01]|35[01234]|36[01234567]|37[012]|380|390|3100|3101|3102|3103|3104|3105|3110|3120|3130|3140|3150|3160|3170|3180|3190)\.ps1/);
});
