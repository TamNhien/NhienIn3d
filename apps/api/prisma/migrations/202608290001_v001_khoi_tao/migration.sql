CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "VaiTro" AS ENUM ('KHACH_HANG', 'NHAN_VIEN', 'QUAN_LY', 'QUAN_TRI');
CREATE TYPE "TrangThaiSanPham" AS ENUM ('NHAP', 'DANG_BAN', 'TAM_AN', 'NGUNG_BAN');
CREATE TYPE "TrangThaiDonHang" AS ENUM ('CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_SAN_XUAT', 'DANG_GIAO', 'HOAN_TAT', 'DA_HUY');
CREATE TYPE "TrangThaiNguon" AS ENUM ('MAU_THAM_KHAO', 'DUOC_PHEP_KINH_DOANH');

CREATE TABLE "nguoi_dung" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "thu_dien_tu" VARCHAR(255) NOT NULL,
  "mat_khau_bam" VARCHAR(500) NOT NULL,
  "ho_ten" VARCHAR(150) NOT NULL,
  "vai_tro" "VaiTro" NOT NULL DEFAULT 'KHACH_HANG',
  "da_kich_hoat" BOOLEAN NOT NULL DEFAULT true,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nguoi_dung_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "nguoi_dung_thu_dien_tu_key" ON "nguoi_dung"("thu_dien_tu");

CREATE TABLE "danh_muc" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ma_danh_muc" VARCHAR(50) NOT NULL,
  "ten_danh_muc" VARCHAR(150) NOT NULL,
  "duong_dan" VARCHAR(160) NOT NULL,
  "mo_ta" TEXT,
  "thu_tu" INTEGER NOT NULL DEFAULT 0,
  "dang_hien_thi" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "danh_muc_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "danh_muc_ma_danh_muc_key" ON "danh_muc"("ma_danh_muc");
CREATE UNIQUE INDEX "danh_muc_duong_dan_key" ON "danh_muc"("duong_dan");

CREATE TABLE "san_pham" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ma_san_pham" VARCHAR(50) NOT NULL,
  "ten_san_pham" VARCHAR(200) NOT NULL,
  "duong_dan" VARCHAR(220) NOT NULL,
  "mo_ta_ngan" VARCHAR(700),
  "mo_ta" TEXT,
  "gia_ban" DECIMAL(14,2) NOT NULL,
  "gia_von" DECIMAL(14,2),
  "don_vi_tien_te" CHAR(3) NOT NULL DEFAULT 'VND',
  "khoi_luong_gam" DECIMAL(10,2),
  "thoi_gian_in_gio" DECIMAL(10,2),
  "kich_thuoc" VARCHAR(120),
  "thong_so" JSONB NOT NULL DEFAULT '{}',
  "trang_thai" "TrangThaiSanPham" NOT NULL DEFAULT 'DANG_BAN',
  "trang_thai_nguon" "TrangThaiNguon" NOT NULL DEFAULT 'MAU_THAM_KHAO',
  "nguon_tham_khao" TEXT,
  "danh_muc_id" UUID NOT NULL,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "san_pham_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "san_pham_danh_muc_id_fkey" FOREIGN KEY ("danh_muc_id") REFERENCES "danh_muc"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "san_pham_ma_san_pham_key" ON "san_pham"("ma_san_pham");
CREATE UNIQUE INDEX "san_pham_duong_dan_key" ON "san_pham"("duong_dan");
CREATE INDEX "san_pham_danh_muc_id_idx" ON "san_pham"("danh_muc_id");
CREATE INDEX "san_pham_trang_thai_idx" ON "san_pham"("trang_thai");

CREATE TABLE "hinh_anh_san_pham" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "san_pham_id" UUID NOT NULL,
  "duong_dan_anh" TEXT NOT NULL,
  "mo_ta_anh" VARCHAR(250),
  "la_anh_chinh" BOOLEAN NOT NULL DEFAULT false,
  "thu_tu" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "hinh_anh_san_pham_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hinh_anh_san_pham_san_pham_id_fkey" FOREIGN KEY ("san_pham_id") REFERENCES "san_pham"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "hinh_anh_san_pham_san_pham_id_idx" ON "hinh_anh_san_pham"("san_pham_id");

CREATE TABLE "vat_lieu" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ma_vat_lieu" VARCHAR(40) NOT NULL,
  "ten_vat_lieu" VARCHAR(120) NOT NULL,
  "mo_ta" TEXT,
  "he_so_gia" DECIMAL(8,3) NOT NULL DEFAULT 1,
  CONSTRAINT "vat_lieu_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vat_lieu_ma_vat_lieu_key" ON "vat_lieu"("ma_vat_lieu");

CREATE TABLE "mau_sac" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ma_mau" VARCHAR(40) NOT NULL,
  "ten_mau" VARCHAR(120) NOT NULL,
  "ma_hex" VARCHAR(9) NOT NULL,
  CONSTRAINT "mau_sac_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "mau_sac_ma_mau_key" ON "mau_sac"("ma_mau");

CREATE TABLE "bien_the_san_pham" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "san_pham_id" UUID NOT NULL,
  "vat_lieu_id" UUID,
  "mau_sac_id" UUID,
  "ma_bien_the" VARCHAR(80) NOT NULL,
  "gia_chenh_lech" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "so_luong_ton" INTEGER NOT NULL DEFAULT 0,
  "dang_hien_thi" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "bien_the_san_pham_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bien_the_san_pham_san_pham_id_fkey" FOREIGN KEY ("san_pham_id") REFERENCES "san_pham"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "bien_the_san_pham_vat_lieu_id_fkey" FOREIGN KEY ("vat_lieu_id") REFERENCES "vat_lieu"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "bien_the_san_pham_mau_sac_id_fkey" FOREIGN KEY ("mau_sac_id") REFERENCES "mau_sac"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "bien_the_san_pham_ma_bien_the_key" ON "bien_the_san_pham"("ma_bien_the");
CREATE INDEX "bien_the_san_pham_san_pham_id_idx" ON "bien_the_san_pham"("san_pham_id");

CREATE TABLE "don_hang" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ma_don_hang" VARCHAR(40) NOT NULL,
  "nguoi_dung_id" UUID,
  "ho_ten_nguoi_nhan" VARCHAR(150) NOT NULL,
  "so_dien_thoai" VARCHAR(30) NOT NULL,
  "dia_chi_giao_hang" TEXT NOT NULL,
  "ghi_chu" TEXT,
  "tong_tien" DECIMAL(14,2) NOT NULL,
  "trang_thai" "TrangThaiDonHang" NOT NULL DEFAULT 'CHO_XAC_NHAN',
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "don_hang_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "don_hang_nguoi_dung_id_fkey" FOREIGN KEY ("nguoi_dung_id") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "don_hang_ma_don_hang_key" ON "don_hang"("ma_don_hang");
CREATE INDEX "don_hang_nguoi_dung_id_idx" ON "don_hang"("nguoi_dung_id");
CREATE INDEX "don_hang_trang_thai_idx" ON "don_hang"("trang_thai");

CREATE TABLE "chi_tiet_don_hang" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "don_hang_id" UUID NOT NULL,
  "san_pham_id" UUID,
  "ten_san_pham" VARCHAR(200) NOT NULL,
  "ma_san_pham" VARCHAR(50) NOT NULL,
  "so_luong" INTEGER NOT NULL,
  "don_gia" DECIMAL(14,2) NOT NULL,
  "thanh_tien" DECIMAL(14,2) NOT NULL,
  "tuy_chon" JSONB NOT NULL DEFAULT '{}',
  CONSTRAINT "chi_tiet_don_hang_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chi_tiet_don_hang_don_hang_id_fkey" FOREIGN KEY ("don_hang_id") REFERENCES "don_hang"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "chi_tiet_don_hang_don_hang_id_idx" ON "chi_tiet_don_hang"("don_hang_id");

CREATE TABLE "phien_dang_nhap" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nguoi_dung_id" UUID NOT NULL,
  "ma_lam_moi_bam" VARCHAR(500) NOT NULL,
  "dia_chi_ip" VARCHAR(64),
  "trinh_duyet" VARCHAR(500),
  "het_han_luc" TIMESTAMPTZ(6) NOT NULL,
  "da_thu_hoi" BOOLEAN NOT NULL DEFAULT false,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "phien_dang_nhap_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "phien_dang_nhap_nguoi_dung_id_fkey" FOREIGN KEY ("nguoi_dung_id") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "phien_dang_nhap_ma_lam_moi_bam_key" ON "phien_dang_nhap"("ma_lam_moi_bam");
CREATE INDEX "phien_dang_nhap_nguoi_dung_id_idx" ON "phien_dang_nhap"("nguoi_dung_id");

CREATE TABLE "nhat_ky_bao_mat" (
  "id" BIGSERIAL NOT NULL,
  "loai_su_kien" VARCHAR(100) NOT NULL,
  "nguoi_dung_id" UUID,
  "dia_chi_ip" VARCHAR(64),
  "chi_tiet" JSONB NOT NULL DEFAULT '{}',
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nhat_ky_bao_mat_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "nhat_ky_bao_mat_loai_su_kien_idx" ON "nhat_ky_bao_mat"("loai_su_kien");
CREATE INDEX "nhat_ky_bao_mat_ngay_tao_idx" ON "nhat_ky_bao_mat"("ngay_tao");

CREATE TABLE "phien_ban_seed" (
  "id" BIGSERIAL NOT NULL,
  "phien_ban" VARCHAR(60) NOT NULL,
  "mo_ta" VARCHAR(300) NOT NULL,
  "ngay_ap_dung" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "phien_ban_seed_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "phien_ban_seed_phien_ban_key" ON "phien_ban_seed"("phien_ban");
