ALTER TYPE "VaiTro" ADD VALUE IF NOT EXISTS 'SIEU_QUAN_TRI';

ALTER TABLE "nguoi_dung"
  ADD COLUMN IF NOT EXISTS "so_lan_dang_nhap_that_bai" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "khoa_den" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "lan_dang_nhap_cuoi" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "phien_ban_mat_khau" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS "nguoi_dung_vai_tro_idx" ON "nguoi_dung"("vai_tro");
CREATE INDEX IF NOT EXISTS "nguoi_dung_khoa_den_idx" ON "nguoi_dung"("khoa_den");
