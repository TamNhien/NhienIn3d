ALTER TABLE "nguoi_dung"
  ADD COLUMN "mfa_totp_bat" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "mfa_totp_secret_ma_hoa" TEXT,
  ADD COLUMN "mfa_totp_xac_nhan_luc" TIMESTAMPTZ(6);

CREATE INDEX "nguoi_dung_mfa_totp_bat_idx" ON "nguoi_dung"("mfa_totp_bat");
