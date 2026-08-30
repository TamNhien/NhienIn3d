"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { danhGiaMatKhau, TruongMatKhau } from "../../components/truong-mat-khau";
import { layTaiKhoan, TaiKhoan } from "../../lib/xac-thuc";
import {
  AdminNhanVien,
  AdminNguoiDung,
  AdminTongQuan,
  AdminDonHang,
  AdminDonHangChiTiet,
  AdminSanPham,
  NhatKyAdmin,
  CaLam,
  capNhatCaLam,
  capNhatNguoiDung,
  capNhatNhanVien,
  capNhatPhanCa,
  capNhatTrangThaiDonHangAdmin,
  capNhatSanPhamAdmin,
  capNhatTonKhoAdmin,
  kichHoatNguoiDung,
  khoaNguoiDung,
  layCaLam,
  layNhanVien,
  layNguoiDung,
  layPhanCa,
  layTongQuan,
  layDonHangAdmin,
  layChiTietDonHangAdmin,
  laySanPhamAdmin,
  layNhatKyAdmin,
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
const TRANG_THAI_DON = ["CHO_XAC_NHAN", "DA_XAC_NHAN", "DANG_SAN_XUAT", "DANG_GIAO", "HOAN_TAT", "DA_HUY"] as const;
const TRANG_THAI_TIEP_THEO: Record<string, string[]> = { CHO_XAC_NHAN: ["DA_XAC_NHAN", "DA_HUY"], DA_XAC_NHAN: ["DANG_SAN_XUAT", "DA_HUY"], DANG_SAN_XUAT: ["DANG_GIAO", "DA_HUY"], DANG_GIAO: ["HOAN_TAT"], HOAN_TAT: [], DA_HUY: [] };
const nhanSuKienAudit = (loai: string) => ({
  ADMIN_CAP_NHAT_NGUOI_DUNG: "Cập nhật khách hàng", ADMIN_KICH_HOAT_NGUOI_DUNG: "Kích hoạt tài khoản", ADMIN_KHOA_NGUOI_DUNG: "Khóa tài khoản", ADMIN_XOA_NGUOI_DUNG: "Xóa tài khoản",
  ADMIN_TAO_NHAN_VIEN: "Tạo nhân viên", ADMIN_CAP_NHAT_NHAN_VIEN: "Cập nhật nhân viên", ADMIN_TAO_CA_LAM: "Tạo ca", ADMIN_CAP_NHAT_CA_LAM: "Cập nhật ca", ADMIN_XOA_CA_LAM: "Xóa ca",
  ADMIN_TAO_PHAN_CA: "Tạo phân ca", ADMIN_CAP_NHAT_PHAN_CA: "Cập nhật phân ca", ADMIN_XOA_PHAN_CA: "Xóa phân ca", ADMIN_CAP_NHAT_DON_HANG: "Cập nhật đơn hàng",
  ADMIN_CAP_NHAT_SAN_PHAM: "Cập nhật sản phẩm", ADMIN_CAP_NHAT_TON_KHO: "Cập nhật tồn kho"
}[loai] || loai.replaceAll("_", " "));

type TabQuanTri = "tong-quan" | "don-hang" | "san-pham" | "khach-hang" | "nhan-vien" | "tao-nhan-vien" | "ca-lam" | "xep-ca" | "nhat-ky";

export default function QuanTriPage() {
  const [tai_khoan, setTaiKhoan] = useState<TaiKhoan | null | undefined>(undefined);
  const [tong_quan, setTongQuan] = useState<AdminTongQuan | null>(null);
  const [nguoi_dung, setNguoiDung] = useState<AdminNguoiDung[]>([]);
  const [nhan_vien, setNhanVien] = useState<AdminNhanVien[]>([]);
  const [ca_lam, setCaLam] = useState<CaLam[]>([]);
  const [phan_ca, setPhanCa] = useState<PhanCa[]>([]);
  const [don_hang, setDonHang] = useState<AdminDonHang[]>([]);
  const [don_chon, setDonChon] = useState<AdminDonHangChiTiet | null>(null);
  const [san_pham_qt, setSanPhamQt] = useState<AdminSanPham[]>([]);
  const [nhat_ky, setNhatKy] = useState<NhatKyAdmin[]>([]);
  const [thong_bao, setThongBao] = useState("");
  const [tab, setTab] = useState<TabQuanTri>("tong-quan");
  const [dang_xu_ly, setDangXuLy] = useState<string | null>(null);
  const [tu_ngay, setTuNgay] = useState(homNay());
  const [den_ngay, setDenNgay] = useState(sauNgay(14));
  const [don_tim_kiem, setDonTimKiem] = useState("");
  const [don_loc_trang_thai, setDonLocTrangThai] = useState("");
  const [don_trang_thai_moi, setDonTrangThaiMoi] = useState("");
  const [don_ghi_chu, setDonGhiChu] = useState("");
  const [san_pham_tim_kiem, setSanPhamTimKiem] = useState("");
  const [san_pham_chon_id, setSanPhamChonId] = useState("");
  const [nhat_ky_tim_kiem, setNhatKyTimKiem] = useState("");

  const [nv, setNv] = useState({ thu_dien_tu: "", ho_ten: "", so_dien_thoai: "", mat_khau: "", xac_nhan_mat_khau: "", ma_nhan_vien: "", ngay_vao_lam: homNay() });
  const [ca, setCa] = useState({ ma_ca: "", ten_ca: "", gio_bat_dau: "06:00", gio_ket_thuc: "14:00", mau_hien_thi: "#38BDF8" });
  const [ca_dang_sua_id, setCaDangSuaId] = useState<string | null>(null);
  const [pc, setPc] = useState({ nhan_vien_id: "", ca_lam_viec_id: "", ngay_lam: homNay(), ghi_chu: "" });
  const [pc_dang_sua_id, setPcDangSuaId] = useState<string | null>(null);

  const taiDuLieu = useCallback(async () => {
    const tk = await layTaiKhoan();
    setTaiKhoan(tk);
    if (!tk || tk.vai_tro !== "ADMIN") return;
    const [tq, nd, nvData, caData, pcData, donData, spData, nkData] = await Promise.all([layTongQuan(), layNguoiDung(), layNhanVien(), layCaLam(), layPhanCa(), layDonHangAdmin(), laySanPhamAdmin(), layNhatKyAdmin()]);
    setTongQuan(tq);
    setNguoiDung(nd);
    setNhanVien(nvData);
    setCaLam(caData);
    setPhanCa(pcData);
    setDonHang(donData);
    setSanPhamQt(spData);
    setNhatKy(nkData);
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

  async function taiDonTheoBoLoc() {
    setDangXuLy("loc-don");
    setThongBao("");
    try {
      const ds = await layDonHangAdmin(don_loc_trang_thai, don_tim_kiem);
      setDonHang(ds);
      if (don_chon && !ds.some(x => x.id === don_chon.id)) setDonChon(null);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể lọc đơn hàng"); }
    finally { setDangXuLy(null); }
  }

  async function moChiTietDon(id: string) {
    setDangXuLy(`don-xem-${id}`);
    setThongBao("");
    try {
      const ct = await layChiTietDonHangAdmin(id);
      setDonChon(ct);
      setDonTrangThaiMoi(ct.trang_thai);
      setDonGhiChu("");
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể tải chi tiết đơn hàng"); }
    finally { setDangXuLy(null); }
  }

  async function luuTrangThaiDon() {
    if (!don_chon || !don_trang_thai_moi) return;
    setDangXuLy(`don-${don_chon.id}`);
    setThongBao("");
    try {
      const da_luu = await capNhatTrangThaiDonHangAdmin(don_chon.id, { trang_thai: don_trang_thai_moi, ghi_chu: don_ghi_chu.trim() || undefined });
      setDonChon(da_luu);
      setDonTrangThaiMoi(da_luu.trang_thai);
      setDonGhiChu("");
      const [ds, tq, sp, nk] = await Promise.all([layDonHangAdmin(don_loc_trang_thai, don_tim_kiem), layTongQuan(), laySanPhamAdmin(), layNhatKyAdmin()]);
      setDonHang(ds); setTongQuan(tq); setSanPhamQt(sp); setNhatKy(nk);
      setThongBao(`Đã cập nhật ${da_luu.ma_don_hang} → ${nhanTrangThaiDon(da_luu.trang_thai)}.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể cập nhật trạng thái đơn hàng"); }
    finally { setDangXuLy(null); }
  }

  function suaSanPhamLocal(id: string, patch: Partial<AdminSanPham>) {
    setSanPhamQt(ds => ds.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  function suaBienTheLocal(san_pham_id: string, bien_the_id: string, patch: { so_luong_ton?: number; dang_hien_thi?: boolean }) {
    setSanPhamQt(ds => ds.map(sp => sp.id === san_pham_id ? { ...sp, bien_the: sp.bien_the.map(bt => bt.id === bien_the_id ? { ...bt, ...patch } : bt) } : sp));
  }

  async function luuSanPham(item: AdminSanPham) {
    setDangXuLy(`sp-${item.id}`); setThongBao("");
    try {
      await capNhatSanPhamAdmin(item.id, { ten_san_pham: item.ten_san_pham.trim(), mo_ta_ngan: item.mo_ta_ngan?.trim() || "", gia_ban: Number(item.gia_ban), trang_thai: item.trang_thai });
      const [ds, tq, nk] = await Promise.all([laySanPhamAdmin(), layTongQuan(), layNhatKyAdmin()]);
      setSanPhamQt(ds); setTongQuan(tq); setNhatKy(nk);
      setThongBao(`Đã lưu sản phẩm ${item.ma_san_pham}.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể cập nhật sản phẩm"); }
    finally { setDangXuLy(null); }
  }

  async function luuTonKho(san_pham_id: string, bien_the_id: string) {
    const sp = san_pham_qt.find(x => x.id === san_pham_id);
    const bt = sp?.bien_the.find(x => x.id === bien_the_id);
    if (!bt) return;
    setDangXuLy(`kho-${bien_the_id}`); setThongBao("");
    try {
      await capNhatTonKhoAdmin(bien_the_id, { so_luong_ton: Number(bt.so_luong_ton), dang_hien_thi: bt.dang_hien_thi });
      const [ds, tq, nk] = await Promise.all([laySanPhamAdmin(), layTongQuan(), layNhatKyAdmin()]);
      setSanPhamQt(ds); setTongQuan(tq); setNhatKy(nk);
      setThongBao(`Đã lưu tồn kho ${bt.ma_bien_the}: ${bt.so_luong_ton}.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể cập nhật tồn kho"); }
    finally { setDangXuLy(null); }
  }

  const soPhanCaCuaCa = useMemo(() => {
    const dem = new Map<string, number>();
    for (const item of phan_ca) dem.set(item.ca_lam_viec.id, (dem.get(item.ca_lam_viec.id) || 0) + 1);
    return dem;
  }, [phan_ca]);

  const khachHang = useMemo(() => nguoi_dung.filter(x => x.vai_tro === "KHACH_HANG"), [nguoi_dung]);
  const sanPhamDaLoc = useMemo(() => { const q = san_pham_tim_kiem.trim().toLocaleLowerCase("vi"); return q ? san_pham_qt.filter(x => `${x.ma_san_pham} ${x.ten_san_pham} ${x.danh_muc.ten_danh_muc}`.toLocaleLowerCase("vi").includes(q)) : san_pham_qt; }, [san_pham_qt, san_pham_tim_kiem]);
  const sanPhamDangChon = useMemo(() => sanPhamDaLoc.find(x => x.id === san_pham_chon_id) || sanPhamDaLoc[0] || null, [sanPhamDaLoc, san_pham_chon_id]);
  const nhatKyDaLoc = useMemo(() => { const q = nhat_ky_tim_kiem.trim().toLocaleLowerCase("vi"); return q ? nhat_ky.filter(x => `${x.loai_su_kien} ${x.nguoi_thuc_hien?.ho_ten || ""} ${x.nguoi_thuc_hien?.thu_dien_tu || ""} ${JSON.stringify(x.chi_tiet)}`.toLocaleLowerCase("vi").includes(q)) : nhat_ky; }, [nhat_ky, nhat_ky_tim_kiem]);

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
    ["don-hang", "Đơn hàng"],
    ["san-pham", "Sản phẩm & kho"],
    ["khach-hang", "Khách hàng"],
    ["nhan-vien", "Nhân viên bán hàng"],
    ["tao-nhan-vien", "Tạo nhân viên bán hàng"],
    ["ca-lam", "Ca làm"],
    ["xep-ca", "Xếp ca"],
    ["nhat-ky", "Nhật ký Admin"]
  ];

  return <main className="cine-admin-shell page-shell">
    <div className="cine-admin-heading">
      <div><h1>Admin Dashboard</h1><p>Admin có toàn quyền hệ thống: quản trị đơn hàng, sản phẩm, tồn kho, khách hàng, nhân sự và lịch làm việc.</p></div>
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

    {tab === "don-hang" && <section className="cine-admin-operations cine-commerce-admin-v212">
      <div className="cine-operations-heading"><div><h2>Quản trị đơn hàng</h2><p>Tìm kiếm, xem chi tiết, cập nhật trạng thái và theo dõi lịch sử xử lý.</p></div><span className="cine-admin-count">{don_hang.length} đơn</span></div>
      <div className="cine-card cine-admin-filterbar-v212">
        <label><span>Tìm đơn hàng</span><input value={don_tim_kiem} onChange={e => setDonTimKiem(e.target.value)} placeholder="Mã đơn, người nhận, SĐT, email..."/></label>
        <label><span>Trạng thái</span><select value={don_loc_trang_thai} onChange={e => setDonLocTrangThai(e.target.value)}><option value="">Tất cả trạng thái</option>{TRANG_THAI_DON.map(x => <option key={x} value={x}>{nhanTrangThaiDon(x)}</option>)}</select></label>
        <button type="button" className="cine-btn cine-btn-primary" onClick={taiDonTheoBoLoc} disabled={dang_xu_ly === "loc-don"}>{dang_xu_ly === "loc-don" ? "Đang lọc…" : "Lọc đơn"}</button>
      </div>
      <div className="cine-order-admin-grid-v212">
        <div className="cine-card cine-order-admin-list-v212">
          <div className="cine-section-heading"><div><h3>Danh sách đơn</h3><p>Đơn mới nhất hiển thị trước.</p></div></div>
          <div className="cine-order-admin-items-v212">{don_hang.map(item => <button type="button" key={item.id} className={`cine-order-admin-item-v212 ${don_chon?.id === item.id ? "is-active" : ""}`} onClick={() => moChiTietDon(item.id)}>
            <span><b>{item.ma_don_hang}</b><small>{item.ho_ten_nguoi_nhan} · {item.so_dien_thoai}</small></span>
            <span><b>{dinhDangTien(item.tong_tien)}</b><small>{item.tong_so_luong} SP · {new Date(item.ngay_tao).toLocaleString("vi-VN")}</small></span>
            <i className="cine-order-state" data-status={item.trang_thai}>{nhanTrangThaiDon(item.trang_thai)}</i>
          </button>)}{don_hang.length === 0 && <div className="cine-dashboard-empty">Không có đơn phù hợp bộ lọc.</div>}</div>
        </div>
        <div className="cine-card cine-order-detail-v212">
          {!don_chon ? <div className="cine-order-detail-empty-v212"><b>Chọn một đơn hàng</b><p>Chi tiết người nhận, sản phẩm, thanh toán và lịch sử trạng thái sẽ hiển thị tại đây.</p></div> : <>
            <div className="cine-order-detail-head-v212"><div><span>Mã đơn</span><h3>{don_chon.ma_don_hang}</h3><small>{new Date(don_chon.ngay_tao).toLocaleString("vi-VN")}</small></div><strong>{dinhDangTien(don_chon.tong_tien)}</strong></div>
            <div className="cine-order-recipient-v212"><div><span>Người nhận</span><b>{don_chon.ho_ten_nguoi_nhan}</b><small>{don_chon.so_dien_thoai}</small></div><div><span>Địa chỉ giao hàng</span><b>{don_chon.dia_chi_giao_hang}</b>{don_chon.khach_hang?.thu_dien_tu && <small>{don_chon.khach_hang.thu_dien_tu}</small>}</div></div>
            <div className="cine-order-lines-v212"><h4>Sản phẩm</h4>{don_chon.chi_tiet.map(ct => <div className="cine-order-line-v212" key={ct.id}><span><b>{ct.ten_san_pham}</b><small>{ct.ma_san_pham} · {String(ct.tuy_chon?.ma_bien_the || "Cấu hình mặc định")}</small></span><span>{ct.so_luong} × {dinhDangTien(ct.don_gia)}</span><strong>{dinhDangTien(ct.thanh_tien)}</strong></div>)}</div>
            <div className="cine-order-update-v212"><h4>Cập nhật trạng thái</h4><div className="cine-order-update-fields-v212"><label><span>Trạng thái mới</span><select value={don_trang_thai_moi} onChange={e => setDonTrangThaiMoi(e.target.value)}><option value={don_chon.trang_thai}>{nhanTrangThaiDon(don_chon.trang_thai)} (hiện tại)</option>{(TRANG_THAI_TIEP_THEO[don_chon.trang_thai] || []).map(x => <option key={x} value={x}>{nhanTrangThaiDon(x)}</option>)}</select></label><label><span>Ghi chú xử lý</span><input value={don_ghi_chu} onChange={e => setDonGhiChu(e.target.value)} placeholder="VD: Đã xác nhận với khách hàng"/></label></div><button type="button" className="cine-btn cine-btn-primary" onClick={luuTrangThaiDon} disabled={dang_xu_ly === `don-${don_chon.id}` || don_trang_thai_moi === don_chon.trang_thai}>{dang_xu_ly === `don-${don_chon.id}` ? "Đang lưu…" : "Lưu trạng thái"}</button>{TRANG_THAI_TIEP_THEO[don_chon.trang_thai]?.length === 0 && <small className="cine-terminal-note-v212">Đơn đã ở trạng thái kết thúc, không chuyển tiếp.</small>}</div>
            <div className="cine-order-history-v212"><h4>Lịch sử xử lý</h4>{don_chon.lich_su.map(ls => <div key={ls.id} className="cine-order-history-item-v212"><i/><span><b>{nhanTrangThaiDon(ls.trang_thai_moi)}</b><small>{new Date(ls.ngay_tao).toLocaleString("vi-VN")} · {ls.nguoi_thuc_hien?.ho_ten || "Hệ thống/khách hàng"}</small>{ls.ghi_chu && <em>{ls.ghi_chu}</em>}</span></div>)}</div>
          </>}
        </div>
      </div>
    </section>}

    {tab === "san-pham" && <section className="cine-admin-operations cine-commerce-admin-v212">
      <div className="cine-operations-heading"><div><h2>Sản phẩm & tồn kho</h2><p>Chọn một sản phẩm từ danh sách xổ xuống rồi chỉnh thông tin và tồn kho, không mở đồng thời toàn bộ sản phẩm.</p></div><span className="cine-admin-count">{san_pham_qt.length} sản phẩm</span></div>
      <div className="cine-card cine-product-filter-v212 cine-product-picker-v2121">
        <label><span>Tìm sản phẩm</span><input value={san_pham_tim_kiem} onChange={e => setSanPhamTimKiem(e.target.value)} placeholder="Mã, tên hoặc danh mục..."/></label>
        <label><span>Chọn sản phẩm</span><select value={sanPhamDangChon?.id || ""} onChange={e => setSanPhamChonId(e.target.value)} disabled={sanPhamDaLoc.length === 0}><option value="" disabled>{sanPhamDaLoc.length ? "Chọn sản phẩm cần chỉnh" : "Không có sản phẩm phù hợp"}</option>{sanPhamDaLoc.map(sp => <option key={sp.id} value={sp.id}>{sp.ma_san_pham} · {sp.ten_san_pham} · {sp.danh_muc.ten_danh_muc}</option>)}</select></label>
        <div><b>{sanPhamDaLoc.length}</b><span>kết quả</span></div>
      </div>
      {sanPhamDangChon ? <div className="cine-product-admin-list-v212 cine-product-single-v2121"><article className="cine-card cine-product-admin-card-v212" key={sanPhamDangChon.id}>
        <div className="cine-product-admin-head-v212"><div><span>{sanPhamDangChon.ma_san_pham} · {sanPhamDangChon.danh_muc.ten_danh_muc}</span><h3>{sanPhamDangChon.ten_san_pham}</h3></div><span className="cine-order-state" data-status={sanPhamDangChon.trang_thai}>{sanPhamDangChon.trang_thai.replaceAll("_", " ")}</span></div>
        <div className="cine-product-form-v212"><label><span>Tên sản phẩm</span><input value={sanPhamDangChon.ten_san_pham} onChange={e => suaSanPhamLocal(sanPhamDangChon.id, { ten_san_pham: e.target.value })}/></label><label><span>Giá bán</span><input type="number" min="0" step="1000" value={sanPhamDangChon.gia_ban} onChange={e => suaSanPhamLocal(sanPhamDangChon.id, { gia_ban: Number(e.target.value) })}/></label><label><span>Trạng thái</span><select value={sanPhamDangChon.trang_thai} onChange={e => suaSanPhamLocal(sanPhamDangChon.id, { trang_thai: e.target.value })}><option value="NHAP">Nháp</option><option value="DANG_BAN">Đang bán</option><option value="TAM_AN">Tạm ẩn</option><option value="NGUNG_BAN">Ngừng bán</option></select></label><label className="wide"><span>Mô tả ngắn</span><textarea value={sanPhamDangChon.mo_ta_ngan || ""} onChange={e => suaSanPhamLocal(sanPhamDangChon.id, { mo_ta_ngan: e.target.value })}/></label></div>
        <button type="button" className="cine-btn cine-btn-primary" onClick={() => luuSanPham(sanPhamDangChon)} disabled={dang_xu_ly === `sp-${sanPhamDangChon.id}`}>{dang_xu_ly === `sp-${sanPhamDangChon.id}` ? "Đang lưu…" : "Lưu sản phẩm"}</button>
        <div className="cine-variant-table-v212"><div className="cine-variant-head-v212"><span>Biến thể</span><span>Vật liệu / màu</span><span>Tồn kho</span><span>Hiển thị</span><span>Thao tác</span></div>{sanPhamDangChon.bien_the.map(bt => <div className="cine-variant-row-v212" key={bt.id}><b>{bt.ma_bien_the}</b><span>{bt.vat_lieu?.ten_vat_lieu || "Mặc định"} · {bt.mau_sac?.ten_mau || "Mặc định"}</span><input type="number" min="0" max="1000000" value={bt.so_luong_ton} onChange={e => suaBienTheLocal(sanPhamDangChon.id, bt.id, { so_luong_ton: Math.max(0, Number(e.target.value)) })}/><label className="cine-stock-toggle-v212"><input type="checkbox" checked={bt.dang_hien_thi} onChange={e => suaBienTheLocal(sanPhamDangChon.id, bt.id, { dang_hien_thi: e.target.checked })}/><span>{bt.dang_hien_thi ? "Đang hiện" : "Đang ẩn"}</span></label><button type="button" className="cine-btn cine-btn-secondary" onClick={() => luuTonKho(sanPhamDangChon.id, bt.id)} disabled={dang_xu_ly === `kho-${bt.id}`}>{dang_xu_ly === `kho-${bt.id}` ? "Đang lưu…" : "Lưu kho"}</button></div>)}</div>
      </article></div> : <div className="cine-card cine-dashboard-empty cine-product-empty-v2121">Không có sản phẩm phù hợp bộ lọc.</div>}
    </section>}

    {tab === "nhat-ky" && <section className="cine-admin-operations cine-commerce-admin-v212">
      <div className="cine-operations-heading"><div><h2>Nhật ký thao tác Admin</h2><p>200 sự kiện quản trị gần nhất trên khách hàng, nhân viên, ca làm, phân ca, đơn hàng, sản phẩm và tồn kho.</p></div><span className="cine-admin-count">{nhat_ky.length} sự kiện</span></div>
      <div className="cine-card cine-product-filter-v212"><label><span>Tìm trong nhật ký</span><input value={nhat_ky_tim_kiem} onChange={e => setNhatKyTimKiem(e.target.value)} placeholder="Loại thao tác, Admin hoặc nội dung..."/></label><div><b>{nhatKyDaLoc.length}</b><span>kết quả</span></div></div>
      <div className="cine-card cine-audit-list-v212">{nhatKyDaLoc.map(item => <article className="cine-audit-row-v212" key={item.id}><i/><div><b>{nhanSuKienAudit(item.loai_su_kien)}</b><span>{item.nguoi_thuc_hien?.ho_ten || "Admin/hệ thống"} · {new Date(item.ngay_tao).toLocaleString("vi-VN")}</span><code>{JSON.stringify(item.chi_tiet)}</code></div></article>)}{nhatKyDaLoc.length === 0 && <div className="cine-dashboard-empty">Không có sự kiện phù hợp.</div>}</div>
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
