"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ThanhDieuHuong } from "../../components/thanh-dieu-huong";
import { dangXuat, layTaiKhoan, TaiKhoan, tenVaiTro } from "../../lib/xac-thuc";
import { capNhatHoSo, DonHangTaiKhoan, HoSoTaiKhoan, layDonHangCuaToi, layHoSo, layLichLamViec, layPhien, LichLamViec, PhienTaiKhoan, thuHoiPhien } from "../../lib/tai-khoan";

const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const ngay = (x?: string | null) => x ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(x)) : "—";

export default function TaiKhoanPage() {
  const router = useRouter();
  const [tai_khoan, setTaiKhoan] = useState<TaiKhoan | null | undefined>(undefined);
  const [ho_so, setHoSo] = useState<HoSoTaiKhoan | null>(null);
  const [phien, setPhien] = useState<PhienTaiKhoan[]>([]);
  const [don_hang, setDonHang] = useState<DonHangTaiKhoan[]>([]);
  const [lich, setLich] = useState<LichLamViec>(null);
  const [ho_ten, setHoTen] = useState("");
  const [so_dien_thoai, setSoDienThoai] = useState("");
  const [thong_bao, setThongBao] = useState("");
  const [dang_luu, setDangLuu] = useState(false);

  const taiDuLieu = useCallback(async () => {
    const tk = await layTaiKhoan();
    setTaiKhoan(tk);
    if (!tk) return;
    const [hs, dsPhien, dsDon, lichLam] = await Promise.all([layHoSo(), layPhien(), layDonHangCuaToi(), layLichLamViec()]);
    setHoSo(hs); setPhien(dsPhien); setDonHang(dsDon); setLich(lichLam);
    setHoTen(hs.ho_ten); setSoDienThoai(hs.so_dien_thoai || "");
  }, []);

  useEffect(() => { taiDuLieu().catch(() => setTaiKhoan(null)); }, [taiDuLieu]);

  async function luu(e: FormEvent) {
    e.preventDefault(); setDangLuu(true); setThongBao("");
    try {
      const moi = await capNhatHoSo({ ho_ten, so_dien_thoai });
      setHoSo(moi); setTaiKhoan(moi); setThongBao("Đã cập nhật thông tin tài khoản.");
    } catch (loi) { setThongBao(loi instanceof Error ? loi.message : "Không thể cập nhật tài khoản"); }
    finally { setDangLuu(false); }
  }

  async function thuHoi(id: string) {
    try { await thuHoiPhien(id); setPhien(x => x.filter(p => p.id !== id)); }
    catch (loi) { setThongBao(loi instanceof Error ? loi.message : "Không thể thu hồi phiên"); }
  }

  async function thoat() {
    try { await dangXuat(); } finally { router.push("/"); router.refresh(); }
  }

  if (tai_khoan === undefined) return <><ThanhDieuHuong/><main className="auth-shell"><div className="auth-card"><p>Đang tải thông tin tài khoản...</p></div></main></>;
  if (!tai_khoan) return <><ThanhDieuHuong/><main className="auth-shell"><section className="auth-card"><h1>Bạn chưa đăng nhập</h1><p>Đăng nhập để xem và thay đổi thông tin cá nhân.</p><Link className="primary auth-primary-link" href="/dang-nhap?chuyen_den=/tai-khoan">Đăng nhập</Link></section></main></>;

  const la_quan_tri = tai_khoan.vai_tro === "QUAN_TRI" || tai_khoan.vai_tro === "SIEU_QUAN_TRI";

  return <>
    <ThanhDieuHuong/>
    <main className="account-shell-v280 page-shell">
      <div className="account-title-row">
        <div><div className="eyebrow">TÀI KHOẢN CỦA TÔI</div><h1>{ho_so?.ho_ten || tai_khoan.ho_ten}</h1><p>{tenVaiTro(tai_khoan.vai_tro)} · {ho_so?.thu_dien_tu}</p></div>
        <div className="account-title-actions">{la_quan_tri && <Link className="primary" href="/quan-tri">Quản trị hệ thống</Link>}<button className="secondary secondary-button" onClick={thoat}>Đăng xuất</button></div>
      </div>

      {thong_bao && <div className="inline-message account-message">{thong_bao}</div>}

      <section className="account-panel">
        <div className="panel-heading"><div><div className="eyebrow">HỒ SƠ</div><h2>Thông tin cá nhân</h2></div><span>Email và vai trò được bảo vệ bởi hệ thống.</span></div>
        <form className="profile-form" onSubmit={luu}>
          <label><span>Họ và tên</span><input value={ho_ten} onChange={e => setHoTen(e.target.value)} minLength={2} maxLength={150} required/></label>
          <label><span>Số điện thoại</span><input value={so_dien_thoai} onChange={e => setSoDienThoai(e.target.value)} placeholder="09xxxxxxxx"/></label>
          <label><span>Email đăng nhập</span><input value={ho_so?.thu_dien_tu || ""} disabled/></label>
          <label><span>Vai trò</span><input value={tenVaiTro(tai_khoan.vai_tro)} disabled/></label>
          <button className="checkout-button" disabled={dang_luu}>{dang_luu ? "Đang lưu…" : "Lưu thay đổi"}</button>
        </form>
        <div className="account-meta-grid">
          <div><span>Ngày tạo</span><b>{ngay(ho_so?.ngay_tao)}</b></div><div><span>Đăng nhập gần nhất</span><b>{ngay(ho_so?.lan_dang_nhap_cuoi)}</b></div><div><span>Trạng thái</span><b className="stock-ok">Đang hoạt động</b></div>
        </div>
      </section>

      {ho_so?.nhan_vien && <section className="account-panel">
        <div className="panel-heading"><div><div className="eyebrow">NHÂN VIÊN</div><h2>{ho_so.nhan_vien.ma_nhan_vien}</h2></div><span>{ho_so.nhan_vien.bo_phan}</span></div>
        <div className="account-meta-grid"><div><span>Chức danh</span><b>{ho_so.nhan_vien.chuc_danh}</b></div><div><span>Bộ phận</span><b>{ho_so.nhan_vien.bo_phan}</b></div><div><span>Trạng thái</span><b>{ho_so.nhan_vien.trang_thai}</b></div></div>
        <div className="shift-list">{lich?.phan_ca?.length ? lich.phan_ca.map(pc => <article key={pc.id} className="shift-card" style={{ borderLeftColor: pc.ca_lam_viec.mau_hien_thi || "#8b5cf6" }}><div><b>{pc.ca_lam_viec.ten_ca}</b><span>{new Date(pc.ngay_lam).toLocaleDateString("vi-VN")}</span></div><strong>{pc.ca_lam_viec.gio_bat_dau} – {pc.ca_lam_viec.gio_ket_thuc}</strong><small>{pc.trang_thai}</small></article>) : <p className="muted-copy">Chưa có ca làm việc được xếp.</p>}</div>
      </section>}

      <section className="account-panel">
        <div className="panel-heading"><div><div className="eyebrow">BẢO MẬT</div><h2>Phiên đăng nhập</h2></div><span>Có thể thu hồi từng thiết bị.</span></div>
        <div className="session-list">{phien.length ? phien.map(p => <article key={p.id}><div><b>{p.trinh_duyet || "Thiết bị không xác định"}</b><span>{p.dia_chi_ip || "IP không xác định"} · tạo {ngay(p.ngay_tao)}</span></div><button className="danger-button" onClick={() => thuHoi(p.id)}>Thu hồi</button></article>) : <p className="muted-copy">Không có phiên hoạt động khác.</p>}</div>
      </section>

      <section className="account-panel">
        <div className="panel-heading"><div><div className="eyebrow">ĐƠN HÀNG</div><h2>Lịch sử mua hàng</h2></div><span>{don_hang.length} đơn gần nhất</span></div>
        <div className="order-list">{don_hang.length ? don_hang.map(d => <article key={d.id}><div><b>{d.ma_don_hang}</b><span>{ngay(d.ngay_tao)} · {d.trang_thai}</span></div><div><strong>{vnd.format(Number(d.tong_tien))}</strong><small>{d.chi_tiet.map(x => `${x.ten_san_pham} ×${x.so_luong}`).join(" · ")}</small></div></article>) : <p className="muted-copy">Bạn chưa có đơn hàng.</p>}</div>
      </section>
    </main>
  </>;
}
