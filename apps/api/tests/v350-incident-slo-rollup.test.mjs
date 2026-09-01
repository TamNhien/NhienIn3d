import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.5.0 API co incident lifecycle va bang tong hop", () => {
  const ctl = doc("src/quan-tri/quan-tri.controller.ts");
  const svc = doc("src/quan-tri/quan-tri.service.ts");
  const schema = doc("prisma/schema.prisma");
  for (const route of ["he-thong/su-co/:chu_ky/tiep-nhan", "he-thong/su-co/:chu_ky/khac-phuc"]) assert.match(ctl, new RegExp(route.replaceAll("/", "\\/")));
  assert.match(schema, /model SuCoVanHanh/);
  assert.match(svc, /suCoVanHanh\.findMany/);
  assert.match(svc, /ADMIN_TIEP_NHAN_SU_CO_VAN_HANH/);
  assert.match(svc, /ADMIN_KHAC_PHUC_SU_CO_VAN_HANH/);
  assert.match(svc, /nguon: "BANG_TONG_HOP"/);
});

test("v3.5.0 API co SLO config va canh bao xu huong 7 30 ngay", () => {
  const ctl = doc("src/quan-tri/quan-tri.controller.ts");
  const svc = doc("src/quan-tri/quan-tri.service.ts");
  assert.match(ctl, /he-thong\/cau-hinh-slo/);
  assert.match(svc, /SLO_VAN_HANH_CAU_HINH/);
  assert.match(svc, /sla_muc_tieu_percent/);
  assert.match(svc, /uptime_muc_tieu_percent/);
  assert.match(svc, /bay_ngay/);
  assert.match(svc, /ba_muoi_ngay/);
  assert.match(svc, /SLO: \$\{x\}/);
});

test("v3.5.0 migration aggregate incident ton tai va co backfill", () => {
  const path = "prisma/migrations/202609010001_v350_incident_slo_rollup/migration.sql";
  assert.equal(existsSync(path), true);
  const sql = doc(path);
  assert.match(sql, /CREATE TABLE "su_co_van_hanh"/);
  assert.match(sql, /INSERT INTO "su_co_van_hanh"/);
  assert.match(sql, /su_co_van_hanh_trang_thai_xu_ly_gan_nhat_idx/);
});
