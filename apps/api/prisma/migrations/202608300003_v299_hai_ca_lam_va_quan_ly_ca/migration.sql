-- v2.9.9: chuẩn hóa lịch làm việc về 2 ca mặc định:
--   CA01: 06:00-14:00
--   CA02: 14:00-22:00
-- Các phân ca cũ được quy về ca sáng/ca chiều theo giờ bắt đầu của mẫu ca cũ.
-- Nếu một nhân viên/ngày có nhiều mẫu cũ cùng quy về một ca, giữ bản ghi cũ nhất.

INSERT INTO "ca_lam_viec" ("ma_ca", "ten_ca", "gio_bat_dau", "gio_ket_thuc", "mau_hien_thi", "dang_hoat_dong")
VALUES
  ('CA01', 'Ca sáng', '06:00', '14:00', '#38BDF8', TRUE),
  ('CA02', 'Ca chiều', '14:00', '22:00', '#A855F7', TRUE)
ON CONFLICT ("ma_ca") DO UPDATE SET
  "ten_ca" = EXCLUDED."ten_ca",
  "gio_bat_dau" = EXCLUDED."gio_bat_dau",
  "gio_ket_thuc" = EXCLUDED."gio_ket_thuc",
  "mau_hien_thi" = EXCLUDED."mau_hien_thi",
  "dang_hoat_dong" = TRUE,
  "ngay_cap_nhat" = CURRENT_TIMESTAMP;

-- Xóa các phân ca trùng sẽ phát sinh sau khi gom nhiều mẫu ca cũ về 2 ca mới.
WITH muc_tieu AS (
  SELECT
    pc."id",
    pc."nhan_vien_id",
    pc."ngay_lam",
    CASE
      WHEN clv."gio_bat_dau" < '14:00' THEN (SELECT "id" FROM "ca_lam_viec" WHERE "ma_ca" = 'CA01')
      ELSE (SELECT "id" FROM "ca_lam_viec" WHERE "ma_ca" = 'CA02')
    END AS "ca_moi_id",
    ROW_NUMBER() OVER (
      PARTITION BY pc."nhan_vien_id", pc."ngay_lam",
        CASE
          WHEN clv."gio_bat_dau" < '14:00' THEN (SELECT "id" FROM "ca_lam_viec" WHERE "ma_ca" = 'CA01')
          ELSE (SELECT "id" FROM "ca_lam_viec" WHERE "ma_ca" = 'CA02')
        END
      ORDER BY pc."ngay_tao" ASC, pc."id" ASC
    ) AS "thu_tu"
  FROM "phan_ca" pc
  JOIN "ca_lam_viec" clv ON clv."id" = pc."ca_lam_viec_id"
)
DELETE FROM "phan_ca" pc
USING muc_tieu mt
WHERE pc."id" = mt."id" AND mt."thu_tu" > 1;

UPDATE "phan_ca" pc
SET "ca_lam_viec_id" = CASE
  WHEN clv."gio_bat_dau" < '14:00' THEN (SELECT "id" FROM "ca_lam_viec" WHERE "ma_ca" = 'CA01')
  ELSE (SELECT "id" FROM "ca_lam_viec" WHERE "ma_ca" = 'CA02')
END,
"ngay_cap_nhat" = CURRENT_TIMESTAMP
FROM "ca_lam_viec" clv
WHERE clv."id" = pc."ca_lam_viec_id";

DELETE FROM "ca_lam_viec"
WHERE "ma_ca" NOT IN ('CA01', 'CA02');

-- Đánh dấu đã bootstrap 2 ca mặc định để seed về sau không tạo lại ca mà Admin đã xóa/chỉnh.
INSERT INTO "phien_ban_seed" ("phien_ban", "mo_ta")
VALUES ('SEED_V299_HAI_CA_MAC_DINH', 'Khởi tạo đúng 2 ca mặc định 06:00-14:00 và 14:00-22:00; từ đây Admin tự quản lý chỉnh sửa/xóa.')
ON CONFLICT ("phien_ban") DO NOTHING;
