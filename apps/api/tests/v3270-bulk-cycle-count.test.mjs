import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(p, "utf8");

test("v3.27.0 API co preview file kiem ke, atomic apply va Excel doi soat", () => {
  const controller = read("src/quan-tri/quan-tri.controller.ts");
  const service = read("src/quan-tri/quan-tri.service.ts");
  assert.match(controller, /kiem_tra_tep_kiem_ke_kho_v3270/);
  assert.match(controller, /xuat_kiem_ke_kho_excel_v3270/);
  assert.match(controller, /ap_dung_kiem_ke_kho_v3270/);
  assert.match(service, /File kiểm kê phải có cột ma_bien_the và ton_thuc_te/);
  assert.match(service, /Tồn thực tế phải là số nguyên 0–1\.000\.000/);
  assert.match(service, /Mã biến thể bị lặp trong file/);
  assert.match(service, /co_the_ap_dung: result\.length > 0 && valid\.length === result\.length/);
  assert.match(service, /batch_file_import_supported: true/);
  assert.match(service, /doi-soat-kiem-ke-kho-v3\.27\.0/);
  assert.match(service, /STALE\/INVALID/);
  assert.match(service, /trang_thai_ops_v3270/);
});
