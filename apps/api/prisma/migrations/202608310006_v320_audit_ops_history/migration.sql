-- v3.2.0: lịch sử vận hành cho health/backup/restore.
CREATE TABLE "lich_su_van_hanh" (
  "id" BIGSERIAL PRIMARY KEY,
  "loai" VARCHAR(30) NOT NULL,
  "trang_thai" VARCHAR(30) NOT NULL,
  "mo_ta" VARCHAR(500),
  "chi_tiet" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "ngay_bat_dau" TIMESTAMPTZ(6),
  "ngay_ket_thuc" TIMESTAMPTZ(6),
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);
CREATE INDEX "lich_su_van_hanh_loai_ngay_tao_idx" ON "lich_su_van_hanh"("loai", "ngay_tao" DESC);
CREATE INDEX "lich_su_van_hanh_trang_thai_ngay_tao_idx" ON "lich_su_van_hanh"("trang_thai", "ngay_tao" DESC);
