import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.2.0 API co route lich su van hanh va canh bao email", () => {
  const ctl = doc("src/quan-tri/quan-tri.controller.ts");
  assert.match(ctl, /he-thong\/lich-su/);
  assert.match(ctl, /he-thong\/canh-bao-email\/gui/);
  assert.match(ctl, /nhat-ky\/phan-trang/);
  assert.match(ctl, /nhat-ky\/excel/);
});

test("v3.2.0 API luu operation history va health alert chong lap", () => {
  const svc = doc("src/quan-tri/quan-tri.service.ts");
  const mail = doc("src/thu-dien-tu/thu-dien-tu.service.ts");
  assert.match(svc, /lichSuVanHanh\.create/);
  assert.match(svc, /danh_sach_lich_su_van_hanh/);
  assert.match(svc, /kiem_tra_gui_canh_bao_he_thong_email/);
  assert.match(svc, /chu_ky_canh_bao_he_thong/);
  assert.match(mail, /guiCanhBaoHeThong/);
});

test("v3.2.0 API audit co before after diff va Excel", () => {
  const svc = doc("src/quan-tri/quan-tri.service.ts");
  assert.match(svc, /private tao_diff/);
  assert.match(svc, /truoc:/);
  assert.match(svc, /sau:/);
  assert.match(svc, /thay_doi:/);
  assert.match(svc, /tao_xlsx\(rows, "Nhật ký Admin"\)/u);
});
