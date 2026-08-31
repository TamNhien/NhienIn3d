"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { layGioHangDaLuu, SU_KIEN_GIO_HANG } from "../lib/gio-hang";
import { layDanhSachYeuThich, SU_KIEN_YEU_THICH } from "../lib/yeu-thich";
import { dangXuat, layTaiKhoan, SU_KIEN_XAC_THUC, TaiKhoan, tenVaiTro } from "../lib/xac-thuc";

export function ThanhDieuHuong() {
  const [so_luong, setSoLuong] = useState(0);
  const [so_yeu_thich, setSoYeuThich] = useState(0);
  const [tai_khoan, setTaiKhoan] = useState<TaiKhoan | null>(null);
  const [dang_xuat, setDangXuat] = useState(false);
  const [mo_menu, setMoMenu] = useState(false);
  const [mo_tai_khoan, setMoTaiKhoan] = useState(false);
  const [da_mount, setDaMount] = useState(false);
  const pathname = usePathname();

  const taiSoLuong = useCallback(() => {
    layGioHangDaLuu().then(gio => setSoLuong(gio?.tong_so_luong ?? 0)).catch(() => setSoLuong(0));
  }, []);
  const taiYeuThich = useCallback(() => {
    layDanhSachYeuThich().then(ds => setSoYeuThich(ds.length)).catch(() => setSoYeuThich(0));
  }, []);
  const taiTaiKhoan = useCallback(() => {
    layTaiKhoan().then(setTaiKhoan).catch(() => undefined);
  }, []);

  useEffect(() => setDaMount(true), []);
  useEffect(() => {
    taiSoLuong();
    taiYeuThich();
    taiTaiKhoan();
    window.addEventListener(SU_KIEN_GIO_HANG, taiSoLuong);
    window.addEventListener(SU_KIEN_YEU_THICH, taiYeuThich);
    const xuLyXacThuc = (event: Event) => {
      const da_dang_xuat = event instanceof CustomEvent && event.detail?.da_dang_xuat;
      if (da_dang_xuat) setTaiKhoan(null); else taiTaiKhoan();
    };
    window.addEventListener(SU_KIEN_XAC_THUC, xuLyXacThuc);
    window.addEventListener("storage", taiSoLuong);
    return () => {
      window.removeEventListener(SU_KIEN_GIO_HANG, taiSoLuong);
      window.removeEventListener(SU_KIEN_YEU_THICH, taiYeuThich);
      window.removeEventListener(SU_KIEN_XAC_THUC, xuLyXacThuc);
      window.removeEventListener("storage", taiSoLuong);
    };
  }, [taiSoLuong, taiYeuThich, taiTaiKhoan]);

  useEffect(() => {
    setMoMenu(false);
    setMoTaiKhoan(false);
  }, [pathname]);

  useEffect(() => {
    if (!mo_menu) return;
    const cu = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const phim = (event: KeyboardEvent) => { if (event.key === "Escape") setMoMenu(false); };
    window.addEventListener("keydown", phim);
    return () => {
      document.body.style.overflow = cu;
      window.removeEventListener("keydown", phim);
    };
  }, [mo_menu]);

  useEffect(() => {
    if (!mo_tai_khoan) return;
    const bam = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-account-menu='true']")) setMoTaiKhoan(false);
    };
    const phim = (event: KeyboardEvent) => { if (event.key === "Escape") setMoTaiKhoan(false); };
    document.addEventListener("pointerdown", bam);
    window.addEventListener("keydown", phim);
    return () => {
      document.removeEventListener("pointerdown", bam);
      window.removeEventListener("keydown", phim);
    };
  }, [mo_tai_khoan]);

  async function thoat() {
    if (dang_xuat) return;
    setDangXuat(true);
    try { await dangXuat(); }
    finally {
      setTaiKhoan(null);
      setDangXuat(false);
      setMoMenu(false);
      setMoTaiKhoan(false);
      window.location.replace("/dang-nhap?da_dang_xuat=1");
    }
  }

  const la_quan_tri = tai_khoan?.vai_tro === "ADMIN";
  const active = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  const drawer = da_mount && mo_menu ? createPortal(
    <div className="menu-drawer-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setMoMenu(false); }}>
      <aside id="nhienin3d-navigation-drawer" className="menu-drawer" role="dialog" aria-modal="true" aria-label="Menu điều hướng">
        <div className="menu-drawer-head">
          <div><p className="menu-drawer-kicker"><img src="/brand/nhienin3d-logo.svg" alt="" aria-hidden="true" />NhienIn3d</p><h2>Menu</h2></div>
          <button className="menu-drawer-close" type="button" onClick={() => setMoMenu(false)} aria-label="Đóng menu">✕</button>
        </div>
        {tai_khoan && <div className="menu-drawer-user">
          <div><strong>{tai_khoan.ho_ten}</strong><span>{tai_khoan.thu_dien_tu}</span></div>
          <b className="menu-drawer-badge">{tenVaiTro(tai_khoan.vai_tro)}</b>
        </div>}
        <nav className="menu-drawer-nav">
          <p className="menu-drawer-section">Mua sắm</p>
          <Link href="/" onClick={() => setMoMenu(false)}>⌂ Trang chủ</Link>
          <Link href="/san-pham" onClick={() => setMoMenu(false)}>◈ Sản phẩm</Link>
          <Link href="/yeu-thich" onClick={() => setMoMenu(false)}>♡ Yêu thích {so_yeu_thich > 0 ? `(${so_yeu_thich})` : ""}</Link>
          <Link href="/gio-hang" onClick={() => setMoMenu(false)}>🛒 Giỏ hàng {so_luong > 0 ? `(${so_luong})` : ""}</Link>
          <p className="menu-drawer-section">Tài khoản</p>
          {!tai_khoan && <><Link href="/dang-nhap" onClick={() => setMoMenu(false)}>Đăng nhập</Link><Link href="/dang-ky" onClick={() => setMoMenu(false)}>Đăng kí</Link></>}
          {tai_khoan && <>
            <Link href="/tai-khoan" onClick={() => setMoMenu(false)}>Thông tin tài khoản</Link>
            {la_quan_tri && <Link href="/quan-tri" onClick={() => setMoMenu(false)}>Quản trị hệ thống</Link>}
            <button type="button" className="menu-drawer-logout" onClick={thoat} disabled={dang_xuat}>{dang_xuat ? "Đang đăng xuất…" : "Đăng xuất"}</button>
          </>}
        </nav>
      </aside>
    </div>, document.body
  ) : null;

  return <>
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-brand" aria-label="NhienIn3d - Trang chủ"><img className="site-brand-logo" src="/brand/nhienin3d-logo.svg" alt="" aria-hidden="true" /><span className="site-brand-word">Nhien<span>In3d</span></span></Link>
        <nav className="desktop-primary-nav" aria-label="Điều hướng chính">
          <Link className={active("/san-pham") ? "nav-link active" : "nav-link"} href="/san-pham">Sản phẩm</Link>
          <Link className={active("/yeu-thich") ? "nav-link active" : "nav-link"} href="/yeu-thich">Yêu thích {so_yeu_thich > 0 && <b>{so_yeu_thich}</b>}</Link>
          <Link className={active("/gio-hang") ? "nav-link active" : "nav-link"} href="/gio-hang">Giỏ hàng</Link>
          {la_quan_tri && <Link className={active("/quan-tri") ? "nav-link active" : "nav-link"} href="/quan-tri">Quản trị</Link>}
        </nav>
        <div className="header-actions">
          <Link className="cart-button" href="/gio-hang" aria-label={`Giỏ hàng có ${so_luong} sản phẩm`}>🛒 <span>Giỏ hàng</span><b>{so_luong}</b></Link>
          {!tai_khoan && <Link className="header-login" href="/dang-nhap">Đăng nhập</Link>}
          {tai_khoan && <div className="account-menu" data-account-menu="true">
            <button className="account-menu-trigger" type="button" onClick={() => setMoTaiKhoan(x => !x)} aria-expanded={mo_tai_khoan}>
              <span>Tài khoản</span><b>{tai_khoan.ho_ten.split(" ").at(-1)}</b><i>⌄</i>
            </button>
            {mo_tai_khoan && <div className="account-popover">
              <strong>{tai_khoan.ho_ten}</strong>
              <small>{tai_khoan.thu_dien_tu}</small>
              <em>{tenVaiTro(tai_khoan.vai_tro)}</em>
              <div className="account-popover-links">
                <Link href="/tai-khoan">Thông tin tài khoản</Link>
                {la_quan_tri && <Link href="/quan-tri">Quản trị hệ thống</Link>}
                <button type="button" onClick={thoat} disabled={dang_xuat}>{dang_xuat ? "Đang đăng xuất…" : "Đăng xuất"}</button>
              </div>
            </div>}
          </div>}
          <button type="button" className={mo_menu ? "menu-trigger is-open" : "menu-trigger"} onClick={() => setMoMenu(x => !x)} aria-label={mo_menu ? "Đóng menu" : "Mở menu"} aria-expanded={mo_menu} aria-controls="nhienin3d-navigation-drawer">{mo_menu ? "✕" : "☰"}</button>
        </div>
      </div>
    </header>
    {drawer}
  </>;
}
