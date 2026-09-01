import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.4.0 API runtime alert config co DTO va audit before after", () => {
  const ctl = doc("src/quan-tri/quan-tri.controller.ts");
  const svc = doc("src/quan-tri/quan-tri.service.ts");
  const dto = doc("src/quan-tri/dto/cap-nhat-cau-hinh-canh-bao-he-thong.dto.ts");
  assert.match(ctl, /he-thong\/cau-hinh-canh-bao/);
  assert.match(svc, /CANH_BAO_HE_THONG_CAU_HINH/);
  assert.match(svc, /tao_diff\(truoc, sau\)/);
  assert.match(svc, /ap_dung_bo_hen_canh_bao_he_thong/);
  assert.match(dto, /im_lang_phut/);
  assert.match(dto, /leo_thang_phut/);
});

test("v3.4.0 API incident SLA cursor", () => {
  const ctl = doc("src/quan-tri/quan-tri.controller.ts");
  const svc = doc("src/quan-tri/quan-tri.service.ts");
  for (const route of ["he-thong/lich-su/cursor", "he-thong/sla", "he-thong/su-co", "nhat-ky/cursor"]) assert.match(ctl, new RegExp(route.replaceAll("/", "\\/")));
  assert.match(svc, /chu_ky_canh_bao/);
  assert.match(svc, /orderBy: \{ id: "desc" \}/);
  assert.match(svc, /sla_percent/);
  assert.match(svc, /uptime_percent/);
});

test("v3.4.0 migration incident ton tai", () => {
  const path = "prisma/migrations/202608310008_v340_incident_signature_cursor_sla/migration.sql";
  assert.equal(existsSync(path), true);
  assert.match(doc(path), /chu_ky_canh_bao/);
});
