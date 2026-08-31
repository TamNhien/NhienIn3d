-- v3.1.0: loại bỏ hoàn toàn MFA/TOTP theo yêu cầu và dọn dữ liệu secret đã lưu.
DROP INDEX IF EXISTS "nguoi_dung_mfa_totp_bat_idx";

ALTER TABLE "nguoi_dung"
  DROP COLUMN IF EXISTS "mfa_totp_bat",
  DROP COLUMN IF EXISTS "mfa_totp_secret_ma_hoa",
  DROP COLUMN IF EXISTS "mfa_totp_xac_nhan_luc";
