-- v3.28.0: purchase order, supplier lead time, inventory count sessions.
ALTER TABLE "nha_cung_cap" ADD COLUMN "thoi_gian_giao_hang_ngay" INTEGER NOT NULL DEFAULT 7;

CREATE TABLE "don_mua_hang" (
  "id" UUID NOT NULL,
  "ma_don_mua" VARCHAR(50) NOT NULL,
  "nha_cung_cap_id" UUID NOT NULL,
  "trang_thai" VARCHAR(30) NOT NULL DEFAULT 'NHAP',
  "ngay_du_kien" DATE,
  "ghi_chu" TEXT,
  "nguoi_tao_id" UUID,
  "nguoi_duyet_id" UUID,
  "ngay_duyet" TIMESTAMPTZ(6),
  "tong_so_luong" INTEGER NOT NULL DEFAULT 0,
  "tong_gia_tri" DECIMAL(16,2) NOT NULL DEFAULT 0,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "don_mua_hang_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "don_mua_hang_ma_don_mua_key" ON "don_mua_hang"("ma_don_mua");
CREATE INDEX "don_mua_hang_nha_cung_cap_id_trang_thai_idx" ON "don_mua_hang"("nha_cung_cap_id", "trang_thai");
CREATE INDEX "don_mua_hang_ngay_tao_idx" ON "don_mua_hang"("ngay_tao");
ALTER TABLE "don_mua_hang" ADD CONSTRAINT "don_mua_hang_nha_cung_cap_id_fkey" FOREIGN KEY ("nha_cung_cap_id") REFERENCES "nha_cung_cap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "chi_tiet_don_mua_hang" (
  "id" UUID NOT NULL,
  "don_mua_hang_id" UUID NOT NULL,
  "bien_the_id" UUID NOT NULL,
  "ma_bien_the" VARCHAR(80) NOT NULL,
  "so_luong_dat" INTEGER NOT NULL,
  "so_luong_da_nhan" INTEGER NOT NULL DEFAULT 0,
  "don_gia_nhap" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "ghi_chu" VARCHAR(300),
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chi_tiet_don_mua_hang_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "chi_tiet_don_mua_hang_don_mua_hang_id_bien_the_id_key" ON "chi_tiet_don_mua_hang"("don_mua_hang_id", "bien_the_id");
CREATE INDEX "chi_tiet_don_mua_hang_bien_the_id_idx" ON "chi_tiet_don_mua_hang"("bien_the_id");
ALTER TABLE "chi_tiet_don_mua_hang" ADD CONSTRAINT "chi_tiet_don_mua_hang_don_mua_hang_id_fkey" FOREIGN KEY ("don_mua_hang_id") REFERENCES "don_mua_hang"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chi_tiet_don_mua_hang" ADD CONSTRAINT "chi_tiet_don_mua_hang_bien_the_id_fkey" FOREIGN KEY ("bien_the_id") REFERENCES "bien_the_san_pham"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "phieu_nhap_kho" ADD COLUMN "don_mua_hang_id" UUID;
CREATE INDEX "phieu_nhap_kho_don_mua_hang_id_idx" ON "phieu_nhap_kho"("don_mua_hang_id");
ALTER TABLE "phieu_nhap_kho" ADD CONSTRAINT "phieu_nhap_kho_don_mua_hang_id_fkey" FOREIGN KEY ("don_mua_hang_id") REFERENCES "don_mua_hang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "phien_kiem_ke_kho" (
  "id" UUID NOT NULL,
  "ma_phien" VARCHAR(50) NOT NULL,
  "trang_thai" VARCHAR(30) NOT NULL DEFAULT 'NHAP',
  "ghi_chu" TEXT,
  "nguoi_tao_id" UUID,
  "nguoi_duyet_id" UUID,
  "ngay_gui_duyet" TIMESTAMPTZ(6),
  "ngay_duyet" TIMESTAMPTZ(6),
  "tong_dong" INTEGER NOT NULL DEFAULT 0,
  "tong_chenh_lech_tuyet_doi" INTEGER NOT NULL DEFAULT 0,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "phien_kiem_ke_kho_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "phien_kiem_ke_kho_ma_phien_key" ON "phien_kiem_ke_kho"("ma_phien");
CREATE INDEX "phien_kiem_ke_kho_trang_thai_ngay_tao_idx" ON "phien_kiem_ke_kho"("trang_thai", "ngay_tao");

CREATE TABLE "chi_tiet_phien_kiem_ke_kho" (
  "id" UUID NOT NULL,
  "phien_kiem_ke_id" UUID NOT NULL,
  "bien_the_id" UUID NOT NULL,
  "ma_bien_the" VARCHAR(80) NOT NULL,
  "ton_snapshot" INTEGER NOT NULL,
  "ton_thuc_te" INTEGER NOT NULL,
  "chenh_lech" INTEGER NOT NULL,
  "ly_do" VARCHAR(300),
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chi_tiet_phien_kiem_ke_kho_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "chi_tiet_phien_kiem_ke_kho_phien_kiem_ke_id_bien_the_id_key" ON "chi_tiet_phien_kiem_ke_kho"("phien_kiem_ke_id", "bien_the_id");
CREATE INDEX "chi_tiet_phien_kiem_ke_kho_bien_the_id_idx" ON "chi_tiet_phien_kiem_ke_kho"("bien_the_id");
ALTER TABLE "chi_tiet_phien_kiem_ke_kho" ADD CONSTRAINT "chi_tiet_phien_kiem_ke_kho_phien_kiem_ke_id_fkey" FOREIGN KEY ("phien_kiem_ke_id") REFERENCES "phien_kiem_ke_kho"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chi_tiet_phien_kiem_ke_kho" ADD CONSTRAINT "chi_tiet_phien_kiem_ke_kho_bien_the_id_fkey" FOREIGN KEY ("bien_the_id") REFERENCES "bien_the_san_pham"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
