-- v3.4.0: gom chuoi su co theo chu ky canh bao va toi uu truy vet incident.
ALTER TABLE "lich_su_van_hanh"
  ADD COLUMN IF NOT EXISTS "chu_ky_canh_bao" VARCHAR(64);

CREATE INDEX IF NOT EXISTS "lich_su_van_hanh_chu_ky_canh_bao_ngay_tao_idx"
  ON "lich_su_van_hanh"("chu_ky_canh_bao", "ngay_tao" DESC);

-- Primary key BigInt da cung cap cursor tang dan cho audit/ops; cac index filter theo ngay
-- tu v3.3.0 duoc giu lai de cursor query khong phai OFFSET tren tap du lieu lon.
