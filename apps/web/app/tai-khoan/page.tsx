"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { danhGiaMatKhau, TruongMatKhau } from "../../components/truong-mat-khau";
import { dangXuat, layTaiKhoan, SU_KIEN_XAC_THUC, TaiKhoan, tenVaiTro } from "../../lib/xac-thuc";
import { capNhatHoSo, capNhatPhienHienTai, doiMatKhau, DonHangTaiKhoan, HoSoTaiKhoan, layDonHangCuaToi, layHoSo, layLichLamViec, layPhien, LichLamViec, PhienTaiKhoan, thuHoiPhien } from "../../lib/tai-khoan";
import { hienThiNhanTrinhDuyet, nhanDangTrinhDuyet } from "../../lib/trinh-duyet";

const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const ngay = (x?: string | null) => x ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(x)) : "—";

export default function TaiKhoanPage() {
  const [tai_khoan, setTaiKhoan] = useState<TaiKhoan | null | undefined>(undefined);
  const [ho_so, setHoSo] = useState<HoSoTaiKhoan | null>(null);
  const [phien, setPhien] = useState<PhienTaiKhoan[]>([]);
  const [don_hang, setDonHang] = useState<DonHangTaiKhoan[]>([]);
  const [lich, setLich] = useState<LichLamViec>(null);
  const [ho_ten, setHoTen] = useState("");
  const [so_dien_thoai, setSoDienThoai] = useState("");
  const [thu_dien_tu, setThuDienTu] = useState("");
  const [dia_chi, setDiaChi] = useState("");
  const [thong_bao, setThongBao] = useState("");
  const [dang_luu, setDangLuu] = useState(false);

  const [mat_khau_hien_tai, setMatKhauHienTai] = useState("");
  const [mat_khau_moi, setMatKhauMoi] = useState("");
  const [xac_nhan_mat_khau, setXacNhanMatKhau] = useState("");
  const [dang_doi_mat_khau, setDangDoiMatKhau] = useState(false);
  const mat_khau_moi_hop_le = useMemo(() => danhGiaMatKhau(mat_khau_moi).hop_le, [mat_khau_moi]);

  const taiDuLieu = useCallback(async () => {
    const tk = await layTaiKhoan();
    setTaiKhoan(tk);
    if (!tk) return;

    try {
      const nhan = await nhanDangTrinhDuyet();
      await capNhatPhienHienTai(nhan);
    } catch {
      // Nhãn trình duyệt chỉ phục vụ hiển thị, không được làm hỏng trang tài khoản.
    }

    const [hs, dsPhien, dsDon, lichLam] = await Promise.all([layHoSo(), layPhien(), layDonHangCuaToi(), layLichLamViec()]);
    setHoSo(hs);
    setPhien(dsPhien);
    setDonHang(dsDon);
    setLich(lichLam);
    setHoTen(hs.ho_ten);
    setSoDienThoai(hs.so_dien_thoai || "");
    setThuDienTu(hs.thu_dien_tu || "");
    setDiaChi(hs.dia_chi?.[0]?.dia_chi_cu_the || "");
  }, []);

  useEffect(() => { taiDuLieu().catch(() => setTaiKhoan(null)); }, [taiDuLieu]);

  async function luu(e: FormEvent) {
    e.preventDefault();
    setDangLuu(true);
    setThongBao("");
    try {
      // PATCH trả về chính bản ghi vừa được transaction ghi vào PostgreSQL.
      // Dùng phản hồi này làm source of truth để tránh trường hợp request xác minh phụ thất bại
      // khiến giao diện hiểu nhầm rằng dữ liệu chưa được lưu.
      const da_luu = await capNhatHoSo({
        ho_ten: ho_ten.trim(),
        so_dien_thoai: so_dien_thoai.trim(),
        thu_dien_tu: thu_dien_tu.trim(),
        dia_chi: dia_chi.trim(),
      });
      // PATCH trả về dữ liệu vừa commit trong cùng transaction. Không GET lại ngay sau khi
      // lưu vì một phản hồi cũ/cached có thể ghi đè dữ liệu mới trên giao diện.
      setHoSo(da_luu);
      setTaiKhoan(da_luu);
      setHoTen(da_luu.ho_ten);
      setSoDienThoai(da_luu.so_dien_thoai || "");
      setThuDienTu(da_luu.thu_dien_tu || "");
      setDiaChi(da_luu.dia_chi?.[0]?.dia_chi_cu_the || "");
      window.dispatchEvent(new Event(SU_KIEN_XAC_THUC));
      setThongBao("Đã lưu thông tin tài khoản vào PostgreSQL.");
    } catch (loi) {
      setThongBao(loi instanceof Error ? loi.message : "Không thể cập nhật tài khoản");
    } finally {
      setDangLuu(false);
    }
  }

  async function doiMatKhauTaiKhoan(e: FormEvent) {
    e.preventDefault();
    setThongBao("");
    if (!mat_khau_moi_hop_le) {
      setThongBao("Mật khẩu mới chưa đáp ứng đầy đủ yêu cầu bảo mật.");
      return;
    }
    if (mat_khau_moi !== xac_nhan_mat_khau) {
      setThongBao("Mật khẩu mới và xác nhận mật khẩu chưa khớp.");
      return;
    }
    setDangDoiMatKhau(true);
    try {
      const kq = await doiMatKhau({ mat_khau_hien_tai, mat_khau_moi });
      setMatKhauHienTai("");
      setMatKhauMoi("");
      setXacNhanMatKhau("");
      setThongBao(kq.thong_bao);
      if (kq.yeu_cau_dang_nhap_lai) {
        window.location.replace("/dang-nhap?doi_mat_khau=thanh_cong");
        return;
      }
      setPhien(await layPhien());
    } catch (loi) {
      setThongBao(loi instanceof Error ? loi.message : "Không thể đổi mật khẩu");
    } finally {
      setDangDoiMatKhau(false);
    }
  }

  async function thuHoi(id: string) {
    try {
      await thuHoiPhien(id);
      setPhien(x => x.filter(p => p.id !== id));
    } catch (loi) {
      setThongBao(loi instanceof Error ? loi.message : "Không thể thu hồi phiên");
    }
  }

  async function thoat() {
    try { await dangXuat(); }
    finally { window.location.replace("/dang-nhap?da_dang_xuat=1"); }
  }

  if (tai_khoan === undefined) return <><main className="auth-shell"><div className="auth-card"><p>Đang tải thông tin tài khoản...</p></div></main></>;
  if (!tai_khoan) return <><main className="auth-shell"><section className="auth-card"><h1>Bạn chưa đăng nhập</h1><p>Đăng nhập để xem và thay đổi thông tin cá nhân.</p><Link className="primary auth-primary-link" href="/dang-nhap?chuyen_den=/tai-khoan">Đăng nhập</Link></section></main></>;

  const la_quan_tri = tai_khoan.vai_tro === "ADMIN";

  return <main className="cine-profile-shell page-shell">
    <div className="cine-profile-heading">
      <div><h1>Tài khoản của tôi</h1><p>Cập nhật thông tin cá nhân và mật khẩu.</p></div>
      <div className="cine-profile-heading-actions">{la_quan_tri && <Link className="cine-btn cine-btn-secondary" href="/quan-tri">Admin</Link>}<button type="button" className="cine-btn cine-btn-secondary" onClick={thoat}>Đăng xuất</button></div>
    </div>

    {thong_bao && <div className="cine-profile-message" role="status">{thong_bao}</div>}

    <section className="cine-card cine-profile-card">
      <h2>Thông tin cá nhân</h2>
      <form className="cine-profile-form" onSubmit={luu}>
        <label><span>Email</span><input type="email" value={thu_dien_tu} onChange={e => setThuDienTu(e.target.value)} autoComplete="email" required/></label>
        <label><span>Họ và tên</span><input value={ho_ten} onChange={e => setHoTen(e.target.value)} minLength={2} maxLength={150} required/></label>
        <label><span>Số điện thoại</span><input value={so_dien_thoai} onChange={e => setSoDienThoai(e.target.value)} placeholder="09xxxxxxxx"/></label>
        <label><span>Địa chỉ mặc định</span><textarea value={dia_chi} onChange={e => setDiaChi(e.target.value)} maxLength={500} autoComplete="street-address" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"/></label>
        <label><span>Vai trò</span><input value={tenVaiTro(tai_khoan.vai_tro)} disabled/></label>
        <button className="cine-btn cine-btn-primary cine-profile-submit" disabled={dang_luu}>{dang_luu ? "Đang lưu…" : "Lưu thay đổi"}</button>
      </form>
      <div className="cine-profile-meta"><div><span>Ngày tạo</span><b>{ngay(ho_so?.ngay_tao)}</b></div><div><span>Đăng nhập gần nhất</span><b>{ngay(ho_so?.lan_dang_nhap_cuoi)}</b></div><div><span>Trạng thái</span><b className="stock-ok">Đang hoạt động</b></div></div>
    </section>

    <section className="cine-card cine-profile-card">
      <h2>Đổi mật khẩu</h2>
      <form className="cine-password-form" onSubmit={doiMatKhauTaiKhoan}>
        <TruongMatKhau nhan="Mật khẩu hiện tại" gia_tri={mat_khau_hien_tai} datGiaTri={setMatKhauHienTai} autoComplete="current-password" toi_thieu={8}/>
        <TruongMatKhau nhan="Mật khẩu mới" gia_tri={mat_khau_moi} datGiaTri={setMatKhauMoi} autoComplete="new-password" hien_do_manh/>
        <TruongMatKhau nhan="Xác nhận mật khẩu mới" gia_tri={xac_nhan_mat_khau} datGiaTri={setXacNhanMatKhau} autoComplete="new-password"/>
        {xac_nhan_mat_khau && mat_khau_moi !== xac_nhan_mat_khau && <div className="password-match password-match-error">Mật khẩu xác nhận chưa khớp.</div>}
        {xac_nhan_mat_khau && mat_khau_moi === xac_nhan_mat_khau && <div className="password-match password-match-ok">Hai mật khẩu trùng khớp.</div>}
        <button className="cine-btn cine-btn-primary cine-profile-submit" disabled={dang_doi_mat_khau || !mat_khau_hien_tai || !mat_khau_moi_hop_le || mat_khau_moi !== xac_nhan_mat_khau}>{dang_doi_mat_khau ? "Đang đổi…" : "Đổi mật khẩu"}</button>
      </form>
    </section>

    {ho_so?.nhan_vien && <section className="cine-card cine-profile-card">
      <div className="cine-section-heading"><div><h2>Thông tin nhân viên</h2><p>{ho_so.nhan_vien.ma_nhan_vien} · {ho_so.nhan_vien.bo_phan}</p></div></div>
      <div className="cine-profile-meta"><div><span>Chức danh</span><b>{ho_so.nhan_vien.chuc_danh}</b></div><div><span>Bộ phận</span><b>{ho_so.nhan_vien.bo_phan}</b></div><div><span>Trạng thái</span><b>{ho_so.nhan_vien.trang_thai}</b></div></div>
      <div className="cine-compact-list">{lich?.phan_ca?.length ? lich.phan_ca.map(pc => <article key={pc.id}><div><b>{pc.ca_lam_viec.ten_ca}</b><span>{new Date(pc.ngay_lam).toLocaleDateString("vi-VN")}</span></div><strong>{pc.ca_lam_viec.gio_bat_dau} – {pc.ca_lam_viec.gio_ket_thuc}</strong></article>) : <p className="muted-copy">Chưa có ca làm việc được xếp.</p>}</div>
    </section>}

    <section className="cine-card cine-profile-card">
      <div className="cine-section-heading"><div><h2>Phiên đăng nhập</h2><p>Có thể thu hồi từng thiết bị.</p></div><span>{phien.length} phiên</span></div>
      <div className="cine-compact-list">{phien.length ? phien.map(p => <article key={p.id}><div><b>{hienThiNhanTrinhDuyet(p.trinh_duyet)}</b><span>{p.dia_chi_ip || "IP không xác định"} · tạo {ngay(p.ngay_tao)}</span></div><button type="button" className="cine-btn cine-btn-danger-outline" onClick={() => thuHoi(p.id)}>Thu hồi</button></article>) : <p className="muted-copy">Không có phiên hoạt động khác.</p>}</div>
    </section>

    <section className="cine-card cine-profile-card">
      <div className="cine-section-heading"><div><h2>Lịch sử mua hàng</h2><p>Đơn hàng gần nhất của tài khoản.</p></div><span>{don_hang.length} đơn</span></div>
      <div className="cine-compact-list">{don_hang.length ? don_hang.map(d => <article key={d.id}><div><b>{d.ma_don_hang}</b><span>{ngay(d.ngay_tao)} · {d.trang_thai}</span><small>{d.chi_tiet.map(x => `${x.ten_san_pham} ×${x.so_luong}`).join(" · ")}</small></div><strong>{vnd.format(Number(d.tong_tien))}</strong></article>) : <p className="muted-copy">Bạn chưa có đơn hàng.</p>}</div>
    </section>
  </main>;
}