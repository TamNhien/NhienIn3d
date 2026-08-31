"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { TruongMatKhau } from "../../components/truong-mat-khau";
import { dangNhap, xacNhanDangNhapMfa } from "../../lib/xac-thuc";

const KHOA_GHI_NHO_EMAIL = "nhienin3d_ghi_nho_email";

function DangNhapNoiDung() {
  const router = useRouter();
  const search = useSearchParams();
  const [thu_dien_tu, setEmail] = useState("");
  const [mat_khau, setMatKhau] = useState("");
  const [ghi_nho, setGhiNho] = useState(false);
  const [loi, setLoi] = useState("");
  const [dang_gui, setDangGui] = useState(false);
  const [thu_thach_mfa, setThuThachMfa] = useState("");
  const [ma_otp, setMaOtp] = useState("");

  useEffect(() => {
    const da_luu = localStorage.getItem(KHOA_GHI_NHO_EMAIL);
    if (da_luu) { setEmail(da_luu); setGhiNho(true); }
  }, []);

  function hoanTatDangNhap() {
    if (ghi_nho) localStorage.setItem(KHOA_GHI_NHO_EMAIL, thu_dien_tu.trim().toLowerCase());
    else localStorage.removeItem(KHOA_GHI_NHO_EMAIL);
    router.push(search.get("chuyen_den") || "/tai-khoan");
    router.refresh();
  }

  async function gui(e: FormEvent) {
    e.preventDefault(); setLoi(""); setDangGui(true);
    try {
      const kq = await dangNhap({ thu_dien_tu, mat_khau });
      if (kq.can_mfa) {
        setThuThachMfa(kq.thu_thach);
        setMatKhau("");
        setMaOtp("");
        return;
      }
      hoanTatDangNhap();
    } catch (err) { setLoi(err instanceof Error ? err.message : "Đăng nhập không thành công"); }
    finally { setDangGui(false); }
  }

  async function guiMfa(e: FormEvent) {
    e.preventDefault(); setLoi(""); setDangGui(true);
    try {
      await xacNhanDangNhapMfa(thu_thach_mfa, ma_otp.trim());
      hoanTatDangNhap();
    } catch (err) { setLoi(err instanceof Error ? err.message : "Không thể xác minh MFA"); }
    finally { setDangGui(false); }
  }

  return <main className="auth-shell cine-auth-shell">
    <section className="cine-auth-card cine-auth-card-login">
      <h1>{thu_thach_mfa ? "Xác minh Admin" : "Đăng nhập"}</h1>
      {search.get("dat_lai") === "thanh_cong" && !thu_thach_mfa && <div className="auth-success">Mật khẩu đã được đặt lại. Bạn có thể đăng nhập bằng mật khẩu mới.</div>}
      {search.get("da_dang_xuat") === "1" && !thu_thach_mfa && <div className="auth-success">Bạn đã đăng xuất thành công.</div>}
      {search.get("doi_mat_khau") === "thanh_cong" && !thu_thach_mfa && <div className="auth-success">Mật khẩu đã được đổi. Vui lòng đăng nhập lại.</div>}

      {!thu_thach_mfa ? <form onSubmit={gui} className="cine-auth-form">
        <input aria-label="Email" type="email" autoComplete="email" value={thu_dien_tu} onChange={e => setEmail(e.target.value)} placeholder="Email" required/>
        <TruongMatKhau nhan="Mật khẩu" gia_tri={mat_khau} datGiaTri={setMatKhau} autoComplete="current-password" toi_thieu={8}/>
        <div className="cine-auth-options"><label><input type="checkbox" checked={ghi_nho} onChange={e => setGhiNho(e.target.checked)}/><span>Ghi nhớ tài khoản</span></label><Link href="/quen-mat-khau">Quên mật khẩu?</Link></div>
        {loi && <div className="auth-error">{loi}</div>}
        <button className="cine-btn cine-btn-primary cine-auth-submit" disabled={dang_gui}>{dang_gui ? "Đang đăng nhập..." : "Đăng nhập"}</button>
      </form> : <form onSubmit={guiMfa} className="cine-auth-form">
        <p className="cine-muted">Tài khoản Admin đã bật MFA. Mở ứng dụng Authenticator và nhập mã 6 số hiện tại.</p>
        <input aria-label="Mã xác minh 6 số" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={ma_otp} onChange={e => setMaOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" required autoFocus/>
        {loi && <div className="auth-error">{loi}</div>}
        <button className="cine-btn cine-btn-primary cine-auth-submit" disabled={dang_gui || ma_otp.length !== 6}>{dang_gui ? "Đang xác minh..." : "Xác minh & đăng nhập"}</button>
        <button type="button" className="cine-btn cine-btn-secondary cine-auth-submit" onClick={() => { setThuThachMfa(""); setMaOtp(""); setLoi(""); }} disabled={dang_gui}>Quay lại đăng nhập</button>
      </form>}
      {!thu_thach_mfa && <p className="cine-auth-footer">Chưa có tài khoản? <Link href="/dang-ky">Đăng ký</Link></p>}
    </section>
  </main>;
}

export default function DangNhapPage() {
  return <Suspense fallback={<main className="auth-shell cine-auth-shell"><section className="cine-auth-card">Đang tải...</section></main>}><DangNhapNoiDung/></Suspense>;
}
