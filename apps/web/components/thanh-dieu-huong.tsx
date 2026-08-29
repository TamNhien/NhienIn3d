"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { layGioHangDaLuu, SU_KIEN_GIO_HANG } from "../lib/gio-hang";
import { layDanhSachYeuThich, SU_KIEN_YEU_THICH } from "../lib/yeu-thich";

export function ThanhDieuHuong() {
  const [so_luong, setSoLuong] = useState(0);
  const [so_yeu_thich, setSoYeuThich] = useState(0);

  const taiSoLuong = useCallback(() => {
    layGioHangDaLuu().then(gio => setSoLuong(gio?.tong_so_luong ?? 0)).catch(() => setSoLuong(0));
  }, []);
  const taiYeuThich = useCallback(() => {
    layDanhSachYeuThich().then(ds => setSoYeuThich(ds.length)).catch(() => setSoYeuThich(0));
  }, []);

  useEffect(() => {
    taiSoLuong(); taiYeuThich();
    window.addEventListener(SU_KIEN_GIO_HANG, taiSoLuong);
    window.addEventListener(SU_KIEN_YEU_THICH, taiYeuThich);
    window.addEventListener("storage", taiSoLuong);
    return () => {
      window.removeEventListener(SU_KIEN_GIO_HANG, taiSoLuong);
      window.removeEventListener(SU_KIEN_YEU_THICH, taiYeuThich);
      window.removeEventListener("storage", taiSoLuong);
    };
  }, [taiSoLuong, taiYeuThich]);

  return <nav className="nav">
    <Link className="brand" href="/">Nhien<span>In3d</span></Link>
    <div className="navlinks">
      <Link href="/san-pham">Sản phẩm</Link>
      <Link href="/yeu-thich">Yêu thích {so_yeu_thich > 0 && <b>{so_yeu_thich}</b>}</Link>
      <Link href="/gio-hang">Giỏ hàng</Link>
    </div>
    <Link className="cart-button" href="/gio-hang">Giỏ hàng <b>{so_luong}</b></Link>
  </nav>;
}
