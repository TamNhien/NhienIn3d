CREATE TABLE "danh_gia_san_pham" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "san_pham_id" UUID NOT NULL,
  "ma_phien" VARCHAR(120) NOT NULL,
  "ho_ten" VARCHAR(120) NOT NULL,
  "so_sao" INTEGER NOT NULL,
  "noi_dung" VARCHAR(1500) NOT NULL,
  "da_duyet" BOOLEAN NOT NULL DEFAULT false,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "danh_gia_san_pham_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "danh_gia_san_pham_so_sao_check" CHECK ("so_sao" BETWEEN 1 AND 5),
  CONSTRAINT "danh_gia_san_pham_san_pham_id_fkey" FOREIGN KEY ("san_pham_id") REFERENCES "san_pham"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "danh_gia_san_pham_ma_phien_san_pham_id_key" ON "danh_gia_san_pham"("ma_phien", "san_pham_id");
CREATE INDEX "danh_gia_san_pham_san_pham_id_da_duyet_idx" ON "danh_gia_san_pham"("san_pham_id", "da_duyet");
CREATE INDEX "danh_gia_san_pham_ngay_tao_idx" ON "danh_gia_san_pham"("ngay_tao");
