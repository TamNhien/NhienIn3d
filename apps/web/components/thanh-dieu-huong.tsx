"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { layGioHangDaLuu, SU_KIEN_GIO_HANG } from "../lib/gio-hang";
import { layDanhSachYeuThich, SU_KIEN_YEU_THICH } from "../lib/yeu-thich";
import { layTaiKhoan, SU_KIEN_XAC_THUC, TaiKhoan } from "../lib/xac-thuc";

export function ThanhDieuHuong() {
  const [so_luong, setSoLuong] = useState(0);
  const [so_yeu_thich, setSoYeuThich] = useState(0);
  const [tai_khoan, setTaiKhoan] = useState<TaiKhoan | null>(null);

  const taiSoLuong = useCallback(() => {
    layGioHangDaLuu().then(gio => setSoLuong(gio?.tong_so_luong ?? 0)).catch(() => setSoLuong(0));
  }, []);
  const taiYeuThich = useCallback(() => {
    layDanhSachYeuThich().then(ds => setSoYeuThich(ds.length)).catch(() => setSoYeuThich(0));
  }, []);
  const taiTaiKhoan = useCallback(() => {
    layTaiKhoan().then(setTaiKhoan).catch(() => setTaiKhoan(null));
  }, []);

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

  return <nav className="nav">
    <Link className="brand" href="/">Nhien<span>In3d</span></Link>
    <div className="navlinks">
      <Link href="/san-pham">Sản phẩm</Link>
      <Link href="/yeu-thich">Yêu thích {so_yeu_thich > 0 && <b>{so_yeu_thich}</b>}</Link>
      <Link href="/gio-hang">Giỏ hàng</Link>
      <Link href={tai_khoan ? "/tai-khoan" : "/dang-nhap"}>{tai_khoan ? "Tài khoản" : "Đăng nhập"}</Link>
    </div>
    <Link className="cart-button" href="/gio-hang">Giỏ hàng <b>{so_luong}</b></Link>
  </nav>;
}
