-- v3.3.0: toi uu truy van audit/dashboard va lich su van hanh khi du lieu tang lon.
CREATE INDEX IF NOT EXISTS "nhat_ky_bao_mat_nguoi_dung_id_ngay_tao_idx"
  ON "nhat_ky_bao_mat"("nguoi_dung_id", "ngay_tao" DESC);

CREATE INDEX IF NOT EXISTS "nhat_ky_bao_mat_loai_su_kien_ngay_tao_idx"
  ON "nhat_ky_bao_mat"("loai_su_kien", "ngay_tao" DESC);

CREATE INDEX IF NOT EXISTS "don_hang_trang_thai_ngay_tao_idx"
  ON "don_hang"("trang_thai", "ngay_tao" DESC);

CREATE INDEX IF NOT EXISTS "don_hang_ngay_tao_idx"
  ON "don_hang"("ngay_tao" DESC);

CREATE INDEX IF NOT EXISTS "lich_su_van_hanh_ngay_tao_idx"
  ON "lich_su_van_hanh"("ngay_tao" DESC);
