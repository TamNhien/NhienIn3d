-- v2.12.0 - lịch sử trạng thái đơn hàng phục vụ quản trị và audit
CREATE TABLE IF NOT EXISTS "lich_su_don_hang" (
  "id" BIGSERIAL PRIMARY KEY,
  "don_hang_id" UUID NOT NULL,
  "nguoi_thuc_hien_id" UUID,
  "trang_thai_cu" "TrangThaiDonHang",
  "trang_thai_moi" "TrangThaiDonHang" NOT NULL,
  "ghi_chu" VARCHAR(500),
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lich_su_don_hang_don_hang_id_fkey" FOREIGN KEY ("don_hang_id") REFERENCES "don_hang"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "lich_su_don_hang_nguoi_thuc_hien_id_fkey" FOREIGN KEY ("nguoi_thuc_hien_id") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "lich_su_don_hang_don_hang_id_ngay_tao_idx" ON "lich_su_don_hang"("don_hang_id", "ngay_tao");
CREATE INDEX IF NOT EXISTS "lich_su_don_hang_nguoi_thuc_hien_id_idx" ON "lich_su_don_hang"("nguoi_thuc_hien_id");

-- Tạo mốc lịch sử đầu tiên cho các đơn đã có trước v2.12.0.
INSERT INTO "lich_su_don_hang" ("don_hang_id", "trang_thai_cu", "trang_thai_moi", "ghi_chu", "ngay_tao")
SELECT d."id", NULL, d."trang_thai", 'Khởi tạo lịch sử từ dữ liệu trước v2.12.0', d."ngay_tao"
FROM "don_hang" d
WHERE NOT EXISTS (
  SELECT 1 FROM "lich_su_don_hang" l WHERE l."don_hang_id" = d."id"
);
