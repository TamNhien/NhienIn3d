"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
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
    if (da_luu) { setEmail(da_luu); setGhiNho(true); }
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

  return <main className="auth-shell cine-auth-shell">
    <section className="cine-auth-card cine-auth-card-login">
      <h1>Đăng nhập</h1>
      {search.get("dat_lai") === "thanh_cong" && <div className="auth-success">Mật khẩu đã được đặt lại. Bạn có thể đăng nhập bằng mật khẩu mới.</div>}
      {search.get("da_dang_xuat") === "1" && <div className="auth-success">Bạn đã đăng xuất thành công.</div>}
      {search.get("doi_mat_khau") === "thanh_cong" && <div className="auth-success">Mật khẩu đã được đổi. Vui lòng đăng nhập lại.</div>}
      <form onSubmit={gui} className="cine-auth-form">
        <input aria-label="Email" type="email" autoComplete="email" value={thu_dien_tu} onChange={e => setEmail(e.target.value)} placeholder="Email" required/>
        <TruongMatKhau nhan="Mật khẩu" gia_tri={mat_khau} datGiaTri={setMatKhau} autoComplete="current-password" toi_thieu={8}/>
        <div className="cine-auth-options"><label><input type="checkbox" checked={ghi_nho} onChange={e => setGhiNho(e.target.checked)}/><span>Ghi nhớ tài khoản</span></label><Link href="/quen-mat-khau">Quên mật khẩu?</Link></div>
        {loi && <div className="auth-error">{loi}</div>}
        <button className="cine-btn cine-btn-primary cine-auth-submit" disabled={dang_gui}>{dang_gui ? "Đang đăng nhập..." : "Đăng nhập"}</button>
      </form>
      <p className="cine-auth-footer">Chưa có tài khoản? <Link href="/dang-ky">Đăng ký</Link></p>
    </section>
  </main>;
}

export default function DangNhapPage() {
  return <Suspense fallback={<main className="auth-shell cine-auth-shell"><section className="cine-auth-card">Đang tải...</section></main>}><DangNhapNoiDung/></Suspense>;
}
