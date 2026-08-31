-- v2.17.0: cấu hình cảnh báo tồn kho thấp dùng chung cho Dashboard và Kho.
CREATE TABLE IF NOT EXISTS "cau_hinh_he_thong" (
  "khoa" VARCHAR(100) NOT NULL,
  "gia_tri" JSONB NOT NULL,
  "nguoi_cap_nhat_id" UUID,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cau_hinh_he_thong_pkey" PRIMARY KEY ("khoa")
);

INSERT INTO "cau_hinh_he_thong" ("khoa", "gia_tri", "nguoi_cap_nhat_id", "ngay_cap_nhat")
VALUES ('KHO', '{"nguong_sap_het":5}'::jsonb, NULL, CURRENT_TIMESTAMP)
ON CONFLICT ("khoa") DO NOTHING;
