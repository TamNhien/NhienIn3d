-- v2.9.5: chỉ còn KHACH_HANG, NHAN_VIEN bán hàng và ADMIN.
-- QUAN_LY cũ được hạ về KHACH_HANG để không vô tình cấp toàn quyền Admin.
CREATE TYPE "VaiTro_v295" AS ENUM ('KHACH_HANG', 'NHAN_VIEN', 'ADMIN');

ALTER TABLE "nguoi_dung" ALTER COLUMN "vai_tro" DROP DEFAULT;
ALTER TABLE "nguoi_dung"
  ALTER COLUMN "vai_tro" TYPE "VaiTro_v295"
  USING (
    CASE
      WHEN "vai_tro"::text = 'QUAN_LY' THEN 'KHACH_HANG'
      ELSE "vai_tro"::text
    END
  )::"VaiTro_v295";

DROP TYPE "VaiTro";
ALTER TYPE "VaiTro_v295" RENAME TO "VaiTro";
ALTER TABLE "nguoi_dung" ALTER COLUMN "vai_tro" SET DEFAULT 'KHACH_HANG';

-- Chuẩn hóa hồ sơ nhân sự hiện có theo mô hình mới: chỉ nhân viên bán hàng.
UPDATE "nguoi_dung" u
SET "vai_tro" = 'NHAN_VIEN',
    "da_kich_hoat" = CASE WHEN nv."trang_thai"::text = 'DANG_LAM' THEN TRUE ELSE FALSE END,
    "so_lan_dang_nhap_that_bai" = CASE WHEN nv."trang_thai"::text = 'DANG_LAM' THEN 0 ELSE u."so_lan_dang_nhap_that_bai" END,
    "khoa_den" = CASE WHEN nv."trang_thai"::text = 'DANG_LAM' THEN NULL ELSE u."khoa_den" END
FROM "nhan_vien" nv
WHERE nv."nguoi_dung_id" = u."id" AND u."vai_tro" <> 'ADMIN';

-- Nhân viên tạm nghỉ/nghỉ việc không được giữ phiên đăng nhập cũ.
UPDATE "phien_dang_nhap" p
SET "da_thu_hoi" = TRUE
FROM "nhan_vien" nv
WHERE p."nguoi_dung_id" = nv."nguoi_dung_id"
  AND nv."trang_thai"::text IN ('TAM_NGHI', 'NGHI_VIEC')
  AND p."da_thu_hoi" = FALSE;

UPDATE "nhan_vien"
SET "chuc_danh" = 'Nhân viên bán hàng',
    "bo_phan" = 'Bán hàng',
    "ngay_cap_nhat" = NOW();
