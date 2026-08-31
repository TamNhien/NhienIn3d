import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.2.1 Admin co the xac nhan da giao truc tiep tu moi trang thai", () => {
  const svc = doc("apps/api/src/quan-tri/quan-tri.service.ts");
  const page = doc("apps/web/app/quan-tri/page.tsx");
  assert.match(svc, /admin_xac_nhan_da_giao/);
  assert.match(svc, /trang_thai_moi === TrangThaiDonHang\.HOAN_TAT/);
  assert.match(svc, /Không đủ tồn kho để khôi phục đơn đã hủy/u);
  assert.match(page, /DA_HUY: \["HOAN_TAT"\]/);
  assert.match(page, /Admin có thể xác nhận <b>Đã giao \/ hoàn tất<\/b> trực tiếp từ mọi trạng thái/u);
});

test("v3.2.1 sua kieu Prisma JSON va phan trang audit de typecheck on dinh", () => {
  const svc = doc("apps/api/src/quan-tri/quan-tri.service.ts");
  assert.match(svc, /type Prisma/);
  assert.match(svc, /chuan_hoa_json_object/);
  assert.match(svc, /Prisma\.InputJsonObject/);
  assert.doesNotMatch(svc, /\.\.\.\(q \? \{ take: 5000 \} : \{ skip:/);
  assert.match(svc, /const ds = q\s*\? await this\.db\.nhatKyBaoMat\.findMany/s);
});
