CREATE TABLE "dat_lai_mat_khau" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nguoi_dung_id" UUID NOT NULL,
  "ma_bi_mat_bam" VARCHAR(64) NOT NULL,
  "het_han_luc" TIMESTAMPTZ(6) NOT NULL,
  "da_su_dung" BOOLEAN NOT NULL DEFAULT false,
  "dia_chi_ip" VARCHAR(64),
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_su_dung" TIMESTAMPTZ(6),
  CONSTRAINT "dat_lai_mat_khau_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dat_lai_mat_khau_nguoi_dung_id_fkey" FOREIGN KEY ("nguoi_dung_id") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "dat_lai_mat_khau_ma_bi_mat_bam_key" ON "dat_lai_mat_khau"("ma_bi_mat_bam");
CREATE INDEX "dat_lai_mat_khau_nguoi_dung_id_da_su_dung_idx" ON "dat_lai_mat_khau"("nguoi_dung_id", "da_su_dung");
CREATE INDEX "dat_lai_mat_khau_het_han_luc_idx" ON "dat_lai_mat_khau"("het_han_luc");
CREATE INDEX "dat_lai_mat_khau_ngay_tao_idx" ON "dat_lai_mat_khau"("ngay_tao");
