-- NhienIn3d v3.29.0: RMA/doi-tra, partial refund ledger, historical cost snapshot.
CREATE TYPE "TrangThaiYeuCauDoiTra" AS ENUM ('CHO_DUYET', 'DA_DUYET', 'DA_NHAN_HANG', 'HOAN_TAT', 'HUY');
CREATE TYPE "XuLyDoiTra" AS ENUM ('HOAN_TIEN', 'DOI_HANG');

ALTER TABLE "chi_tiet_don_hang" ADD COLUMN "gia_von_snapshot" DECIMAL(14,2);

-- Backfill legacy lines from the current product cost. This is an operational estimate,
-- not a claim that historical cost was identical at the original sale time.
UPDATE "chi_tiet_don_hang" ct
SET "gia_von_snapshot" = sp."gia_von"
FROM "san_pham" sp
WHERE ct."san_pham_id" = sp."id"
  AND ct."gia_von_snapshot" IS NULL
  AND sp."gia_von" IS NOT NULL;

CREATE TABLE "yeu_cau_doi_tra" (
  "id" UUID NOT NULL,
  "ma_yeu_cau" VARCHAR(50) NOT NULL,
  "don_hang_id" UUID NOT NULL,
  "trang_thai" "TrangThaiYeuCauDoiTra" NOT NULL DEFAULT 'CHO_DUYET',
  "ly_do" VARCHAR(500) NOT NULL,
  "ghi_chu" TEXT,
  "nguoi_tao_id" UUID,
  "nguoi_duyet_id" UUID,
  "ngay_duyet" TIMESTAMPTZ(6),
  "ngay_nhan_hang" TIMESTAMPTZ(6),
  "ngay_hoan_tat" TIMESTAMPTZ(6),
  "tong_tien_hoan_duyet" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "yeu_cau_doi_tra_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "yeu_cau_doi_tra_ma_yeu_cau_key" ON "yeu_cau_doi_tra"("ma_yeu_cau");
CREATE INDEX "yeu_cau_doi_tra_don_hang_id_trang_thai_idx" ON "yeu_cau_doi_tra"("don_hang_id", "trang_thai");
CREATE INDEX "yeu_cau_doi_tra_trang_thai_ngay_tao_idx" ON "yeu_cau_doi_tra"("trang_thai", "ngay_tao");

CREATE TABLE "chi_tiet_doi_tra" (
  "id" UUID NOT NULL,
  "yeu_cau_id" UUID NOT NULL,
  "chi_tiet_don_hang_id" UUID NOT NULL,
  "bien_the_id" UUID,
  "ma_bien_the" VARCHAR(80),
  "so_luong_y_cau" INTEGER NOT NULL,
  "so_luong_nhan" INTEGER NOT NULL DEFAULT 0,
  "xu_ly" "XuLyDoiTra" NOT NULL DEFAULT 'HOAN_TIEN',
  "nhap_lai_ton" BOOLEAN NOT NULL DEFAULT false,
  "so_tien_hoan_duyet" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "ly_do" VARCHAR(500),
  CONSTRAINT "chi_tiet_doi_tra_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "chi_tiet_doi_tra_yeu_cau_id_chi_tiet_don_hang_id_key" ON "chi_tiet_doi_tra"("yeu_cau_id", "chi_tiet_don_hang_id");
CREATE INDEX "chi_tiet_doi_tra_chi_tiet_don_hang_id_idx" ON "chi_tiet_doi_tra"("chi_tiet_don_hang_id");
CREATE INDEX "chi_tiet_doi_tra_bien_the_id_idx" ON "chi_tiet_doi_tra"("bien_the_id");

CREATE TABLE "hoan_tien_don_hang" (
  "id" UUID NOT NULL,
  "don_hang_id" UUID NOT NULL,
  "yeu_cau_doi_tra_id" UUID,
  "thanh_toan_id" UUID,
  "so_tien" DECIMAL(14,2) NOT NULL,
  "ghi_chu" VARCHAR(500),
  "nguoi_xac_nhan_id" UUID,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hoan_tien_don_hang_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "hoan_tien_don_hang_don_hang_id_ngay_tao_idx" ON "hoan_tien_don_hang"("don_hang_id", "ngay_tao");
CREATE INDEX "hoan_tien_don_hang_yeu_cau_doi_tra_id_idx" ON "hoan_tien_don_hang"("yeu_cau_doi_tra_id");
CREATE INDEX "hoan_tien_don_hang_thanh_toan_id_idx" ON "hoan_tien_don_hang"("thanh_toan_id");

ALTER TABLE "yeu_cau_doi_tra" ADD CONSTRAINT "yeu_cau_doi_tra_don_hang_id_fkey" FOREIGN KEY ("don_hang_id") REFERENCES "don_hang"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chi_tiet_doi_tra" ADD CONSTRAINT "chi_tiet_doi_tra_yeu_cau_id_fkey" FOREIGN KEY ("yeu_cau_id") REFERENCES "yeu_cau_doi_tra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chi_tiet_doi_tra" ADD CONSTRAINT "chi_tiet_doi_tra_chi_tiet_don_hang_id_fkey" FOREIGN KEY ("chi_tiet_don_hang_id") REFERENCES "chi_tiet_don_hang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chi_tiet_doi_tra" ADD CONSTRAINT "chi_tiet_doi_tra_bien_the_id_fkey" FOREIGN KEY ("bien_the_id") REFERENCES "bien_the_san_pham"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hoan_tien_don_hang" ADD CONSTRAINT "hoan_tien_don_hang_don_hang_id_fkey" FOREIGN KEY ("don_hang_id") REFERENCES "don_hang"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hoan_tien_don_hang" ADD CONSTRAINT "hoan_tien_don_hang_yeu_cau_doi_tra_id_fkey" FOREIGN KEY ("yeu_cau_doi_tra_id") REFERENCES "yeu_cau_doi_tra"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hoan_tien_don_hang" ADD CONSTRAINT "hoan_tien_don_hang_thanh_toan_id_fkey" FOREIGN KEY ("thanh_toan_id") REFERENCES "thanh_toan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
