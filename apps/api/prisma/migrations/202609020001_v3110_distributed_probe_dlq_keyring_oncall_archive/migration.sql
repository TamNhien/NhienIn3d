-- v3.11.0: signed distributed probes, DLQ keyring/replay jobs, online telemetry archive,
-- on-call schedule/escalation policy and incident ownership.

ALTER TABLE "su_co_van_hanh"
  ADD COLUMN IF NOT EXISTS "dich_vu" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "chu_so_huu_id" UUID,
  ADD COLUMN IF NOT EXISTS "chu_so_huu_ten" VARCHAR(150);
CREATE INDEX IF NOT EXISTS "su_co_van_hanh_dich_vu_trang_thai_idx"
  ON "su_co_van_hanh" ("dich_vu", "trang_thai_xu_ly", "gan_nhat" DESC);

CREATE TABLE IF NOT EXISTS "slo_probe_agent" (
  "agent_id" VARCHAR(80) PRIMARY KEY,
  "region" VARCHAR(80) NOT NULL,
  "node_name" VARCHAR(120) NOT NULL,
  "phien_ban" VARCHAR(40),
  "trang_thai" VARCHAR(20) NOT NULL DEFAULT 'ONLINE',
  "lan_heartbeat" TIMESTAMPTZ(6) NOT NULL,
  "lan_mau" TIMESTAMPTZ(6),
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "slo_probe_agent_region_heartbeat_idx" ON "slo_probe_agent" ("region", "lan_heartbeat" DESC);
CREATE INDEX IF NOT EXISTS "slo_probe_agent_status_heartbeat_idx" ON "slo_probe_agent" ("trang_thai", "lan_heartbeat" DESC);

CREATE TABLE IF NOT EXISTS "slo_probe_nonce" (
  "agent_id" VARCHAR(80) NOT NULL,
  "nonce" VARCHAR(80) NOT NULL,
  "het_han_luc" TIMESTAMPTZ(6) NOT NULL,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  PRIMARY KEY ("agent_id", "nonce")
);
CREATE INDEX IF NOT EXISTS "slo_probe_nonce_expire_idx" ON "slo_probe_nonce" ("het_han_luc");

CREATE TABLE IF NOT EXISTS "webhook_retry_budget" (
  "budget_key" CHAR(64) PRIMARY KEY,
  "endpoint" TEXT NOT NULL,
  "adapter" VARCHAR(20) NOT NULL,
  "window_start" TIMESTAMPTZ(6) NOT NULL,
  "da_dung" INTEGER NOT NULL DEFAULT 0,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "webhook_retry_budget_window_idx" ON "webhook_retry_budget" ("window_start");

CREATE TABLE IF NOT EXISTS "webhook_replay_job" (
  "id" UUID PRIMARY KEY,
  "trang_thai" VARCHAR(30) NOT NULL DEFAULT 'CHO_XU_LY',
  "tong" INTEGER NOT NULL DEFAULT 0,
  "da_xu_ly" INTEGER NOT NULL DEFAULT 0,
  "thanh_cong" INTEGER NOT NULL DEFAULT 0,
  "that_bai" INTEGER NOT NULL DEFAULT 0,
  "da_huy" BOOLEAN NOT NULL DEFAULT false,
  "bo_qua_idempotency" BOOLEAN NOT NULL DEFAULT false,
  "nguoi_tao_id" UUID,
  "nguoi_tao_ten" VARCHAR(150),
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "webhook_replay_job_status_time_idx" ON "webhook_replay_job" ("trang_thai", "ngay_tao" DESC);

CREATE TABLE IF NOT EXISTS "webhook_replay_item" (
  "id" UUID PRIMARY KEY,
  "job_id" UUID NOT NULL REFERENCES "webhook_replay_job"("id") ON DELETE CASCADE,
  "dead_letter_history_id" BIGINT NOT NULL,
  "trang_thai" VARCHAR(30) NOT NULL DEFAULT 'CHO_XU_LY',
  "loi" TEXT,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "webhook_replay_item_job_dead_letter_unique" UNIQUE ("job_id", "dead_letter_history_id")
);
CREATE INDEX IF NOT EXISTS "webhook_replay_item_job_status_idx" ON "webhook_replay_item" ("job_id", "trang_thai");

CREATE TABLE IF NOT EXISTS "ops_on_call_schedule" (
  "id" UUID PRIMARY KEY,
  "dich_vu" VARCHAR(80) NOT NULL,
  "nguoi_dung_id" UUID NOT NULL REFERENCES "nguoi_dung"("id") ON DELETE CASCADE,
  "thu_trong_tuan" INTEGER NOT NULL,
  "bat_dau_phut" INTEGER NOT NULL,
  "ket_thuc_phut" INTEGER NOT NULL,
  "timezone" VARCHAR(80) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  "cap_escalation" INTEGER NOT NULL DEFAULT 1,
  "dang_hoat_dong" BOOLEAN NOT NULL DEFAULT true,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "ops_on_call_schedule_weekday_check" CHECK ("thu_trong_tuan" BETWEEN 0 AND 6),
  CONSTRAINT "ops_on_call_schedule_start_check" CHECK ("bat_dau_phut" BETWEEN 0 AND 1439),
  CONSTRAINT "ops_on_call_schedule_end_check" CHECK ("ket_thuc_phut" BETWEEN 0 AND 1439),
  CONSTRAINT "ops_on_call_schedule_escalation_check" CHECK ("cap_escalation" BETWEEN 1 AND 5)
);
CREATE INDEX IF NOT EXISTS "ops_on_call_schedule_service_day_idx" ON "ops_on_call_schedule" ("dich_vu", "thu_trong_tuan", "dang_hoat_dong");
CREATE INDEX IF NOT EXISTS "ops_on_call_schedule_user_idx" ON "ops_on_call_schedule" ("nguoi_dung_id", "dang_hoat_dong");

CREATE TABLE IF NOT EXISTS "ops_escalation_policy" (
  "id" UUID PRIMARY KEY,
  "dich_vu" VARCHAR(80) NOT NULL,
  "cap_escalation" INTEGER NOT NULL,
  "sau_phut" INTEGER NOT NULL,
  "kenh" VARCHAR(40) NOT NULL DEFAULT 'EMAIL_WEBHOOK',
  "dang_hoat_dong" BOOLEAN NOT NULL DEFAULT true,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "ops_escalation_policy_unique" UNIQUE ("dich_vu", "cap_escalation"),
  CONSTRAINT "ops_escalation_level_check" CHECK ("cap_escalation" BETWEEN 1 AND 5),
  CONSTRAINT "ops_escalation_delay_check" CHECK ("sau_phut" BETWEEN 0 AND 10080)
);
CREATE INDEX IF NOT EXISTS "ops_escalation_policy_service_idx" ON "ops_escalation_policy" ("dich_vu", "dang_hoat_dong");

CREATE TABLE IF NOT EXISTS "ops_archive_batch" (
  "id" UUID PRIMARY KEY,
  "bang_nguon" VARCHAR(80) NOT NULL,
  "thang" CHAR(7) NOT NULL,
  "partition_name" VARCHAR(120) NOT NULL,
  "so_ban_ghi" INTEGER NOT NULL,
  "sha256" CHAR(64) NOT NULL,
  "trang_thai" VARCHAR(30) NOT NULL,
  "nguoi_tao_id" UUID,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "ops_archive_batch_source_month_unique" UNIQUE ("bang_nguon", "thang")
);
CREATE INDEX IF NOT EXISTS "ops_archive_batch_time_idx" ON "ops_archive_batch" ("ngay_tao" DESC);

CREATE TABLE IF NOT EXISTS "ops_telemetry_archive" (
  "source_table" VARCHAR(80) NOT NULL,
  "source_id" BIGINT NOT NULL,
  "archive_month" DATE NOT NULL,
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL,
  "payload" JSONB NOT NULL,
  "archived_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
) PARTITION BY RANGE ("archive_month");

-- Partitions are created online by the v3.11.0 archive service, one month at a time.
