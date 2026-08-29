ALTER TABLE "nguoi_dung"
  ADD COLUMN IF NOT EXISTS "so_dien_thoai" VARCHAR(30);

DO $$ BEGIN
  CREATE TYPE "TrangThaiNhanVien" AS ENUM ('DANG_LAM', 'TAM_NGHI', 'NGHI_VIEC');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TrangThaiPhanCa" AS ENUM ('DA_XEP', 'DA_XAC_NHAN', 'DA_HOAN_THANH', 'VANG_MAT', 'DA_HUY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "nhan_vien" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nguoi_dung_id" UUID NOT NULL,
  "ma_nhan_vien" VARCHAR(40) NOT NULL,
  "chuc_danh" VARCHAR(120) NOT NULL,
  "bo_phan" VARCHAR(120) NOT NULL,
  "ngay_vao_lam" DATE NOT NULL,
  "trang_thai" "TrangThaiNhanVien" NOT NULL DEFAULT 'DANG_LAM',
  "ghi_chu" TEXT,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nhan_vien_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "nhan_vien_nguoi_dung_id_fkey" FOREIGN KEY ("nguoi_dung_id") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "nhan_vien_nguoi_dung_id_key" ON "nhan_vien"("nguoi_dung_id");
CREATE UNIQUE INDEX IF NOT EXISTS "nhan_vien_ma_nhan_vien_key" ON "nhan_vien"("ma_nhan_vien");
CREATE INDEX IF NOT EXISTS "nhan_vien_trang_thai_idx" ON "nhan_vien"("trang_thai");
CREATE INDEX IF NOT EXISTS "nhan_vien_bo_phan_idx" ON "nhan_vien"("bo_phan");

CREATE TABLE IF NOT EXISTS "ca_lam_viec" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ma_ca" VARCHAR(40) NOT NULL,
  "ten_ca" VARCHAR(120) NOT NULL,
  "gio_bat_dau" VARCHAR(5) NOT NULL,
  "gio_ket_thuc" VARCHAR(5) NOT NULL,
  "mau_hien_thi" VARCHAR(9),
  "dang_hoat_dong" BOOLEAN NOT NULL DEFAULT true,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ca_lam_viec_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ca_lam_viec_ma_ca_key" ON "ca_lam_viec"("ma_ca");
CREATE INDEX IF NOT EXISTS "ca_lam_viec_dang_hoat_dong_idx" ON "ca_lam_viec"("dang_hoat_dong");

CREATE TABLE IF NOT EXISTS "phan_ca" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nhan_vien_id" UUID NOT NULL,
  "ca_lam_viec_id" UUID NOT NULL,
  "ngay_lam" DATE NOT NULL,
  "trang_thai" "TrangThaiPhanCa" NOT NULL DEFAULT 'DA_XEP',
  "ghi_chu" TEXT,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "phan_ca_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "phan_ca_nhan_vien_id_fkey" FOREIGN KEY ("nhan_vien_id") REFERENCES "nhan_vien"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "phan_ca_ca_lam_viec_id_fkey" FOREIGN KEY ("ca_lam_viec_id") REFERENCES "ca_lam_viec"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "phan_ca_nhan_vien_id_ca_lam_viec_id_ngay_lam_key" ON "phan_ca"("nhan_vien_id", "ca_lam_viec_id", "ngay_lam");
CREATE INDEX IF NOT EXISTS "phan_ca_ngay_lam_idx" ON "phan_ca"("ngay_lam");
CREATE INDEX IF NOT EXISTS "phan_ca_trang_thai_idx" ON "phan_ca"("trang_thai");
