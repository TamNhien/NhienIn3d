"use client";

import { useId, useMemo, useState } from "react";

export type DanhGiaMatKhau = {
  du_12_ky_tu: boolean;
  co_chu_hoa: boolean;
  co_chu_thuong: boolean;
  co_chu_so: boolean;
  co_ky_tu_dac_biet: boolean;
  diem: number;
  hop_le: boolean;
  nhan: "Rất yếu" | "Yếu" | "Trung bình" | "Khá" | "Mạnh";
};

export function danhGiaMatKhau(mat_khau: string): DanhGiaMatKhau {
  const ket_qua = {
    du_12_ky_tu: mat_khau.length >= 12,
    co_chu_hoa: /[A-Z]/.test(mat_khau),
    co_chu_thuong: /[a-z]/.test(mat_khau),
    co_chu_so: /[0-9]/.test(mat_khau),
    co_ky_tu_dac_biet: /[^A-Za-z0-9]/.test(mat_khau)
  };
  const diem = Object.values(ket_qua).filter(Boolean).length;
  const nhan: DanhGiaMatKhau["nhan"] = diem <= 1 ? "Rất yếu" : diem === 2 ? "Yếu" : diem === 3 ? "Trung bình" : diem === 4 ? "Khá" : "Mạnh";
  return { ...ket_qua, diem, hop_le: diem === 5, nhan };
}

type Props = {
  nhan: string;
  gia_tri: string;
  datGiaTri: (gia_tri: string) => void;
  autoComplete?: string;
  bat_buoc?: boolean;
  toi_thieu?: number;
  hien_do_manh?: boolean;
  placeholder?: string;
};

export function TruongMatKhau({
  nhan,
  gia_tri,
  datGiaTri,
  autoComplete = "new-password",
  bat_buoc = true,
  toi_thieu = 12,
  hien_do_manh = false,
  placeholder
}: Props) {
  const id = useId();
  const [hien, setHien] = useState(false);
  const danh_gia = useMemo(() => danhGiaMatKhau(gia_tri), [gia_tri]);

  return <div className="password-field">
    <label htmlFor={id}><span>{nhan}</span></label>
    <div className="password-input-wrap">
      <input
        id={id}
        type={hien ? "text" : "password"}
        value={gia_tri}
        onChange={e => datGiaTri(e.target.value)}
        autoComplete={autoComplete}
        minLength={toi_thieu}
        required={bat_buoc}
        placeholder={placeholder}
      />
      <button type="button" className="password-toggle" onClick={() => setHien(x => !x)} aria-label={hien ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
        {hien ? "Ẩn" : "Hiện"}
      </button>
    </div>
    {hien_do_manh && <div className="password-strength" aria-live="polite">
      <div className="password-strength-head"><span>Độ mạnh</span><strong>{gia_tri ? danh_gia.nhan : "Chưa nhập"}</strong></div>
      <div className="password-strength-track"><i style={{ width: `${danh_gia.diem * 20}%` }} /></div>
      <div className="password-rules">
        <span className={danh_gia.du_12_ky_tu ? "dat" : ""}>✓ Tối thiểu 12 ký tự</span>
        <span className={danh_gia.co_chu_hoa ? "dat" : ""}>✓ Có chữ hoa A–Z</span>
        <span className={danh_gia.co_chu_thuong ? "dat" : ""}>✓ Có chữ thường a–z</span>
        <span className={danh_gia.co_chu_so ? "dat" : ""}>✓ Có chữ số 0–9</span>
        <span className={danh_gia.co_ky_tu_dac_biet ? "dat" : ""}>✓ Có ký tự đặc biệt</span>
      </div>
    </div>}
  </div>;
}
