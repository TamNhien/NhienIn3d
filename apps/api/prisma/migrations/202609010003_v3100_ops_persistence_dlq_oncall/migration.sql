-- v3.10.0: persistent endpoint SLI samples, encrypted webhook DLQ payloads,
-- cached Ops metrics and service/on-call assignments.

CREATE TABLE IF NOT EXISTS "slo_endpoint_mau" (
  "id" BIGSERIAL PRIMARY KEY,
  "endpoint_id" VARCHAR(80) NOT NULL,
  "agent_id" VARCHAR(80) NOT NULL,
  "region" VARCHAR(80) NOT NULL DEFAULT 'local',
  "node_name" VARCHAR(120) NOT NULL DEFAULT 'local',
  "trang_thai" VARCHAR(20) NOT NULL,
  "http_status" INTEGER,
  "do_tre_ms" DOUBLE PRECISION NOT NULL,
  "latency_target_ms" INTEGER NOT NULL,
  "apdex_t_ms" INTEGER NOT NULL,
  "apdex_bucket" VARCHAR(20) NOT NULL,
  "maintenance_active" BOOLEAN NOT NULL DEFAULT false,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "slo_endpoint_mau_endpoint_time_idx" ON "slo_endpoint_mau" ("endpoint_id", "ngay_tao" DESC);
CREATE INDEX IF NOT EXISTS "slo_endpoint_mau_agent_time_idx" ON "slo_endpoint_mau" ("agent_id", "ngay_tao" DESC);
CREATE INDEX IF NOT EXISTS "slo_endpoint_mau_region_time_idx" ON "slo_endpoint_mau" ("region", "ngay_tao" DESC);

CREATE TABLE IF NOT EXISTS "webhook_dlq_payload" (
  "id" UUID PRIMARY KEY,
  "dead_letter_history_id" BIGINT UNIQUE,
  "payload_ciphertext" TEXT NOT NULL,
  "iv" VARCHAR(64) NOT NULL,
  "auth_tag" VARCHAR(64) NOT NULL,
  "key_id" VARCHAR(64) NOT NULL,
  "payload_hash" CHAR(64) NOT NULL,
  "idempotency_key" CHAR(64) NOT NULL,
  "endpoint" TEXT NOT NULL,
  "adapter" VARCHAR(20) NOT NULL,
  "trang_thai" VARCHAR(30) NOT NULL DEFAULT 'CHO_RETRY',
  "so_lan_retry_tu_dong" INTEGER NOT NULL DEFAULT 0,
  "retry_tiep_theo_luc" TIMESTAMPTZ(6),
  "het_han_luc" TIMESTAMPTZ(6) NOT NULL,
  "loi_cuoi" TEXT,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "webhook_dlq_payload_status_retry_idx" ON "webhook_dlq_payload" ("trang_thai", "retry_tiep_theo_luc");
CREATE INDEX IF NOT EXISTS "webhook_dlq_payload_expire_idx" ON "webhook_dlq_payload" ("het_han_luc");
CREATE INDEX IF NOT EXISTS "webhook_dlq_payload_idempotency_idx" ON "webhook_dlq_payload" ("idempotency_key");

CREATE TABLE IF NOT EXISTS "ops_metric_cache" (
  "khoa" VARCHAR(80) PRIMARY KEY,
  "gia_tri" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "refreshed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ops_phan_cong" (
  "id" UUID PRIMARY KEY,
  "nguoi_dung_id" UUID NOT NULL REFERENCES "nguoi_dung"("id") ON DELETE CASCADE,
  "dich_vu" VARCHAR(80) NOT NULL,
  "vai_tro_ops" VARCHAR(30) NOT NULL,
  "cap_escalation" INTEGER NOT NULL DEFAULT 1,
  "dang_hoat_dong" BOOLEAN NOT NULL DEFAULT true,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "ops_phan_cong_unique" UNIQUE ("nguoi_dung_id", "dich_vu", "vai_tro_ops"),
  CONSTRAINT "ops_phan_cong_role_check" CHECK ("vai_tro_ops" IN ('OPS_VIEWER','ON_CALL','SERVICE_OWNER')),
  CONSTRAINT "ops_phan_cong_escalation_check" CHECK ("cap_escalation" BETWEEN 1 AND 5)
);
CREATE INDEX IF NOT EXISTS "ops_phan_cong_service_idx" ON "ops_phan_cong" ("dich_vu", "dang_hoat_dong");
CREATE INDEX IF NOT EXISTS "ops_phan_cong_user_idx" ON "ops_phan_cong" ("nguoi_dung_id", "dang_hoat_dong");
