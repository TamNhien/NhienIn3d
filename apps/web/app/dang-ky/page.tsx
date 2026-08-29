"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ThanhDieuHuong } from "../../components/thanh-dieu-huong";
import { danhGiaMatKhau, TruongMatKhau } from "../../components/truong-mat-khau";
import { dangKy } from "../../lib/xac-thuc";

export default function DangKyPage() {
  const router = useRouter();
  const [ho_ten, setHoTen] = useState("");
  const [thu_dien_tu, setEmail] = useState("");
  const [mat_khau, setMatKhau] = useState("");
  const [xac_nhan, setXacNhan] = useState("");
  const [loi, setLoi] = useState("");
  const [dang_gui, setDangGui] = useState(false);
  const mat_khau_hop_le = useMemo(() => danhGiaMatKhau(mat_khau).hop_le, [mat_khau]);

  async function gui(e: FormEvent) {
    e.preventDefault(); setLoi("");
    if (!mat_khau_hop_le) { setLoi("Mật khẩu chưa đáp ứng đầy đủ yêu cầu bảo mật."); return; }
    if (mat_khau !== xac_nhan) { setLoi("Mật khẩu xác nhận chưa khớp"); return; }
    setDangGui(true);
    try {
      await dangKy({ thu_dien_tu, ho_ten, mat_khau });
      router.push("/tai-khoan"); router.refresh();
    } catch (err) { setLoi(err instanceof Error ? err.message : "Không thể đăng kí"); }
    finally { setDangGui(false); }
  }

  return <>
    <ThanhDieuHuong />
    <main className="auth-shell">
      <section className="auth-card auth-card-wide">
        <div className="eyebrow">BẮT ĐẦU VỚI NHIENIN3D</div>
        <h1>Đăng kí</h1>
        <p>Tài khoản mới luôn có quyền <b>Khách hàng</b>. Mật khẩu được băm Argon2id ở backend trước khi lưu PostgreSQL.</p>
        <form onSubmit={gui} className="auth-form">
          <label><span>Họ và tên</span><input value={ho_ten} onChange={e=>setHoTen(e.target.value)} minLength={2} maxLength={150} autoComplete="name" required /></label>
          <label><span>Email đăng ký</span><input type="email" value={thu_dien_tu} onChange={e=>setEmail(e.target.value)} autoComplete="email" required /></label>
          <TruongMatKhau nhan="Mật khẩu" gia_tri={mat_khau} datGiaTri={setMatKhau} autoComplete="new-password" hien_do_manh />
          <TruongMatKhau nhan="Xác nhận mật khẩu" gia_tri={xac_nhan} datGiaTri={setXacNhan} autoComplete="new-password" hien_do_manh={false} />
          {xac_nhan && mat_khau !== xac_nhan && <div className="password-match password-match-error">Mật khẩu xác nhận chưa khớp.</div>}
          {xac_nhan && mat_khau === xac_nhan && <div className="password-match password-match-ok">Mật khẩu xác nhận đã khớp.</div>}
          {loi && <div className="auth-error">{loi}</div>}
          <button className="checkout-button" disabled={dang_gui || !mat_khau_hop_le || mat_khau !== xac_nhan}>{dang_gui ? "Đang đăng kí..." : "Đăng kí"}</button>
        </form>
        <div className="auth-links"><span>Đã có tài khoản?</span><Link href="/dang-nhap">Đăng nhập</Link></div>
      </section>
    </main>
  </>;
}
