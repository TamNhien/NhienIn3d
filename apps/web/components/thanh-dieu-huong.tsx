"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { layGioHangDaLuu, SU_KIEN_GIO_HANG } from "../lib/gio-hang";

export function ThanhDieuHuong() {
  const [so_luong, setSoLuong] = useState(0);

  const taiSoLuong = useCallback(() => {
    layGioHangDaLuu().then(gio => setSoLuong(gio?.tong_so_luong ?? 0)).catch(() => setSoLuong(0));
  }, []);

  useEffect(() => {
    taiSoLuong();
    window.addEventListener(SU_KIEN_GIO_HANG, taiSoLuong);
    window.addEventListener("storage", taiSoLuong);
    return () => {
      window.removeEventListener(SU_KIEN_GIO_HANG, taiSoLuong);
      window.removeEventListener("storage", taiSoLuong);
    };
  }, [taiSoLuong]);

  return <nav className="nav">
    <Link className="brand" href="/">Nhien<span>In3d</span></Link>
    <div className="navlinks">
      <Link href="/#san-pham">Sản phẩm</Link>
      <Link href="/gio-hang">Giỏ hàng</Link>
      <Link href="/#cong-nghe">Công nghệ</Link>
      <Link href="/#lich-su">Phiên bản</Link>
    </div>
    <Link className="cart-button" href="/gio-hang">Giỏ hàng <b>{so_luong}</b></Link>
  </nav>;
}
