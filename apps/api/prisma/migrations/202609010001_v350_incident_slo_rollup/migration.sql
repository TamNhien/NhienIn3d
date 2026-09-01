-- v3.5.0: incident aggregate + acknowledge/resolve workflow
CREATE TABLE "su_co_van_hanh" (
  "chu_ky" VARCHAR(64) NOT NULL,
  "trang_thai_xu_ly" VARCHAR(30) NOT NULL DEFAULT 'MOI',
  "van_de" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "bat_dau" TIMESTAMPTZ(6) NOT NULL,
  "gan_nhat" TIMESTAMPTZ(6) NOT NULL,
  "so_su_kien" INTEGER NOT NULL DEFAULT 0,
  "so_health" INTEGER NOT NULL DEFAULT 0,
  "so_alert" INTEGER NOT NULL DEFAULT 0,
  "trang_thai_gan_nhat" VARCHAR(30) NOT NULL,
  "ghi_chu" TEXT,
  "nguoi_tiep_nhan_id" UUID,
  "nguoi_tiep_nhan_ten" VARCHAR(150),
  "tiep_nhan_luc" TIMESTAMPTZ(6),
  "nguoi_khac_phuc_id" UUID,
  "nguoi_khac_phuc_ten" VARCHAR(150),
  "khac_phuc_luc" TIMESTAMPTZ(6),
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "su_co_van_hanh_pkey" PRIMARY KEY ("chu_ky")
);

CREATE INDEX "su_co_van_hanh_trang_thai_xu_ly_gan_nhat_idx" ON "su_co_van_hanh"("trang_thai_xu_ly", "gan_nhat" DESC);
CREATE INDEX "su_co_van_hanh_gan_nhat_idx" ON "su_co_van_hanh"("gan_nhat" DESC);

-- Backfill one aggregate row per existing alert signature so incident listing no longer scans
-- the latest 5,000 operational history rows on every request.
INSERT INTO "su_co_van_hanh" (
  "chu_ky", "trang_thai_xu_ly", "van_de", "bat_dau", "gan_nhat",
  "so_su_kien", "so_health", "so_alert", "trang_thai_gan_nhat",
  "ngay_tao", "ngay_cap_nhat"
)
SELECT
  "chu_ky_canh_bao",
  'MOI',
  COALESCE((jsonb_agg("chi_tiet"->'van_de' ORDER BY "id" DESC) FILTER (WHERE jsonb_typeof("chi_tiet"->'van_de') = 'array'))->0, '[]'::jsonb),
  MIN("ngay_tao"),
  MAX("ngay_tao"),
  COUNT(*)::int,
  COUNT(*) FILTER (WHERE "loai" = 'HEALTH')::int,
  COUNT(*) FILTER (WHERE "loai" = 'ALERT')::int,
  (array_agg("trang_thai" ORDER BY "id" DESC))[1],
  MIN("ngay_tao"),
  MAX("ngay_tao")
FROM "lich_su_van_hanh"
WHERE "chu_ky_canh_bao" IS NOT NULL
GROUP BY "chu_ky_canh_bao"
ON CONFLICT ("chu_ky") DO NOTHING;
