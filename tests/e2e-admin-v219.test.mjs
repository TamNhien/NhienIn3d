import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schema = readFileSync("apps/api/prisma/schema.prisma", "utf8");
const migration = readFileSync("apps/api/prisma/migrations/202608310003_v219_nha_cung_cap_dinh_muc_kho/migration.sql", "utf8");
const controller = readFileSync("apps/api/src/quan-tri/quan-tri.controller.ts", "utf8");
const service = readFileSync("apps/api/src/quan-tri/quan-tri.service.ts", "utf8");
const webLib = readFileSync("apps/web/lib/quan-tri.ts", "utf8");
const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");

// E2E contract: schema/migration -> API -> client -> giao diện Admin.
test("v2.19.0 E2E nha cung cap lien ket phieu nhap", () => {
  assert.match(schema, /model\s+NhaCungCap\b/);
  assert.match(schema, /nha_cung_cap_id\s+String\?\s+@db\.Uuid/);
  assert.match(migration, /CREATE TABLE "nha_cung_cap"/);
  assert.match(controller, /@Get\("nha-cung-cap"\)/);
  assert.match(controller, /@Post\("nha-cung-cap"\)/);
  assert.match(service, /ADMIN_TAO_NHA_CUNG_CAP/);
  assert.match(webLib, /layNhaCungCapAdmin/);
  assert.match(admin, /tab === "nha-cung-cap"/);
});

test("v2.19.0 E2E phieu nhap co loc chi tiet va xuat Excel", () => {
  assert.match(controller, /@Get\("kho\/phieu-nhap\/excel"\)/);
  assert.match(controller, /@Get\("kho\/phieu-nhap\/:id"\)/);
  assert.match(service, /dieu_kien_phieu_nhap_kho/);
  assert.match(service, /xuat_excel_phieu_nhap_kho/);
  assert.match(webLib, /layChiTietPhieuNhapKhoAdmin/);
  assert.match(webLib, /xuatExcelPhieuNhapKhoAdmin/);
  assert.match(admin, /Lịch sử phiếu nhập kho/u);
  assert.match(admin, /Xuất Excel/u);
});

test("v2.19.0 E2E dinh muc ton min max va goi y nhap", () => {
  assert.match(schema, /ton_toi_thieu\s+Int\s+@default\(0\)/);
  assert.match(schema, /ton_toi_da\s+Int\s+@default\(0\)/);
  assert.match(migration, /ADD COLUMN "ton_toi_thieu" INTEGER NOT NULL DEFAULT 0/);
  assert.match(service, /x\.ton_toi_da > x\.ton_toi_thieu/);
  assert.match(admin, /Cần nhập theo định mức/u);
  assert.match(admin, /Gợi ý nhập/u);
  assert.match(admin, /ton_toi_da-bien_the\.so_luong_ton/);
});

test("v2.19.0 bao cao ton kho mang theo dinh muc va goi y", () => {
  assert.match(service, /"Tồn tối thiểu", "Tồn tối đa", "Gợi ý nhập"/u);
  assert.match(service, /Math\.max\(0, x\.ton_toi_da - x\.so_luong_ton\)/);
  assert.match(admin, /Tồn min/u);
  assert.match(admin, /Tồn max/u);
});
