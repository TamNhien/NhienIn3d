-- v2.19.0: nhà cung cấp + định mức tồn min/max theo biến thể.
CREATE TABLE "nha_cung_cap" (
  "id" UUID NOT NULL,
  "ma_nha_cung_cap" VARCHAR(50) NOT NULL,
  "ten_nha_cung_cap" VARCHAR(180) NOT NULL,
  "nguoi_lien_he" VARCHAR(120),
  "so_dien_thoai" VARCHAR(30),
  "thu_dien_tu" VARCHAR(190),
  "dia_chi" TEXT,
  "ghi_chu" TEXT,
  "dang_hoat_dong" BOOLEAN NOT NULL DEFAULT true,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nha_cung_cap_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "nha_cung_cap_ma_nha_cung_cap_key" ON "nha_cung_cap"("ma_nha_cung_cap");
CREATE INDEX "nha_cung_cap_ten_nha_cung_cap_idx" ON "nha_cung_cap"("ten_nha_cung_cap");
CREATE INDEX "nha_cung_cap_dang_hoat_dong_idx" ON "nha_cung_cap"("dang_hoat_dong");

ALTER TABLE "bien_the_san_pham" ADD COLUMN "ton_toi_thieu" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "bien_the_san_pham" ADD COLUMN "ton_toi_da" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "phieu_nhap_kho" ADD COLUMN "nha_cung_cap_id" UUID;
CREATE INDEX "phieu_nhap_kho_nha_cung_cap_id_idx" ON "phieu_nhap_kho"("nha_cung_cap_id");
ALTER TABLE "phieu_nhap_kho" ADD CONSTRAINT "phieu_nhap_kho_nha_cung_cap_id_fkey" FOREIGN KEY ("nha_cung_cap_id") REFERENCES "nha_cung_cap"("id") ON DELETE SET NULL ON UPDATE CASCADE;
