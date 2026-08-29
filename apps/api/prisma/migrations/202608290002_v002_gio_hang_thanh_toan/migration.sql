CREATE TYPE "TrangThaiGioHang" AS ENUM ('DANG_MO', 'DA_DAT_HANG', 'HET_HAN');
CREATE TYPE "TrangThaiThanhToan" AS ENUM ('CHO_THANH_TOAN', 'DA_THANH_TOAN', 'THAT_BAI', 'DA_HOAN_TIEN');

CREATE TABLE "gio_hang" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ma_phien" VARCHAR(120) NOT NULL,
  "nguoi_dung_id" UUID,
  "trang_thai" "TrangThaiGioHang" NOT NULL DEFAULT 'DANG_MO',
  "ngay_het_han" TIMESTAMPTZ(6) NOT NULL,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "gio_hang_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "gio_hang_nguoi_dung_id_fkey" FOREIGN KEY ("nguoi_dung_id") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "gio_hang_ma_phien_key" ON "gio_hang"("ma_phien");
CREATE INDEX "gio_hang_nguoi_dung_id_idx" ON "gio_hang"("nguoi_dung_id");
CREATE INDEX "gio_hang_trang_thai_idx" ON "gio_hang"("trang_thai");

CREATE TABLE "chi_tiet_gio_hang" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "gio_hang_id" UUID NOT NULL,
  "bien_the_id" UUID NOT NULL,
  "so_luong" INTEGER NOT NULL,
  "don_gia" DECIMAL(14,2) NOT NULL,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chi_tiet_gio_hang_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chi_tiet_gio_hang_gio_hang_id_fkey" FOREIGN KEY ("gio_hang_id") REFERENCES "gio_hang"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "chi_tiet_gio_hang_bien_the_id_fkey" FOREIGN KEY ("bien_the_id") REFERENCES "bien_the_san_pham"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "chi_tiet_gio_hang_gio_hang_id_bien_the_id_key" ON "chi_tiet_gio_hang"("gio_hang_id", "bien_the_id");
CREATE INDEX "chi_tiet_gio_hang_gio_hang_id_idx" ON "chi_tiet_gio_hang"("gio_hang_id");
CREATE INDEX "chi_tiet_gio_hang_bien_the_id_idx" ON "chi_tiet_gio_hang"("bien_the_id");

CREATE TABLE "phuong_thuc_thanh_toan" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ma_phuong_thuc" VARCHAR(50) NOT NULL,
  "ten_phuong_thuc" VARCHAR(150) NOT NULL,
  "mo_ta" TEXT,
  "dang_hoat_dong" BOOLEAN NOT NULL DEFAULT false,
  "thu_tu" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "phuong_thuc_thanh_toan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "phuong_thuc_thanh_toan_ma_phuong_thuc_key" ON "phuong_thuc_thanh_toan"("ma_phuong_thuc");

CREATE TABLE "thanh_toan" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "don_hang_id" UUID NOT NULL,
  "phuong_thuc_id" UUID NOT NULL,
  "ma_giao_dich" VARCHAR(80) NOT NULL,
  "so_tien" DECIMAL(14,2) NOT NULL,
  "trang_thai" "TrangThaiThanhToan" NOT NULL DEFAULT 'CHO_THANH_TOAN',
  "noi_dung" TEXT,
  "ngay_thanh_toan" TIMESTAMPTZ(6),
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "thanh_toan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "thanh_toan_don_hang_id_fkey" FOREIGN KEY ("don_hang_id") REFERENCES "don_hang"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "thanh_toan_phuong_thuc_id_fkey" FOREIGN KEY ("phuong_thuc_id") REFERENCES "phuong_thuc_thanh_toan"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "thanh_toan_ma_giao_dich_key" ON "thanh_toan"("ma_giao_dich");
CREATE INDEX "thanh_toan_don_hang_id_idx" ON "thanh_toan"("don_hang_id");
CREATE INDEX "thanh_toan_phuong_thuc_id_idx" ON "thanh_toan"("phuong_thuc_id");
CREATE INDEX "thanh_toan_trang_thai_idx" ON "thanh_toan"("trang_thai");

CREATE TABLE "dia_chi_nguoi_dung" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nguoi_dung_id" UUID NOT NULL,
  "ten_nguoi_nhan" VARCHAR(150) NOT NULL,
  "so_dien_thoai" VARCHAR(30) NOT NULL,
  "tinh_thanh" VARCHAR(120) NOT NULL,
  "quan_huyen" VARCHAR(120) NOT NULL,
  "phuong_xa" VARCHAR(120) NOT NULL,
  "dia_chi_cu_the" TEXT NOT NULL,
  "la_mac_dinh" BOOLEAN NOT NULL DEFAULT false,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dia_chi_nguoi_dung_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dia_chi_nguoi_dung_nguoi_dung_id_fkey" FOREIGN KEY ("nguoi_dung_id") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "dia_chi_nguoi_dung_nguoi_dung_id_idx" ON "dia_chi_nguoi_dung"("nguoi_dung_id");
