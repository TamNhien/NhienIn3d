"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { ThanhDieuHuong } from "../../components/thanh-dieu-huong";
import { dangNhap } from "../../lib/xac-thuc";

function DangNhapNoiDung() {
  const router = useRouter();
  const search = useSearchParams();
  const [thu_dien_tu, setEmail] = useState("");
  const [mat_khau, setMatKhau] = useState("");
  const [loi, setLoi] = useState("");
  const [dang_gui, setDangGui] = useState(false);

  async function gui(e: FormEvent) {
    e.preventDefault(); setLoi(""); setDangGui(true);
    try {
      await dangNhap({ thu_dien_tu, mat_khau });
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
        <p>Phiên đăng nhập được lưu bằng cookie HttpOnly. Mật khẩu không được lưu ở trình duyệt.</p>
        <form onSubmit={gui} className="auth-form">
          <label><span>Email</span><input type="email" autoComplete="email" value={thu_dien_tu} onChange={e=>setEmail(e.target.value)} required /></label>
          <label><span>Mật khẩu</span><input type="password" autoComplete="current-password" value={mat_khau} onChange={e=>setMatKhau(e.target.value)} minLength={8} required /></label>
          {loi && <div className="auth-error">{loi}</div>}
          <button className="checkout-button" disabled={dang_gui}>{dang_gui ? "Đang đăng nhập..." : "Đăng nhập"}</button>
        </form>
        <div className="auth-links"><span>Chưa có tài khoản?</span><Link href="/dang-ky">Tạo tài khoản</Link><span className="auth-roadmap">Quên mật khẩu: v2.7.0</span></div>
      </section>
    </main>
  </>;
}

export default function DangNhapPage() { return <Suspense><DangNhapNoiDung /></Suspense>; }
