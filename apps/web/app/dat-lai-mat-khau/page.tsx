"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { ThanhDieuHuong } from "../../components/thanh-dieu-huong";
import { danhGiaMatKhau, TruongMatKhau } from "../../components/truong-mat-khau";
import { datLaiMatKhau } from "../../lib/xac-thuc";

function DatLaiMatKhauNoiDung() {
  const router = useRouter();
  const search = useSearchParams();
  const ma = search.get("ma") || "";
  const [mat_khau_moi, setMatKhauMoi] = useState("");
  const [xac_nhan, setXacNhan] = useState("");
  const [loi, setLoi] = useState("");
  const [dang_gui, setDangGui] = useState(false);
  const mat_khau_hop_le = useMemo(() => danhGiaMatKhau(mat_khau_moi).hop_le, [mat_khau_moi]);

  async function gui(e: FormEvent) {
    e.preventDefault();
    setLoi("");
    if (!ma) { setLoi("Liên kết đặt lại mật khẩu thiếu mã xác thực."); return; }
    if (!mat_khau_hop_le) { setLoi("Mật khẩu mới chưa đáp ứng đầy đủ yêu cầu bảo mật."); return; }
    if (mat_khau_moi !== xac_nhan) { setLoi("Mật khẩu xác nhận chưa khớp."); return; }
    setDangGui(true);
    try {
      await datLaiMatKhau({ ma, mat_khau_moi });
      router.replace("/dang-nhap?dat_lai=thanh_cong");
      router.refresh();
    } catch (err) {
      setLoi(err instanceof Error ? err.message : "Không thể đặt lại mật khẩu");
    } finally {
      setDangGui(false);
    }
  }

  return <>
    <ThanhDieuHuong />
    <main className="auth-shell">
      <section className="auth-card auth-card-wide">
        <div className="eyebrow">BẢO MẬT TÀI KHOẢN</div>
        <h1>Đặt lại mật khẩu</h1>
        {!ma ? <>
          <div className="auth-error">Liên kết không hợp lệ vì thiếu mã đặt lại mật khẩu.</div>
          <div className="auth-links"><Link href="/quen-mat-khau">Yêu cầu liên kết mới</Link></div>
        </> : <form onSubmit={gui} className="auth-form">
          <TruongMatKhau nhan="Mật khẩu mới" gia_tri={mat_khau_moi} datGiaTri={setMatKhauMoi} autoComplete="new-password" hien_do_manh />
          <TruongMatKhau nhan="Xác nhận mật khẩu mới" gia_tri={xac_nhan} datGiaTri={setXacNhan} autoComplete="new-password" />
          {xac_nhan && mat_khau_moi !== xac_nhan && <div className="password-match password-match-error">Mật khẩu xác nhận chưa khớp.</div>}
          {xac_nhan && mat_khau_moi === xac_nhan && <div className="password-match password-match-ok">Mật khẩu xác nhận đã khớp.</div>}
          {loi && <div className="auth-error">{loi}</div>}
          <button className="checkout-button" disabled={dang_gui || !mat_khau_hop_le || mat_khau_moi !== xac_nhan}>{dang_gui ? "Đang cập nhật..." : "Xác nhận mật khẩu mới"}</button>
        </form>}
      </section>
    </main>
  </>;
}

export default function DatLaiMatKhauPage() {
  return <Suspense><DatLaiMatKhauNoiDung /></Suspense>;
}
