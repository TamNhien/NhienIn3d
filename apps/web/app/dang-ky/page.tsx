"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ThanhDieuHuong } from "../../components/thanh-dieu-huong";
import { dangKy } from "../../lib/xac-thuc";

export default function DangKyPage() {
  const router = useRouter();
  const [ho_ten, setHoTen] = useState("");
  const [thu_dien_tu, setEmail] = useState("");
  const [mat_khau, setMatKhau] = useState("");
  const [xac_nhan, setXacNhan] = useState("");
  const [loi, setLoi] = useState("");
  const [dang_gui, setDangGui] = useState(false);

  async function gui(e: FormEvent) {
    e.preventDefault(); setLoi("");
    if (mat_khau !== xac_nhan) { setLoi("Mật khẩu xác nhận chưa khớp"); return; }
    setDangGui(true);
    try {
      await dangKy({ thu_dien_tu, ho_ten, mat_khau });
      router.push("/tai-khoan"); router.refresh();
    } catch (err) { setLoi(err instanceof Error ? err.message : "Không thể tạo tài khoản"); }
    finally { setDangGui(false); }
  }

  return <>
    <ThanhDieuHuong />
    <main className="auth-shell">
      <section className="auth-card auth-card-wide">
        <div className="eyebrow">BẮT ĐẦU VỚI NHIENIN3D</div>
        <h1>Tạo tài khoản</h1>
        <p>Tài khoản mới luôn có quyền <b>Khách hàng</b>. Quyền cao hơn chỉ được cấp từ khu vực quản trị ở các bản sau.</p>
        <form onSubmit={gui} className="auth-form">
          <label><span>Họ và tên</span><input value={ho_ten} onChange={e=>setHoTen(e.target.value)} minLength={2} maxLength={150} autoComplete="name" required /></label>
          <label><span>Email đăng ký</span><input type="email" value={thu_dien_tu} onChange={e=>setEmail(e.target.value)} autoComplete="email" required /></label>
          <label><span>Mật khẩu</span><input type="password" value={mat_khau} onChange={e=>setMatKhau(e.target.value)} autoComplete="new-password" minLength={12} required /></label>
          <small className="password-hint">Tối thiểu 12 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.</small>
          <label><span>Xác nhận mật khẩu</span><input type="password" value={xac_nhan} onChange={e=>setXacNhan(e.target.value)} autoComplete="new-password" minLength={12} required /></label>
          {loi && <div className="auth-error">{loi}</div>}
          <button className="checkout-button" disabled={dang_gui}>{dang_gui ? "Đang tạo..." : "Tạo tài khoản"}</button>
        </form>
        <div className="auth-links"><span>Đã có tài khoản?</span><Link href="/dang-nhap">Đăng nhập</Link></div>
      </section>
    </main>
  </>;
}
