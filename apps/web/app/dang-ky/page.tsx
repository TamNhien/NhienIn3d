"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { danhGiaMatKhau, TruongMatKhau } from "../../components/truong-mat-khau";
import { dangKy } from "../../lib/xac-thuc";

export default function DangKyPage() {
  const router = useRouter();
  const [ho_ten, setHoTen] = useState("");
  const [thu_dien_tu, setEmail] = useState("");
  const [so_dien_thoai, setSoDienThoai] = useState("");
  const [dia_chi, setDiaChi] = useState("");
  const [mat_khau, setMatKhau] = useState("");
  const [xac_nhan, setXacNhan] = useState("");
  const [loi, setLoi] = useState("");
  const [dang_gui, setDangGui] = useState(false);
  const mat_khau_hop_le = useMemo(() => danhGiaMatKhau(mat_khau).hop_le, [mat_khau]);

  async function gui(e: FormEvent) {
    e.preventDefault();
    setLoi("");
    if (!mat_khau_hop_le) { setLoi("Mật khẩu chưa đáp ứng đầy đủ yêu cầu bảo mật."); return; }
    if (mat_khau !== xac_nhan) { setLoi("Mật khẩu xác nhận chưa khớp"); return; }
    setDangGui(true);
    try {
      await dangKy({ thu_dien_tu, ho_ten, so_dien_thoai, dia_chi, mat_khau });
      router.push("/tai-khoan");
      router.refresh();
    } catch (err) { setLoi(err instanceof Error ? err.message : "Không thể đăng ký"); }
    finally { setDangGui(false); }
  }

  return <main className="auth-shell cine-auth-shell">
    <section className="cine-auth-card cine-auth-card-register">
      <h1>Tạo tài khoản</h1>
      <form onSubmit={gui} className="cine-auth-form">
        <input aria-label="Họ và tên" value={ho_ten} onChange={e => setHoTen(e.target.value)} minLength={2} maxLength={150} autoComplete="name" placeholder="Họ và tên" required/>
        <input aria-label="Email" type="email" value={thu_dien_tu} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="Email" required/>
        <input aria-label="Số điện thoại" type="tel" value={so_dien_thoai} onChange={e => setSoDienThoai(e.target.value)} autoComplete="tel" placeholder="Số điện thoại" pattern="[0-9+()\-\s]{8,30}" required/>
        <textarea aria-label="Địa chỉ" value={dia_chi} onChange={e => setDiaChi(e.target.value)} autoComplete="street-address" minLength={5} maxLength={500} placeholder="Địa chỉ" required/>
        <TruongMatKhau nhan="Mật khẩu" gia_tri={mat_khau} datGiaTri={setMatKhau} autoComplete="new-password" hien_do_manh/>
        <TruongMatKhau nhan="Xác nhận mật khẩu" gia_tri={xac_nhan} datGiaTri={setXacNhan} autoComplete="new-password"/>
        {xac_nhan && mat_khau !== xac_nhan && <div className="password-match password-match-error">Mật khẩu xác nhận chưa khớp.</div>}
        {xac_nhan && mat_khau === xac_nhan && <div className="password-match password-match-ok">Hai mật khẩu trùng khớp.</div>}
        {loi && <div className="auth-error">{loi}</div>}
        <button className="cine-btn cine-btn-primary cine-auth-submit" disabled={dang_gui || !mat_khau_hop_le || mat_khau !== xac_nhan}>{dang_gui ? "Đang tạo..." : "Đăng ký"}</button>
      </form>
      <p className="cine-auth-footer">Đã có tài khoản? <Link href="/dang-nhap">Đăng nhập</Link></p>
    </section>
  </main>;
}
