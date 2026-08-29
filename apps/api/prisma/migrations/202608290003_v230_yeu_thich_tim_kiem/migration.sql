CREATE TABLE "yeu_thich" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ma_phien" VARCHAR(120) NOT NULL,
  "san_pham_id" UUID NOT NULL,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "yeu_thich_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "yeu_thich_san_pham_id_fkey" FOREIGN KEY ("san_pham_id") REFERENCES "san_pham"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "yeu_thich_ma_phien_san_pham_id_key" ON "yeu_thich"("ma_phien", "san_pham_id");
CREATE INDEX "yeu_thich_ma_phien_idx" ON "yeu_thich"("ma_phien");
CREATE INDEX "yeu_thich_san_pham_id_idx" ON "yeu_thich"("san_pham_id");
