-- v3.9.0: incident full-text index + materialized Ops incident metrics.
ALTER TABLE "lich_su_van_hanh"
  ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple'::regconfig, coalesce("mo_ta", '')), 'A') ||
    setweight(to_tsvector('simple'::regconfig, coalesce("loai", '')), 'B') ||
    setweight(to_tsvector('simple'::regconfig, coalesce("trang_thai", '')), 'B') ||
    setweight(to_tsvector('simple'::regconfig, coalesce("chi_tiet"::text, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS "lich_su_van_hanh_search_vector_gin_idx"
  ON "lich_su_van_hanh" USING GIN ("search_vector");

CREATE INDEX IF NOT EXISTS "lich_su_van_hanh_incident_cursor_v390_idx"
  ON "lich_su_van_hanh" ("chu_ky_canh_bao", "id" DESC)
  WHERE "chu_ky_canh_bao" IS NOT NULL;

DROP MATERIALIZED VIEW IF EXISTS "ops_incident_metrics_v390";
CREATE MATERIALIZED VIEW "ops_incident_metrics_v390" AS
SELECT
  1::integer AS id,
  count(*)::bigint AS tong_incident,
  count(*) FILTER (WHERE "trang_thai_xu_ly" <> 'DA_KHAC_PHUC')::bigint AS dang_mo,
  count(*) FILTER (WHERE "trang_thai_xu_ly" = 'DA_KHAC_PHUC')::bigint AS da_khac_phuc,
  avg(EXTRACT(EPOCH FROM ("tiep_nhan_luc" - "bat_dau")) / 60.0) FILTER (WHERE "tiep_nhan_luc" IS NOT NULL) AS mtta_phut,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("tiep_nhan_luc" - "bat_dau")) / 60.0) FILTER (WHERE "tiep_nhan_luc" IS NOT NULL) AS mtta_p95_phut,
  avg(EXTRACT(EPOCH FROM ("khac_phuc_luc" - "bat_dau")) / 60.0) FILTER (WHERE "khac_phuc_luc" IS NOT NULL) AS mttr_phut,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("khac_phuc_luc" - "bat_dau")) / 60.0) FILTER (WHERE "khac_phuc_luc" IS NOT NULL) AS mttr_p95_phut,
  now() AS refreshed_at
FROM "su_co_van_hanh";

CREATE UNIQUE INDEX "ops_incident_metrics_v390_id_idx"
  ON "ops_incident_metrics_v390" (id);
