-- v2.9.3: hop nhat QUAN_TRI + SIEU_QUAN_TRI thanh mot vai tro ADMIN.
-- PostgreSQL khong ho tro xoa gia tri enum truc tiep, vi vay tao enum moi va cast du lieu.
CREATE TYPE "VaiTro_v293" AS ENUM ('KHACH_HANG', 'NHAN_VIEN', 'QUAN_LY', 'ADMIN');

ALTER TABLE "nguoi_dung" ALTER COLUMN "vai_tro" DROP DEFAULT;
ALTER TABLE "nguoi_dung"
  ALTER COLUMN "vai_tro" TYPE "VaiTro_v293"
  USING (
    CASE
      WHEN "vai_tro"::text IN ('QUAN_TRI', 'SIEU_QUAN_TRI') THEN 'ADMIN'
      ELSE "vai_tro"::text
    END
  )::"VaiTro_v293";

DROP TYPE "VaiTro";
ALTER TYPE "VaiTro_v293" RENAME TO "VaiTro";
ALTER TABLE "nguoi_dung" ALTER COLUMN "vai_tro" SET DEFAULT 'KHACH_HANG';
