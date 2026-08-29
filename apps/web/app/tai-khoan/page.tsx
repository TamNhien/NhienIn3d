"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThanhDieuHuong } from "../../components/thanh-dieu-huong";
import { dangXuat, layTaiKhoan, TaiKhoan, tenVaiTro } from "../../lib/xac-thuc";

export default function TaiKhoanPage() {
  const router = useRouter();
  const [tai_khoan, setTaiKhoan] = useState<TaiKhoan | null | undefined>(undefined);

  useEffect(() => { layTaiKhoan().then(setTaiKhoan).catch(()=>setTaiKhoan(null)); }, []);

  if (tai_khoan === undefined) return <><ThanhDieuHuong /><main className="auth-shell"><div className="auth-card"><p>Đang kiểm tra phiên đăng nhập...</p></div></main></>;
  if (!tai_khoan) return <><ThanhDieuHuong /><main className="auth-shell"><section className="auth-card"><h1>Bạn chưa đăng nhập</h1><p>Đăng nhập để sử dụng khu vực tài khoản.</p><Link className="primary auth-primary-link" href="/dang-nhap?chuyen_den=/tai-khoan">Đăng nhập</Link></section></main></>;

  async function thoat() { await dangXuat(); router.push("/"); router.refresh(); }

  return <>
    <ThanhDieuHuong />
    <main className="account-shell page-shell">
      <div className="eyebrow">TÀI KHOẢN</div><h1>Xin chào, {tai_khoan.ho_ten}</h1>
      <section className="account-grid">
        <article className="account-card"><span>Email</span><strong>{tai_khoan.thu_dien_tu}</strong></article>
        <article className="account-card"><span>Vai trò</span><strong>{tenVaiTro(tai_khoan.vai_tro)}</strong></article>
        <article className="account-card"><span>Trạng thái</span><strong className="stock-ok">Đang hoạt động</strong></article>
      </section>
      <section className="account-actions">
        <Link className="secondary" href="/gio-hang">Giỏ hàng</Link>
        <Link className="secondary" href="/yeu-thich">Yêu thích</Link>
        <button className="secondary secondary-button" onClick={thoat}>Đăng xuất</button>
      </section>
      <p className="account-note">Hồ sơ, địa chỉ, lịch sử đơn hàng và quản lý phiên sẽ được bổ sung ở v2.8.0.</p>
    </main>
  </>;
}
