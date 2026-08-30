"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { quenMatKhau } from "../../lib/xac-thuc";

export default function QuenMatKhauPage() {
  const [thu_dien_tu, setEmail] = useState("");
  const [thong_bao, setThongBao] = useState("");
  const [loi, setLoi] = useState("");
  const [dang_gui, setDangGui] = useState(false);

  async function gui(e: FormEvent) {
    e.preventDefault(); setLoi(""); setThongBao(""); setDangGui(true);
    try {
      const ket_qua = await quenMatKhau(thu_dien_tu.trim().toLowerCase());
      setThongBao(ket_qua.thong_bao);
    } catch (err) { setLoi(err instanceof Error ? err.message : "Không thể gửi yêu cầu đặt lại mật khẩu"); }
    finally { setDangGui(false); }
  }

  return <main className="auth-shell cine-auth-shell">
    <section className="cine-auth-card cine-auth-card-reset">
      <h1>Quên mật khẩu</h1>
      <p>Nhập email đã dùng để đăng ký. Nếu tài khoản đang hoạt động, liên kết đặt lại mật khẩu sẽ được gửi vào email đó.</p>
      <form onSubmit={gui} className="cine-auth-form">
        <input aria-label="Email đăng ký" type="email" autoComplete="email" value={thu_dien_tu} onChange={e => setEmail(e.target.value)} placeholder="Email đăng ký" required/>
        {loi && <div className="auth-error">{loi}</div>}
        {thong_bao && <div className="auth-success">{thong_bao}<br/>Hãy kiểm tra Inbox và cả thư mục Spam/Junk.</div>}
        <button className="cine-btn cine-btn-primary cine-auth-submit" disabled={dang_gui}>{dang_gui ? "Đang gửi email..." : "Gửi liên kết đặt lại"}</button>
      </form>
      <p className="cine-auth-footer"><Link href="/dang-nhap">Quay lại đăng nhập</Link></p>
    </section>
  </main>;
}
