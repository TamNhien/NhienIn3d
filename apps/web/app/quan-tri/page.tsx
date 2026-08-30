"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { danhGiaMatKhau, TruongMatKhau } from "../../components/truong-mat-khau";
import { layTaiKhoan, TaiKhoan } from "../../lib/xac-thuc";
import {
  AdminNhanVien,
  AdminNguoiDung,
  AdminTongQuan,
  CaLam,
  capNhatCaLam,
  capNhatNguoiDung,
  capNhatNhanVien,
  capNhatPhanCa,
  kichHoatNguoiDung,
  khoaNguoiDung,
  layCaLam,
  layNhanVien,
  layNguoiDung,
  layPhanCa,
  layTongQuan,
  PhanCa,
  taoCaLam,
  taoNhanVien,
  taoPhanCa,
  xoaCaLam,
  xoaNguoiDung,
  xoaPhanCa
} from "../../lib/quan-tri";

const homNay = () => new Date().toISOString().slice(0, 10);
const sauNgay = (so_ngay: number) => {
  const d = new Date();
  d.setDate(d.getDate() + so_ngay);
  return d.toISOString().slice(0, 10);
};
const ngayTuIso = (gia_tri: string) => gia_tri.slice(0, 10);
const dinhDangNgay = (gia_tri: string) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "full" }).format(new Date(`${ngayTuIso(gia_tri)}T00:00:00`));
const dinhDangTien = (gia_tri: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(gia_tri || 0);
const nhanTrangThaiDon = (trang_thai: string) => ({
  CHO_XAC_NHAN: "Chờ xác nhận",
  DA_XAC_NHAN: "Đã xác nhận",
  DANG_SAN_XUAT: "Đang sản xuất",
  DANG_GIAO: "Đang giao",
  HOAN_TAT: "Hoàn tất",
  DA_HUY: "Đã hủy"
}[trang_thai] || trang_thai);

type TabQuanTri = "tong-quan" | "khach-hang" | "nhan-vien" | "tao-nhan-vien" | "ca-lam" | "xep-ca";

export default function QuanTriPage() {
  const [tai_khoan, setTaiKhoan] = useState<TaiKhoan | null | undefined>(undefined);
  const [tong_quan, setTongQuan] = useState<AdminTongQuan | null>(null);
  const [nguoi_dung, setNguoiDung] = useState<AdminNguoiDung[]>([]);
  const [nhan_vien, setNhanVien] = useState<AdminNhanVien[]>([]);
  const [ca_lam, setCaLam] = useState<CaLam[]>([]);
  const [phan_ca, setPhanCa] = useState<PhanCa[]>([]);
  const [thong_bao, setThongBao] = useState("");
  const [tab, setTab] = useState<TabQuanTri>("tong-quan");
  const [dang_xu_ly, setDangXuLy] = useState<string | null>(null);
  const [tu_ngay, setTuNgay] = useState(homNay());
  const [den_ngay, setDenNgay] = useState(sauNgay(14));

  const [nv, setNv] = useState({ thu_dien_tu: "", ho_ten: "", so_dien_thoai: "", mat_khau: "", xac_nhan_mat_khau: "", ma_nhan_vien: "", ngay_vao_lam: homNay() });
  const [ca, setCa] = useState({ ma_ca: "", ten_ca: "", gio_bat_dau: "06:00", gio_ket_thuc: "14:00", mau_hien_thi: "#38BDF8" });
  const [ca_dang_sua_id, setCaDangSuaId] = useState<string | null>(null);
  const [pc, setPc] = useState({ nhan_vien_id: "", ca_lam_viec_id: "", ngay_lam: homNay(), ghi_chu: "" });
  const [pc_dang_sua_id, setPcDangSuaId] = useState<string | null>(null);

  const taiDuLieu = useCallback(async () => {
    const tk = await layTaiKhoan();
    setTaiKhoan(tk);
    if (!tk || tk.vai_tro !== "ADMIN") return;
    const [tq, nd, nvData, caData, pcData] = await Promise.all([layTongQuan(), layNguoiDung(), layNhanVien(), layCaLam(), layPhanCa()]);
    setTongQuan(tq);
    setNguoiDung(nd);
    setNhanVien(nvData);
    setCaLam(caData);
    setPhanCa(pcData);
    setPc(x => ({ ...x, nhan_vien_id: x.nhan_vien_id || nvData[0]?.id || "", ca_lam_viec_id: x.ca_lam_viec_id || caData[0]?.id || "" }));
  }, []);

  useEffect(() => { taiDuLieu().catch(e => setThongBao(e instanceof Error ? e.message : "Không thể tải dữ liệu quản trị")); }, [taiDuLieu]);

  function suaKhachHangLocal(id: string, patch: Partial<AdminNguoiDung>) {
    setNguoiDung(ds => ds.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  async function luuKhachHang(user: AdminNguoiDung) {
    setDangXuLy(`kh-${user.id}`);
    setThongBao("");
    try {
      const payload = {
        thu_dien_tu: user.thu_dien_tu.trim(),
        ho_ten: user.ho_ten.trim(),
        so_dien_thoai: user.so_dien_thoai?.trim() || "",
        dia_chi_mac_dinh: user.dia_chi_mac_dinh?.trim() || ""
      };
      const da_luu = await capNhatNguoiDung(user.id, payload);
      setNguoiDung(ds => ds.map(x => x.id === user.id ? { ...x, ...da_luu } : x));
      const ds_moi = await layNguoiDung();
      const xac_nhan = ds_moi.find(x => x.id === user.id);
      if (!xac_nhan || xac_nhan.thu_dien_tu !== payload.thu_dien_tu.toLowerCase() || xac_nhan.ho_ten !== payload.ho_ten || (xac_nhan.so_dien_thoai || "") !== payload.so_dien_thoai || (xac_nhan.dia_chi_mac_dinh || "") !== payload.dia_chi_mac_dinh) {
        throw new Error("PostgreSQL chưa xác nhận đầy đủ thông tin khách hàng vừa lưu.");
      }
      setNguoiDung(ds_moi);
      setThongBao(`Đã lưu thông tin khách hàng ${xac_nhan.ho_ten}. F5 vẫn giữ dữ liệu mới.`);
    } catch (e) {
      setThongBao(e instanceof Error ? e.message : "Không thể cập nhật khách hàng");
      await layNguoiDung().then(setNguoiDung).catch(() => undefined);
    } finally {
      setDangXuLy(null);
    }
  }

  async function doiTrangThai(user: AdminNguoiDung) {
    setDangXuLy(user.id); setThongBao("");
    try {
      const kq = user.da_kich_hoat ? await khoaNguoiDung(user.id) : await kichHoatNguoiDung(user.id);
      setThongBao(kq.thong_bao);
      await taiDuLieu();
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể cập nhật tài khoản"); }
    finally { setDangXuLy(null); }
  }

  async function xoaTaiKhoan(user: AdminNguoiDung) {
    if (!window.confirm(`Xóa tài khoản ${user.thu_dien_tu}?\n\nĐơn hàng đã phát sinh vẫn được giữ lại nhưng không còn liên kết tới tài khoản này.`)) return;
    setDangXuLy(user.id); setThongBao("");
    try {
      const kq = await xoaNguoiDung(user.id);
      setThongBao(kq.thong_bao);
      await taiDuLieu();
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xóa tài khoản"); }
    finally { setDangXuLy(null); }
  }

  async function taoNV(e: FormEvent) {
    e.preventDefault();
    setThongBao("");
    if (!danhGiaMatKhau(nv.mat_khau).hop_le) {
      setThongBao("Mật khẩu nhân viên phải có ít nhất 12 ký tự, chữ hoa, chữ thường, số và ký tự đặc biệt.");
      return;
    }
    if (nv.mat_khau !== nv.xac_nhan_mat_khau) {
      setThongBao("Mật khẩu và xác nhận mật khẩu chưa khớp.");
      return;
    }
    setDangXuLy("tao-nhan-vien");
    try {
      await taoNhanVien({
        thu_dien_tu: nv.thu_dien_tu.trim(),
        ho_ten: nv.ho_ten.trim(),
        so_dien_thoai: nv.so_dien_thoai.trim() || undefined,
        mat_khau: nv.mat_khau,
        ma_nhan_vien: nv.ma_nhan_vien.trim().toUpperCase(),
        ngay_vao_lam: nv.ngay_vao_lam,
      });
      setThongBao("Đã tạo nhân viên bán hàng và kích hoạt tài khoản.");
      setNv({ thu_dien_tu: "", ho_ten: "", so_dien_thoai: "", mat_khau: "", xac_nhan_mat_khau: "", ma_nhan_vien: "", ngay_vao_lam: homNay() });
      await taiDuLieu();
      setTab("nhan-vien");
    } catch (err) {
      setThongBao(err instanceof Error ? err.message : "Không thể tạo nhân viên bán hàng");
    } finally {
      setDangXuLy(null);
    }
  }

  function suaNhanVienLocal(id: string, patch: Partial<AdminNhanVien>) {
    setNhanVien(ds => ds.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  async function luuNhanVien(item: AdminNhanVien) {
    const trang_thai_can_luu = item.trang_thai;
    setDangXuLy(`nv-${item.id}`);
    setThongBao("");
    try {
      const da_luu = await capNhatNhanVien(item.id, { trang_thai: trang_thai_can_luu });
      setNhanVien(ds => ds.map(x => x.id === item.id ? da_luu : x));

      // Xác minh lại bằng GET no-store ngay sau commit. Chỉ báo thành công khi
      // PostgreSQL trả đúng trạng thái vừa lưu, nhờ vậy F5 sẽ giữ nguyên dữ liệu.
      const ds_moi = await layNhanVien();
      const xac_nhan = ds_moi.find(x => x.id === item.id);
      if (!xac_nhan || xac_nhan.trang_thai !== trang_thai_can_luu) {
        throw new Error("PostgreSQL chưa xác nhận trạng thái nhân viên vừa lưu. Vui lòng thử lại.");
      }
      setNhanVien(ds_moi);
      setNguoiDung(await layNguoiDung());
      setThongBao(`Đã lưu ${item.ma_nhan_vien}: ${trang_thai_can_luu === "DANG_LAM" ? "Đang làm" : trang_thai_can_luu === "TAM_NGHI" ? "Tạm nghỉ" : "Nghỉ việc"}. F5 vẫn giữ trạng thái này.`);
    } catch (e) {
      setThongBao(e instanceof Error ? e.message : "Không thể cập nhật nhân viên");
      await layNhanVien().then(setNhanVien).catch(() => undefined);
    } finally {
      setDangXuLy(null);
    }
  }

  function datLaiFormCa() {
    setCaDangSuaId(null);
    setCa({ ma_ca: "", ten_ca: "", gio_bat_dau: "06:00", gio_ket_thuc: "14:00", mau_hien_thi: "#38BDF8" });
  }

  function batDauSuaCa(item: CaLam) {
    setCaDangSuaId(item.id);
    setCa({
      ma_ca: item.ma_ca,
      ten_ca: item.ten_ca,
      gio_bat_dau: item.gio_bat_dau,
      gio_ket_thuc: item.gio_ket_thuc,
      mau_hien_thi: item.mau_hien_thi || "#38BDF8"
    });
    setThongBao(`Đang chỉnh sửa ${item.ma_ca} · ${item.ten_ca}.`);
  }

  async function luuCa(e: FormEvent) {
    e.preventDefault();
    setDangXuLy(ca_dang_sua_id ? `ca-${ca_dang_sua_id}` : "tao-ca");
    setThongBao("");
    try {
      if (ca_dang_sua_id) {
        const id_dang_sua = ca_dang_sua_id;
        await capNhatCaLam(id_dang_sua, ca);
        const ds_ca = await layCaLam();
        const xac_nhan = ds_ca.find(x => x.id === id_dang_sua);
        if (!xac_nhan || xac_nhan.ma_ca !== ca.ma_ca.trim().toUpperCase() || xac_nhan.ten_ca !== ca.ten_ca.trim() || xac_nhan.gio_bat_dau !== ca.gio_bat_dau || xac_nhan.gio_ket_thuc !== ca.gio_ket_thuc || (xac_nhan.mau_hien_thi || "").toUpperCase() !== ca.mau_hien_thi.toUpperCase()) {
          throw new Error("PostgreSQL chưa xác nhận thay đổi ca làm việc vừa lưu.");
        }
        setCaLam(ds_ca);
        setPhanCa(await layPhanCa());
        setThongBao(`Đã lưu ${xac_nhan.ma_ca} · ${xac_nhan.ten_ca} (${xac_nhan.gio_bat_dau}–${xac_nhan.gio_ket_thuc}).`);
      } else {
        await taoCaLam(ca);
        setThongBao("Đã tạo ca làm việc.");
        setCaLam(await layCaLam());
      }
      datLaiFormCa();
    } catch (err) {
      setThongBao(err instanceof Error ? err.message : ca_dang_sua_id ? "Không thể cập nhật ca" : "Không thể tạo ca");
    } finally {
      setDangXuLy(null);
    }
  }

  async function xoaCa(item: CaLam) {
    if (!window.confirm(`Xóa ca ${item.ma_ca} · ${item.ten_ca}?\n\nCác phân ca đang dùng mẫu ca này cũng sẽ bị xóa.`)) return;
    setDangXuLy(`ca-${item.id}`);
    setThongBao("");
    try {
      const kq = await xoaCaLam(item.id);
      if (ca_dang_sua_id === item.id) datLaiFormCa();
      setThongBao(kq.so_phan_ca_da_xoa > 0 ? `${kq.thong_bao}. Đã xóa kèm ${kq.so_phan_ca_da_xoa} phân ca.` : kq.thong_bao);
      await taiDuLieu();
    } catch (err) {
      setThongBao(err instanceof Error ? err.message : "Không thể xóa ca");
    } finally {
      setDangXuLy(null);
    }
  }

  function datLaiFormPhanCa() {
    setPcDangSuaId(null);
    setPc({
      nhan_vien_id: nhan_vien.find(n => n.nguoi_dung.da_kich_hoat && n.trang_thai === "DANG_LAM")?.id || "",
      ca_lam_viec_id: ca_lam.find(c => c.dang_hoat_dong)?.id || "",
      ngay_lam: homNay(),
      ghi_chu: ""
    });
  }

  function batDauSuaPhanCa(item: PhanCa) {
    setPcDangSuaId(item.id);
    setPc({
      nhan_vien_id: item.nhan_vien.id,
      ca_lam_viec_id: item.ca_lam_viec.id,
      ngay_lam: ngayTuIso(item.ngay_lam),
      ghi_chu: item.ghi_chu || ""
    });
    setThongBao(`Đang chỉnh sửa phân ca ${item.nhan_vien.ma_nhan_vien} · ${item.ca_lam_viec.ten_ca}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function luuPhanCa(e: FormEvent) {
    e.preventDefault();
    setDangXuLy(pc_dang_sua_id ? `pc-${pc_dang_sua_id}` : "tao-phan-ca");
    setThongBao("");
    try {
      if (pc_dang_sua_id) {
        const id_dang_sua = pc_dang_sua_id;
        await capNhatPhanCa(id_dang_sua, pc);
        const ds_pc = await layPhanCa();
        const xac_nhan = ds_pc.find(x => x.id === id_dang_sua);
        if (!xac_nhan || xac_nhan.nhan_vien.id !== pc.nhan_vien_id || xac_nhan.ca_lam_viec.id !== pc.ca_lam_viec_id || ngayTuIso(xac_nhan.ngay_lam) !== pc.ngay_lam || (xac_nhan.ghi_chu || "") !== pc.ghi_chu.trim()) {
          throw new Error("PostgreSQL chưa xác nhận thay đổi phân ca vừa lưu.");
        }
        setPhanCa(ds_pc);
        setThongBao(`Đã lưu phân ca ${xac_nhan.nhan_vien.ma_nhan_vien} · ${xac_nhan.ca_lam_viec.ten_ca} ngày ${new Date(`${pc.ngay_lam}T00:00:00`).toLocaleDateString("vi-VN")}.`);
      } else {
        await taoPhanCa(pc);
        setThongBao("Đã xếp ca cho nhân viên.");
        setPhanCa(await layPhanCa());
      }
      datLaiFormPhanCa();
    } catch (err) {
      setThongBao(err instanceof Error ? err.message : pc_dang_sua_id ? "Không thể cập nhật phân ca" : "Không thể xếp ca");
    } finally {
      setDangXuLy(null);
    }
  }

  async function huyPhanCa(item: PhanCa) {
    if (!window.confirm(`Xóa phân ca ${item.nhan_vien.ma_nhan_vien} · ${item.ca_lam_viec.ten_ca} ngày ${new Date(`${ngayTuIso(item.ngay_lam)}T00:00:00`).toLocaleDateString("vi-VN")}?`)) return;
    setDangXuLy(`pc-${item.id}`);
    setThongBao("");
    try {
      const kq = await xoaPhanCa(item.id);
      if (pc_dang_sua_id === item.id) datLaiFormPhanCa();
      setThongBao(kq.thong_bao);
      await taiDuLieu();
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xóa phân ca"); }
    finally { setDangXuLy(null); }
  }

  const soPhanCaCuaCa = useMemo(() => {
    const dem = new Map<string, number>();
    for (const item of phan_ca) dem.set(item.ca_lam_viec.id, (dem.get(item.ca_lam_viec.id) || 0) + 1);
    return dem;
  }, [phan_ca]);

  const khachHang = useMemo(() => nguoi_dung.filter(x => x.vai_tro === "KHACH_HANG"), [nguoi_dung]);

  const thongKe = useMemo(() => [
    ["Khách hàng", tong_quan?.khach_hang || 0],
    ["NV bán hàng", tong_quan?.nhan_vien || 0],
    ["Ca làm", tong_quan?.ca_lam_viec || 0],
    ["Phân ca", tong_quan?.phan_ca || 0],
    ["Đơn hàng", tong_quan?.don_hang || 0],
    ["Sản phẩm", tong_quan?.san_pham || 0]
  ] as const, [tong_quan]);

  const phanCaTrongKhoang = useMemo(() => phan_ca.filter(x => {
    const ngay = ngayTuIso(x.ngay_lam);
    return ngay >= tu_ngay && ngay <= den_ngay;
  }), [phan_ca, tu_ngay, den_ngay]);

  const phanCaTheoNgay = useMemo(() => {
    const nhom = new Map<string, PhanCa[]>();
    for (const item of phanCaTrongKhoang) {
      const ngay = ngayTuIso(item.ngay_lam);
      const ds = nhom.get(ngay) || [];
      ds.push(item);
      nhom.set(ngay, ds);
    }
    return Array.from(nhom.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [phanCaTrongKhoang]);

  const maxDoanhThu7Ngay = useMemo(() => Math.max(1, ...(tong_quan?.doanh_thu_theo_ngay.map(x => x.doanh_thu) || [1])), [tong_quan]);

  if (tai_khoan === undefined) return <main className="auth-shell"><div className="auth-card"><p>Đang xác minh quyền Admin...</p></div></main>;
  if (!tai_khoan) return <main className="auth-shell"><section className="auth-card"><h1>Cần đăng nhập</h1><Link className="primary auth-primary-link" href="/dang-nhap?chuyen_den=/quan-tri">Đăng nhập</Link></section></main>;
  if (tai_khoan.vai_tro !== "ADMIN") return <main className="auth-shell"><section className="auth-card"><h1>Không có quyền truy cập</h1><p>Khu vực này chỉ dành cho Admin.</p><Link className="primary auth-primary-link" href="/tai-khoan">Về tài khoản</Link></section></main>;

  const tabs: Array<[TabQuanTri, string]> = [
    ["tong-quan", "Tổng quan"],
    ["khach-hang", "Khách hàng"],
    ["nhan-vien", "Nhân viên bán hàng"],
    ["tao-nhan-vien", "Tạo nhân viên bán hàng"],
    ["ca-lam", "Ca làm"],
    ["xep-ca", "Xếp ca"]
  ];

  return <main className="cine-admin-shell page-shell">
    <div className="cine-admin-heading">
      <div><h1>Admin Dashboard</h1><p>Admin có toàn quyền quản trị tài khoản, nhân sự và lịch làm việc.</p></div>
      <div className="cine-admin-heading-actions"><span>{tai_khoan.ho_ten} · Admin</span><Link className="cine-btn cine-btn-secondary" href="/tai-khoan">Tài khoản của tôi</Link></div>
    </div>

    {thong_bao && <div className="cine-admin-message" role="status">{thong_bao}</div>}

    <div className="cine-admin-stats">{thongKe.map(([ten, gia_tri]) => <div className="cine-card cine-stat-card" key={ten}><span>{ten}</span><b>{gia_tri}</b></div>)}</div>

    <nav className="cine-admin-tabs" aria-label="Chức năng quản trị">{tabs.map(([ma, ten]) => <button type="button" key={ma} className={`cine-btn ${tab === ma ? "cine-btn-primary" : "cine-btn-secondary"}`} onClick={() => setTab(ma)}>{ten}</button>)}</nav>

    {tab === "tong-quan" && <section className="cine-dashboard-v211">
      {!tong_quan ? <div className="cine-card cine-admin-section">Đang tải thống kê quản trị…</div> : <>
        <div className="cine-dashboard-period-cards">
          <article className="cine-card cine-dashboard-kpi"><span>Doanh thu hôm nay</span><strong>{dinhDangTien(tong_quan.doanh_thu.hom_nay)}</strong><small>{tong_quan.don_hang_theo_ky.hom_nay} đơn phát sinh · doanh thu tính trên đơn hoàn tất</small></article>
          <article className="cine-card cine-dashboard-kpi"><span>Doanh thu 7 ngày</span><strong>{dinhDangTien(tong_quan.doanh_thu.bay_ngay)}</strong><small>{tong_quan.don_hang_theo_ky.bay_ngay} đơn từ {new Date(`${tong_quan.ky_bao_cao.tu_7_ngay}T00:00:00`).toLocaleDateString("vi-VN")}</small></article>
          <article className="cine-card cine-dashboard-kpi"><span>Doanh thu 30 ngày</span><strong>{dinhDangTien(tong_quan.doanh_thu.ba_muoi_ngay)}</strong><small>{tong_quan.don_hang_theo_ky.ba_muoi_ngay} đơn · trung bình {dinhDangTien(tong_quan.doanh_thu.gia_tri_don_trung_binh_30_ngay)}/đơn hoàn tất</small></article>
          <article className="cine-card cine-dashboard-kpi"><span>Khách hàng mới</span><strong>{tong_quan.khach_hang_moi.ba_muoi_ngay}</strong><small>Hôm nay {tong_quan.khach_hang_moi.hom_nay} · 7 ngày {tong_quan.khach_hang_moi.bay_ngay}</small></article>
        </div>

        <div className="cine-dashboard-grid">
          <article className="cine-card cine-dashboard-panel cine-dashboard-revenue">
            <div className="cine-dashboard-panel-head"><div><h2>Doanh thu 7 ngày</h2><p>Đơn hoàn tất theo ngày, múi giờ Việt Nam.</p></div><strong>{dinhDangTien(tong_quan.doanh_thu.bay_ngay)}</strong></div>
            <div className="cine-revenue-bars">{tong_quan.doanh_thu_theo_ngay.map(item => <div className="cine-revenue-row" key={item.ngay}>
              <div><b>{new Date(`${item.ngay}T00:00:00`).toLocaleDateString("vi-VN", { weekday: "short" })}</b><span>{new Date(`${item.ngay}T00:00:00`).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</span></div>
              <div className="cine-revenue-track"><i style={{ width: `${Math.max(3, (item.doanh_thu / maxDoanhThu7Ngay) * 100)}%` }} /></div>
              <div><strong>{dinhDangTien(item.doanh_thu)}</strong><small>{item.so_don} đơn</small></div>
            </div>)}</div>
          </article>

          <article className="cine-card cine-dashboard-panel">
            <div className="cine-dashboard-panel-head"><div><h2>Trạng thái đơn hàng</h2><p>Toàn bộ đơn đang có trong hệ thống.</p></div><strong>{tong_quan.don_hang}</strong></div>
            <div className="cine-order-status-grid">{Object.entries(tong_quan.trang_thai_don_hang).map(([status, count]) => <div className="cine-order-status" key={status} data-status={status}><span>{nhanTrangThaiDon(status)}</span><b>{count}</b></div>)}</div>
          </article>
        </div>

        <div className="cine-dashboard-grid">
          <article className="cine-card cine-dashboard-panel">
            <div className="cine-dashboard-panel-head"><div><h2>Top sản phẩm 30 ngày</h2><p>Xếp theo số lượng bán, bỏ đơn đã hủy.</p></div></div>
            <div className="cine-dashboard-table">
              <div className="cine-dashboard-table-head"><span>Sản phẩm</span><span>Số lượng</span><span>Giá trị</span></div>
              {tong_quan.top_san_pham_30_ngay.map((item, index) => <div className="cine-dashboard-table-row" key={item.ma_san_pham}><span><b>#{index + 1} · {item.ten_san_pham}</b><small>{item.ma_san_pham}</small></span><strong>{item.so_luong}</strong><strong>{dinhDangTien(item.doanh_thu)}</strong></div>)}
              {tong_quan.top_san_pham_30_ngay.length === 0 && <div className="cine-dashboard-empty">Chưa có dữ liệu bán hàng trong 30 ngày.</div>}
            </div>
          </article>

          <article className="cine-card cine-dashboard-panel">
            <div className="cine-dashboard-panel-head"><div><h2>Tồn kho thấp</h2><p>Biến thể đang bán có tồn kho ≤ 5.</p></div><strong>{tong_quan.ton_kho_thap.length}</strong></div>
            <div className="cine-low-stock-list">{tong_quan.ton_kho_thap.map(item => <div className="cine-low-stock-row" key={item.id}><span><b>{item.ten_san_pham}</b><small>{item.ma_bien_the} · {item.vat_lieu} · {item.mau_sac}</small></span><strong className={item.so_luong_ton <= 1 ? "critical" : ""}>{item.so_luong_ton}</strong></div>)}
            {tong_quan.ton_kho_thap.length === 0 && <div className="cine-dashboard-empty">Không có biến thể tồn kho thấp.</div>}</div>
          </article>
        </div>

        <article className="cine-card cine-dashboard-panel">
          <div className="cine-dashboard-panel-head"><div><h2>Đơn hàng gần đây</h2><p>8 đơn mới nhất để Admin theo dõi nhanh.</p></div></div>
          <div className="cine-recent-orders">{tong_quan.don_gan_day.map(item => <div className="cine-recent-order" key={item.id}><span><b>{item.ma_don_hang}</b><small>{item.ho_ten_nguoi_nhan}</small></span><span><b>{dinhDangTien(item.tong_tien)}</b><small>{new Date(item.ngay_tao).toLocaleString("vi-VN")}</small></span><span className="cine-order-state" data-status={item.trang_thai}>{nhanTrangThaiDon(item.trang_thai)}</span></div>)}
          {tong_quan.don_gan_day.length === 0 && <div className="cine-dashboard-empty">Chưa có đơn hàng.</div>}</div>
        </article>
      </>}
    </section>}

    {tab === "khach-hang" && <section className="cine-card cine-admin-section">
      <div className="cine-section-heading"><div><h2>Tài khoản khách hàng</h2><p>Khách hàng được quản lý riêng với nhân viên. Admin có thể sửa họ tên, email, số điện thoại, địa chỉ, khóa/kích hoạt hoặc xóa tài khoản.</p></div><span>{khachHang.length} khách hàng</span></div>
      <div className="cine-customer-list">
        {khachHang.map(u => <article key={u.id} className="cine-customer-card">
          <div className="cine-customer-card-head">
            <div><b>{u.ho_ten}</b><span>{u.thu_dien_tu}</span></div>
            <span className={u.da_kich_hoat ? "status-badge active" : "status-badge locked"}>{u.da_kich_hoat ? "Đang hoạt động" : "Đã khóa"}</span>
          </div>
          <div className="cine-customer-form-grid">
            <label><span>Họ và tên</span><input value={u.ho_ten} onChange={e => suaKhachHangLocal(u.id, { ho_ten: e.target.value })}/></label>
            <label><span>Email đăng nhập</span><input type="email" value={u.thu_dien_tu} onChange={e => suaKhachHangLocal(u.id, { thu_dien_tu: e.target.value })}/></label>
            <label><span>Số điện thoại</span><input value={u.so_dien_thoai || ""} onChange={e => suaKhachHangLocal(u.id, { so_dien_thoai: e.target.value })}/></label>
            <label className="cine-customer-address"><span>Địa chỉ mặc định</span><input value={u.dia_chi_mac_dinh || ""} onChange={e => suaKhachHangLocal(u.id, { dia_chi_mac_dinh: e.target.value })}/></label>
          </div>
          <div className="cine-customer-actions">
            <button type="button" className="cine-btn cine-btn-primary" onClick={() => luuKhachHang(u)} disabled={dang_xu_ly === `kh-${u.id}`}>{dang_xu_ly === `kh-${u.id}` ? "Đang lưu…" : "Lưu thông tin"}</button>
            <button type="button" className={`cine-btn ${u.da_kich_hoat ? "cine-btn-danger" : "cine-btn-success"}`} onClick={() => doiTrangThai(u)} disabled={dang_xu_ly === u.id}>{dang_xu_ly === u.id ? "Đang xử lý…" : u.da_kich_hoat ? "Khóa" : "Kích hoạt"}</button>
            <button type="button" className="cine-btn cine-btn-danger-outline" onClick={() => xoaTaiKhoan(u)} disabled={dang_xu_ly === u.id}>Xóa</button>
          </div>
        </article>)}
        {khachHang.length === 0 && <div className="cine-empty-state">Chưa có tài khoản khách hàng.</div>}
      </div>
    </section>}

    {tab === "nhan-vien" && <section className="cine-card cine-admin-section">
      <div className="cine-section-heading"><div><h2>Hồ sơ nhân viên bán hàng</h2><p>Admin quản lý trạng thái làm việc. Chức danh và bộ phận được chuẩn hóa cố định cho toàn bộ nhân viên bán hàng.</p></div><span>{nhan_vien.length} nhân viên</span></div>
      <div className="cine-staff-list cine-staff-list-v295">{nhan_vien.map(n => <article key={n.id} className="cine-staff-card cine-staff-card-v295">
        <div className="cine-staff-title"><b>{n.ma_nhan_vien} · {n.nguoi_dung.ho_ten}</b><span>{n.nguoi_dung.thu_dien_tu}</span><small>{n.nguoi_dung.so_dien_thoai || "Chưa có số điện thoại"}</small></div>
        <div className="cine-staff-static"><span>Chức danh</span><b>Nhân viên bán hàng</b></div>
        <div className="cine-staff-static"><span>Bộ phận</span><b>Bán hàng</b></div>
        <label className="cine-staff-status"><span>Trạng thái</span><select value={n.trang_thai} onChange={e => suaNhanVienLocal(n.id, { trang_thai: e.target.value })}><option value="DANG_LAM">Đang làm</option><option value="TAM_NGHI">Tạm nghỉ</option><option value="NGHI_VIEC">Nghỉ việc</option></select></label>
        <div className="cine-staff-row-actions">
          <button type="button" className="cine-btn cine-btn-secondary" onClick={() => luuNhanVien(n)} disabled={dang_xu_ly === `nv-${n.id}`}>{dang_xu_ly === `nv-${n.id}` ? "Đang lưu…" : "Lưu trạng thái"}</button>
          <button type="button" className="cine-btn cine-btn-danger-outline" onClick={() => xoaTaiKhoan(n.nguoi_dung)} disabled={dang_xu_ly === n.nguoi_dung.id}>Xóa tài khoản</button>
        </div>
      </article>)}</div>
      <div className="cine-staff-status-note">Đang làm: tài khoản được kích hoạt. Tạm nghỉ/Nghỉ việc: tài khoản bị khóa và các phiên đăng nhập đang mở được thu hồi.</div>
    </section>}

    {tab === "tao-nhan-vien" && <section className="cine-admin-operations cine-staff-create-section">
      <div className="cine-operations-heading">
        <div><p className="cine-admin-kicker">STAFF · SALES</p><h2>Tạo nhân viên bán hàng</h2><p>Bố cục form theo CineBooking Pro. Admin là người quản lý toàn bộ nghiệp vụ quản trị hệ thống.</p></div>
        <button type="button" className="cine-btn cine-btn-secondary" onClick={() => setTab("nhan-vien")}>Xem hồ sơ nhân sự</button>
      </div>
      <div className="cine-staff-create-layout">
        <form className="cine-card cine-staff-create-form" onSubmit={taoNV}>
          <div className="cine-form-card-heading"><h3>Thông tin nhân viên</h3><p>Tài khoản được kích hoạt ngay sau khi tạo.</p></div>
          <div className="cine-form-row">
            <label><span>Mã nhân viên</span><input placeholder="N3D-NV-011" value={nv.ma_nhan_vien} onChange={e => setNv({...nv, ma_nhan_vien:e.target.value})} required/></label>
            <label><span>Ngày vào làm</span><input type="date" value={nv.ngay_vao_lam} onChange={e => setNv({...nv, ngay_vao_lam:e.target.value})} required/></label>
          </div>
          <label><span>Họ và tên</span><input placeholder="Nguyễn Văn A" value={nv.ho_ten} onChange={e => setNv({...nv, ho_ten:e.target.value})} required/></label>
          <label><span>Email đăng nhập</span><input placeholder="nhanvien@example.com" type="email" value={nv.thu_dien_tu} onChange={e => setNv({...nv, thu_dien_tu:e.target.value})} required/></label>
          <label><span>Số điện thoại</span><input placeholder="09xxxxxxxx" value={nv.so_dien_thoai} onChange={e => setNv({...nv, so_dien_thoai:e.target.value})}/></label>
          <TruongMatKhau nhan="Mật khẩu ban đầu" gia_tri={nv.mat_khau} datGiaTri={mat_khau => setNv({...nv, mat_khau})} autoComplete="new-password" hien_do_manh/>
          <TruongMatKhau nhan="Xác nhận mật khẩu" gia_tri={nv.xac_nhan_mat_khau} datGiaTri={xac_nhan_mat_khau => setNv({...nv, xac_nhan_mat_khau})} autoComplete="new-password"/>
          <div className="cine-fixed-role-card"><span>Vai trò & hồ sơ cố định</span><b>Nhân viên bán hàng</b><small>Vai trò hệ thống: NHAN_VIEN · Bộ phận: Bán hàng</small></div>
          <button className="cine-btn cine-btn-primary cine-btn-block" type="submit" disabled={dang_xu_ly === "tao-nhan-vien"}>{dang_xu_ly === "tao-nhan-vien" ? "Đang tạo…" : "Tạo nhân viên bán hàng"}</button>
        </form>
      </div>
    </section>}

    {tab === "ca-lam" && <section className="cine-admin-operations">
      <div className="cine-operations-heading">
        <div><h2>Ca làm việc</h2><p>Tạo mẫu ca gọn như CineBooking Pro rồi dùng lại khi xếp lịch.</p></div>
        <button type="button" className="cine-btn cine-btn-secondary" onClick={() => setTab("xep-ca")}>Mở Xếp ca →</button>
      </div>
      <div className="cine-shift-management-grid">
        <form className="cine-card cine-shift-editor" onSubmit={luuCa}>
          <div className="cine-shift-editor-title"><div><h3>{ca_dang_sua_id ? "Chỉnh sửa ca" : "Tạo ca mới"}</h3><p>{ca_dang_sua_id ? "Thay đổi mã, tên, giờ làm hoặc màu hiển thị." : "Mặc định bắt đầu theo khung ca sáng 06:00–14:00."}</p></div><span>{ca.gio_bat_dau}–{ca.gio_ket_thuc}</span></div>
          <label><span>Mã ca</span><input placeholder="VD: CA01" value={ca.ma_ca} onChange={e => setCa({...ca, ma_ca:e.target.value})} required/></label>
          <label><span>Tên ca</span><input placeholder="Ca sáng" value={ca.ten_ca} onChange={e => setCa({...ca, ten_ca:e.target.value})} required/></label>
          <div className="cine-time-grid"><label><span>Bắt đầu</span><input type="time" value={ca.gio_bat_dau} onChange={e => setCa({...ca, gio_bat_dau:e.target.value})} required/></label><label><span>Kết thúc</span><input type="time" value={ca.gio_ket_thuc} onChange={e => setCa({...ca, gio_ket_thuc:e.target.value})} required/></label></div>
          <label className="cine-color-field"><span>Màu lịch</span><div><input type="color" value={ca.mau_hien_thi} onChange={e => setCa({...ca, mau_hien_thi:e.target.value})}/><code>{ca.mau_hien_thi.toUpperCase()}</code></div></label>
          <div className="cine-shift-help">Ca mặc định của hệ thống: Ca sáng 06:00–14:00 và Ca chiều 14:00–22:00. Admin có thể chỉnh sửa hoặc xóa.</div>
          <div className="cine-shift-form-actions">
            <button className="cine-btn cine-btn-primary" disabled={dang_xu_ly === "tao-ca" || (ca_dang_sua_id ? dang_xu_ly === `ca-${ca_dang_sua_id}` : false)}>{ca_dang_sua_id ? "Lưu thay đổi" : "Tạo ca"}</button>
            {ca_dang_sua_id && <button type="button" className="cine-btn cine-btn-secondary" onClick={datLaiFormCa}>Hủy chỉnh sửa</button>}
          </div>
        </form>

        <div className="cine-shift-board">
          <div className="cine-card cine-shift-board-head"><div><span>Mẫu ca hiện có</span><b>{ca_lam.length} ca</b></div><small>Có thể sửa cả ca đã phân công; lịch đã xếp sẽ dùng ngay tên/giờ/màu mới. Xóa mẫu ca sẽ xóa luôn các phân ca liên quan.</small></div>
          {ca_lam.length === 0 && <div className="cine-card cine-empty-state">Chưa có mẫu ca làm việc.</div>}
          <div className="cine-shift-template-list cine-shift-template-list-v293">{ca_lam.map(c => <article key={c.id} className={`cine-card cine-shift-template-v293 ${ca_dang_sua_id === c.id ? "is-editing" : ""}`}>
            <i style={{background:c.mau_hien_thi || "#22C55E"}}/>
            <div className="cine-shift-template-main"><div><b>{c.ma_ca}</b><span>{c.ten_ca}</span></div><strong>{c.gio_bat_dau}–{c.gio_ket_thuc}</strong></div>
            <div className="cine-shift-template-meta"><span className={`status-badge ${c.dang_hoat_dong ? "active" : "locked"}`}>{c.dang_hoat_dong ? "Đang dùng" : "Ngừng dùng"}</span><small>{soPhanCaCuaCa.get(c.id) || 0} phân công</small></div>
            <div className="cine-shift-template-actions">
              <button type="button" className="cine-btn cine-btn-secondary" onClick={() => batDauSuaCa(c)} disabled={dang_xu_ly === `ca-${c.id}`}>Chỉnh sửa</button>
              <button type="button" className="cine-btn cine-btn-danger-outline" onClick={() => xoaCa(c)} disabled={dang_xu_ly === `ca-${c.id}`}>{dang_xu_ly === `ca-${c.id}` ? "Đang xử lý…" : "Xóa"}</button>
            </div>
          </article>)}</div>
        </div>
      </div>
    </section>}

    {tab === "xep-ca" && <section className="cine-admin-operations">
      <div className="cine-operations-heading">
        <div><h2>Xếp ca nhân viên</h2><p>Bố cục theo CineBooking Pro: form xếp ca bên trái, lịch theo ngày bên phải.</p></div>
        <button type="button" className="cine-btn cine-btn-secondary" onClick={() => setTab("ca-lam")}>Quản lý mẫu ca</button>
      </div>
      <div className="cine-shift-management-grid">
        <form className="cine-card cine-shift-editor" onSubmit={luuPhanCa}>
          <div className="cine-shift-editor-title"><div><h3>{pc_dang_sua_id ? "Chỉnh sửa phân ca" : "Xếp ca mới"}</h3><p>{pc_dang_sua_id ? "Có thể đổi nhân viên, ngày làm, mẫu ca và ghi chú của phân công đã tạo." : "Chọn nhân viên, ngày làm và mẫu ca."}</p></div></div>
          <label><span>Nhân viên</span><select value={pc.nhan_vien_id} onChange={e => setPc({...pc, nhan_vien_id:e.target.value})} required><option value="">Chọn nhân viên</option>{nhan_vien.filter(n => (n.nguoi_dung.da_kich_hoat && n.trang_thai === "DANG_LAM") || n.id === pc.nhan_vien_id).map(n => <option key={n.id} value={n.id}>{n.ma_nhan_vien} · {n.nguoi_dung.ho_ten} · {n.bo_phan}</option>)}</select></label>
          <label><span>Ngày làm</span><input type="date" value={pc.ngay_lam} onChange={e => setPc({...pc, ngay_lam:e.target.value})} required/></label>
          <label><span>Ca làm</span><select value={pc.ca_lam_viec_id} onChange={e => setPc({...pc, ca_lam_viec_id:e.target.value})} required><option value="">Chọn ca</option>{ca_lam.filter(c => c.dang_hoat_dong || c.id === pc.ca_lam_viec_id).map(c => <option key={c.id} value={c.id}>{c.ma_ca} · {c.ten_ca} · {c.gio_bat_dau}–{c.gio_ket_thuc}</option>)}</select></label>
          <label><span>Ghi chú</span><textarea value={pc.ghi_chu} onChange={e => setPc({...pc, ghi_chu:e.target.value})} placeholder="Khu vực làm việc, công việc ưu tiên..."/></label>
          <div className="cine-shift-help">Một nhân viên không thể nhận trùng cùng một mẫu ca trong cùng ngày. Tài khoản đã khóa không xuất hiện trong danh sách xếp ca.</div>
          <div className="cine-shift-form-actions">
            <button className="cine-btn cine-btn-primary" disabled={dang_xu_ly === "tao-phan-ca" || (pc_dang_sua_id ? dang_xu_ly === `pc-${pc_dang_sua_id}` : false)}>{pc_dang_sua_id ? "Lưu thay đổi" : "Xếp ca"}</button>
            {pc_dang_sua_id && <button type="button" className="cine-btn cine-btn-secondary" onClick={datLaiFormPhanCa}>Hủy chỉnh sửa</button>}
          </div>
        </form>

        <div className="cine-shift-board">
          <div className="cine-card cine-schedule-filter">
            <label><span>Từ ngày</span><input type="date" value={tu_ngay} onChange={e => setTuNgay(e.target.value)}/></label>
            <label><span>Đến ngày</span><input type="date" value={den_ngay} onChange={e => setDenNgay(e.target.value)}/></label>
            <div><span>Trong khoảng</span><b>{phanCaTrongKhoang.length} phân ca</b></div>
          </div>

          {phanCaTheoNgay.length === 0 && <div className="cine-card cine-empty-state">Chưa có ca làm trong khoảng ngày này.</div>}
          <div className="cine-schedule-groups">{phanCaTheoNgay.map(([ngay, danh_sach]) => <section key={ngay} className="cine-schedule-day">
            <h3>📅 {dinhDangNgay(ngay)}</h3>
            <div className="cine-schedule-day-list">{danh_sach.map(x => <article key={x.id} className="cine-card cine-schedule-row">
              <i style={{background:x.ca_lam_viec.mau_hien_thi || "#8b5cf6"}}/>
              <div className="cine-schedule-person"><b>{x.nhan_vien.ma_nhan_vien} · {x.nhan_vien.nguoi_dung.ho_ten}</b><span>{x.nhan_vien.bo_phan} · {x.nhan_vien.chuc_danh}</span>{x.ghi_chu && <small>{x.ghi_chu}</small>}</div>
              <div className="cine-schedule-shift"><b>{x.ca_lam_viec.ten_ca}</b><span>{x.ca_lam_viec.gio_bat_dau}–{x.ca_lam_viec.gio_ket_thuc}</span></div>
              <span className="status-badge active">{x.trang_thai.replaceAll("_", " ")}</span>
              <div className="cine-schedule-actions">
                <button type="button" className="cine-btn cine-btn-secondary" onClick={() => batDauSuaPhanCa(x)} disabled={dang_xu_ly === `pc-${x.id}`}>Chỉnh sửa</button>
                <button type="button" className="cine-btn cine-btn-danger-outline" onClick={() => huyPhanCa(x)} disabled={dang_xu_ly === `pc-${x.id}`}>{dang_xu_ly === `pc-${x.id}` ? "Đang xử lý…" : "Xóa"}</button>
              </div>
            </article>)}</div>
          </section>)}</div>
        </div>
      </div>
    </section>}
  </main>;
}
