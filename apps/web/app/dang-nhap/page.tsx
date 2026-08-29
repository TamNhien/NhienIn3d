"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { ThanhDieuHuong } from "../../components/thanh-dieu-huong";
import { TruongMatKhau } from "../../components/truong-mat-khau";
import { dangNhap } from "../../lib/xac-thuc";

const KHOA_GHI_NHO_EMAIL = "nhienin3d_ghi_nho_email";

function DangNhapNoiDung() {
  const router = useRouter();
  const search = useSearchParams();
  const [thu_dien_tu, setEmail] = useState("");
  const [mat_khau, setMatKhau] = useState("");
  const [ghi_nho, setGhiNho] = useState(false);
  const [loi, setLoi] = useState("");
  const [dang_gui, setDangGui] = useState(false);

  useEffect(() => {
    const da_luu = localStorage.getItem(KHOA_GHI_NHO_EMAIL);
    if (da_luu) {
      setEmail(da_luu);
      setGhiNho(true);
    }
  }, []);

  async function gui(e: FormEvent) {
    e.preventDefault(); setLoi(""); setDangGui(true);
    try {
      await dangNhap({ thu_dien_tu, mat_khau });
      if (ghi_nho) localStorage.setItem(KHOA_GHI_NHO_EMAIL, thu_dien_tu.trim().toLowerCase());
      else localStorage.removeItem(KHOA_GHI_NHO_EMAIL);
      router.push(search.get("chuyen_den") || "/tai-khoan");
      router.refresh();
    } catch (err) { setLoi(err instanceof Error ? err.message : "Đăng nhập không thành công"); }
    finally { setDangGui(false); }
  }

  return <>
    <ThanhDieuHuong />
    <main className="auth-shell">
      <section className="auth-card">
        <div className="eyebrow">TÀI KHOẢN NHIENIN3D</div>
        <h1>Đăng nhập</h1>
        {search.get("dat_lai") === "thanh_cong" && <div className="auth-success">Mật khẩu đã được đặt lại. Bạn có thể đăng nhập bằng mật khẩu mới.</div>}
        <form onSubmit={gui} className="auth-form">
          <label><span>Email</span><input type="email" autoComplete="email" value={thu_dien_tu} onChange={e=>setEmail(e.target.value)} required /></label>
          <TruongMatKhau nhan="Mật khẩu" gia_tri={mat_khau} datGiaTri={setMatKhau} autoComplete="current-password" toi_thieu={8} />
          <div className="auth-options-row"><label className="remember-account"><input type="checkbox" checked={ghi_nho} onChange={e => setGhiNho(e.target.checked)} /><span>Ghi nhớ tài khoản</span></label><Link className="forgot-inline" href="/quen-mat-khau">Quên mật khẩu?</Link></div>
          {loi && <div className="auth-error">{loi}</div>}
          <button className="checkout-button auth-login-button" disabled={dang_gui}>{dang_gui ? "Đang đăng nhập..." : "Đăng nhập"}</button>
        </form>
        <div className="auth-links"><span>Chưa có tài khoản?</span><Link href="/dang-ky">Đăng kí</Link></div>
      </section>
    </main>
  </>;
}

export default function DangNhapPage() { return <Suspense><DangNhapNoiDung /></Suspense>; }
