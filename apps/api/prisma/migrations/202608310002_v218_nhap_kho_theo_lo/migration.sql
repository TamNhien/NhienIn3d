-- v2.18.0 - nhập kho nhanh theo lô/import CSV-Excel.
CREATE TABLE "phieu_nhap_kho" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ma_phieu" VARCHAR(40) NOT NULL,
  "ma_lo" VARCHAR(80),
  "nha_cung_cap" VARCHAR(180),
  "ghi_chu" TEXT,
  "nguoi_tao_id" UUID,
  "so_dong" INTEGER NOT NULL DEFAULT 0,
  "tong_so_luong" INTEGER NOT NULL DEFAULT 0,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "phieu_nhap_kho_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chi_tiet_phieu_nhap_kho" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "phieu_nhap_id" UUID NOT NULL,
  "bien_the_id" UUID NOT NULL,
  "ma_bien_the" VARCHAR(80) NOT NULL,
  "so_luong_nhap" INTEGER NOT NULL,
  "ton_truoc" INTEGER NOT NULL,
  "ton_sau" INTEGER NOT NULL,
  "ly_do" VARCHAR(300),
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chi_tiet_phieu_nhap_kho_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "phieu_nhap_kho_ma_phieu_key" ON "phieu_nhap_kho"("ma_phieu");
CREATE INDEX "phieu_nhap_kho_ngay_tao_idx" ON "phieu_nhap_kho"("ngay_tao");
CREATE INDEX "phieu_nhap_kho_ma_lo_idx" ON "phieu_nhap_kho"("ma_lo");
CREATE INDEX "chi_tiet_phieu_nhap_kho_phieu_nhap_id_idx" ON "chi_tiet_phieu_nhap_kho"("phieu_nhap_id");
CREATE INDEX "chi_tiet_phieu_nhap_kho_bien_the_id_idx" ON "chi_tiet_phieu_nhap_kho"("bien_the_id");
CREATE INDEX "chi_tiet_phieu_nhap_kho_ngay_tao_idx" ON "chi_tiet_phieu_nhap_kho"("ngay_tao");

ALTER TABLE "chi_tiet_phieu_nhap_kho"
  ADD CONSTRAINT "chi_tiet_phieu_nhap_kho_phieu_nhap_id_fkey"
  FOREIGN KEY ("phieu_nhap_id") REFERENCES "phieu_nhap_kho"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chi_tiet_phieu_nhap_kho"
  ADD CONSTRAINT "chi_tiet_phieu_nhap_kho_bien_the_id_fkey"
  FOREIGN KEY ("bien_the_id") REFERENCES "bien_the_san_pham"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
