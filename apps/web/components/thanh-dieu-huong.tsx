"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { layGioHangDaLuu, SU_KIEN_GIO_HANG } from "../lib/gio-hang";
import { layDanhSachYeuThich, SU_KIEN_YEU_THICH } from "../lib/yeu-thich";
import { dangXuat, layTaiKhoan, SU_KIEN_XAC_THUC, TaiKhoan, tenVaiTro } from "../lib/xac-thuc";

export function ThanhDieuHuong() {
  const [so_luong, setSoLuong] = useState(0);
  const [so_yeu_thich, setSoYeuThich] = useState(0);
  const [tai_khoan, setTaiKhoan] = useState<TaiKhoan | null>(null);
  const [dang_xuat, setDangXuat] = useState(false);

  const taiSoLuong = useCallback(() => { layGioHangDaLuu().then(gio => setSoLuong(gio?.tong_so_luong ?? 0)).catch(() => setSoLuong(0)); }, []);
  const taiYeuThich = useCallback(() => { layDanhSachYeuThich().then(ds => setSoYeuThich(ds.length)).catch(() => setSoYeuThich(0)); }, []);
  const taiTaiKhoan = useCallback(() => { layTaiKhoan().then(setTaiKhoan).catch(() => setTaiKhoan(null)); }, []);

  useEffect(() => {
    taiSoLuong(); taiYeuThich(); taiTaiKhoan();
    window.addEventListener(SU_KIEN_GIO_HANG, taiSoLuong);
    window.addEventListener(SU_KIEN_YEU_THICH, taiYeuThich);
    window.addEventListener(SU_KIEN_XAC_THUC, taiTaiKhoan);
    window.addEventListener("storage", taiSoLuong);
    return () => {
      window.removeEventListener(SU_KIEN_GIO_HANG, taiSoLuong);
      window.removeEventListener(SU_KIEN_YEU_THICH, taiYeuThich);
      window.removeEventListener(SU_KIEN_XAC_THUC, taiTaiKhoan);
      window.removeEventListener("storage", taiSoLuong);
    };
  }, [taiSoLuong, taiYeuThich, taiTaiKhoan]);

  async function thoat() {
    if (dang_xuat) return;
    setDangXuat(true);
    try { await dangXuat(); } finally {
      setTaiKhoan(null);
      setDangXuat(false);
      window.location.assign("/");
    }
  }

  const la_quan_tri = tai_khoan?.vai_tro === "QUAN_TRI" || tai_khoan?.vai_tro === "SIEU_QUAN_TRI";

  return <nav className="nav">
    <Link className="brand" href="/">Nhien<span>In3d</span></Link>
    <div className="navlinks">
      <Link href="/san-pham">Sản phẩm</Link>
      <Link href="/yeu-thich">Yêu thích {so_yeu_thich > 0 && <b>{so_yeu_thich}</b>}</Link>
      <Link href="/gio-hang">Giỏ hàng</Link>
      {!tai_khoan && <Link href="/dang-nhap">Đăng nhập</Link>}
      {tai_khoan && <details className="account-menu">
        <summary>Tài khoản <span>{tai_khoan.ho_ten.split(" ").at(-1)}</span></summary>
        <div className="account-popover">
          <strong>{tai_khoan.ho_ten}</strong>
          <small>{tai_khoan.thu_dien_tu}</small>
          <em>{tenVaiTro(tai_khoan.vai_tro)}</em>
          <div className="account-popover-links">
            <Link href="/tai-khoan">Thông tin tài khoản</Link>
            {la_quan_tri && <Link href="/quan-tri">Quản trị hệ thống</Link>}
            <button type="button" onClick={thoat} disabled={dang_xuat}>{dang_xuat ? "Đang đăng xuất…" : "Đăng xuất"}</button>
          </div>
        </div>
      </details>}
    </div>
    <Link className="cart-button" href="/gio-hang">Giỏ hàng <b>{so_luong}</b></Link>
  </nav>;
}
