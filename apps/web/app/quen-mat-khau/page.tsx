"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ThanhDieuHuong } from "../../components/thanh-dieu-huong";
import { quenMatKhau } from "../../lib/xac-thuc";

export default function QuenMatKhauPage() {
  const [thu_dien_tu, setEmail] = useState("");
  const [thong_bao, setThongBao] = useState("");
  const [loi, setLoi] = useState("");
  const [dang_gui, setDangGui] = useState(false);

  async function gui(e: FormEvent) {
    e.preventDefault();
    setLoi("");
    setThongBao("");
    setDangGui(true);
    try {
      const ket_qua = await quenMatKhau(thu_dien_tu.trim().toLowerCase());
      setThongBao(ket_qua.thong_bao);
    } catch (err) {
      setLoi(err instanceof Error ? err.message : "Không thể gửi yêu cầu đặt lại mật khẩu");
    } finally {
      setDangGui(false);
    }
  }

  return <>
    <ThanhDieuHuong />
    <main className="auth-shell">
      <section className="auth-card">
        <div className="eyebrow">KHÔI PHỤC TÀI KHOẢN</div>
        <h1>Quên mật khẩu</h1>
        <p>Nhập email đã dùng để đăng ký NhienIn3d. Nếu email thuộc một tài khoản đang hoạt động, backend sẽ gửi liên kết đặt lại mật khẩu vào chính địa chỉ email đó.</p>
        <form onSubmit={gui} className="auth-form">
          <label><span>Email đăng ký</span><input type="email" autoComplete="email" value={thu_dien_tu} onChange={e => setEmail(e.target.value)} required /></label>
          {loi && <div className="auth-error">{loi}</div>}
          {thong_bao && <div className="auth-success">{thong_bao}<br />Hãy kiểm tra Inbox và cả thư mục Spam/Junk.</div>}
          <button className="checkout-button" disabled={dang_gui}>{dang_gui ? "Đang gửi email..." : "Xác nhận và gửi email đặt lại"}</button>
        </form>
        <div className="auth-links"><Link href="/dang-nhap">← Quay lại đăng nhập</Link></div>
      </section>
    </main>
  </>;
}
