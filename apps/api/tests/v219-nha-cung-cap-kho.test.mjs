import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const controller = readFileSync("src/quan-tri/quan-tri.controller.ts", "utf8");
const service = readFileSync("src/quan-tri/quan-tri.service.ts", "utf8");
const dtoNhap = readFileSync("src/quan-tri/dto/nhap-kho-lo.dto.ts", "utf8");
const dtoBienThe = readFileSync("src/quan-tri/dto/cap-nhat-bien-the.dto.ts", "utf8");

test("v2.19.0 API co CRUD nha cung cap va bao toan lich su phieu nhap", () => {
  assert.match(schema, /model\s+NhaCungCap\b/);
  assert.match(controller, /nha-cung-cap\/:id\/cap-nhat/);
  assert.match(controller, /nha-cung-cap\/:id\/xoa/);
  assert.match(service, /phiếu nhập sử dụng/u);
  assert.match(service, /ngừng hoạt động thay vì xóa/u);
});

test("v2.19.0 API nhap lo nhan UUID nha cung cap va kiem tra hoat dong", () => {
  assert.match(dtoNhap, /@IsUUID\(\)/);
  assert.match(dtoNhap, /nha_cung_cap_id\?: string/);
  assert.match(service, /Nhà cung cấp đang ngừng hoạt động/u);
  assert.match(service, /nha_cung_cap_id: nha_cung_cap_ref\?\.id/);
});

test("v2.19.0 API bien the co dinh muc min max va validate", () => {
  assert.match(dtoBienThe, /ton_toi_thieu\?: number/);
  assert.match(dtoBienThe, /ton_toi_da\?: number/);
  assert.match(service, /Tồn tối đa phải bằng 0 .*lớn hơn hoặc bằng tồn tối thiểu/u);
  assert.match(service, /ton_toi_thieu_cu/);
  assert.match(service, /ton_toi_da_moi/);
});
