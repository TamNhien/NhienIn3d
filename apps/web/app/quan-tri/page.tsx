"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ThanhDieuHuong } from "../../components/thanh-dieu-huong";
import { danhGiaMatKhau, TruongMatKhau } from "../../components/truong-mat-khau";
import { layTaiKhoan, TaiKhoan, tenVaiTro } from "../../lib/xac-thuc";
import { AdminNhanVien, AdminNguoiDung, CaLam, capNhatNhanVien, capNhatNguoiDung, layCaLam, layNhanVien, layNguoiDung, layPhanCa, layTongQuan, PhanCa, taoCaLam, taoNhanVien, taoPhanCa, xoaPhanCa } from "../../lib/quan-tri";

const homNay = () => new Date().toISOString().slice(0, 10);

export default function QuanTriPage() {
  const [tai_khoan, setTaiKhoan] = useState<TaiKhoan | null | undefined>(undefined);
  const [tong_quan, setTongQuan] = useState<Record<string, number>>({});
  const [nguoi_dung, setNguoiDung] = useState<AdminNguoiDung[]>([]);
  const [nhan_vien, setNhanVien] = useState<AdminNhanVien[]>([]);
  const [ca_lam, setCaLam] = useState<CaLam[]>([]);
  const [phan_ca, setPhanCa] = useState<PhanCa[]>([]);
  const [thong_bao, setThongBao] = useState("");

  const [nv, setNv] = useState({ thu_dien_tu: "", ho_ten: "", so_dien_thoai: "", mat_khau: "", vai_tro: "NHAN_VIEN", ma_nhan_vien: "", chuc_danh: "Kỹ thuật in 3D", bo_phan: "Sản xuất", ngay_vao_lam: homNay() });
  const [ca, setCa] = useState({ ma_ca: "", ten_ca: "", gio_bat_dau: "08:00", gio_ket_thuc: "17:00", mau_hien_thi: "#22C55E" });
  const [pc, setPc] = useState({ nhan_vien_id: "", ca_lam_viec_id: "", ngay_lam: homNay(), ghi_chu: "" });

  const taiDuLieu = useCallback(async () => {
    const tk = await layTaiKhoan(); setTaiKhoan(tk);
    if (!tk || !["QUAN_TRI", "SIEU_QUAN_TRI"].includes(tk.vai_tro)) return;
    const [tq, nd, nvData, caData, pcData] = await Promise.all([layTongQuan(), layNguoiDung(), layNhanVien(), layCaLam(), layPhanCa()]);
    setTongQuan(tq); setNguoiDung(nd); setNhanVien(nvData); setCaLam(caData); setPhanCa(pcData);
    setPc(x => ({ ...x, nhan_vien_id: x.nhan_vien_id || nvData[0]?.id || "", ca_lam_viec_id: x.ca_lam_viec_id || caData[0]?.id || "" }));
  }, []);

  useEffect(() => { taiDuLieu().catch(e => { setThongBao(e instanceof Error ? e.message : "Không thể tải dữ liệu quản trị"); }); }, [taiDuLieu]);

  async function doiVaiTro(user: AdminNguoiDung, vai_tro: AdminNguoiDung["vai_tro"]) {
    try { await capNhatNguoiDung(user.id, { vai_tro }); setThongBao(`Đã đổi vai trò ${user.ho_ten}.`); await taiDuLieu(); }
    catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể đổi vai trò"); }
  }
  async function doiTrangThai(user: AdminNguoiDung) {
    try { await capNhatNguoiDung(user.id, { da_kich_hoat: !user.da_kich_hoat }); setThongBao(`Đã cập nhật trạng thái ${user.ho_ten}.`); await taiDuLieu(); }
    catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể cập nhật tài khoản"); }
  }
  async function taoNV(e: FormEvent) {
    e.preventDefault();
    if (!danhGiaMatKhau(nv.mat_khau).hop_le) { setThongBao("Mật khẩu nhân viên phải có ít nhất 12 ký tự, chữ hoa, chữ thường, số và ký tự đặc biệt."); return; }
    try { await taoNhanVien(nv); setThongBao("Đã tạo tài khoản nhân viên."); setNv(x => ({ ...x, thu_dien_tu: "", ho_ten: "", so_dien_thoai: "", mat_khau: "", ma_nhan_vien: "" })); await taiDuLieu(); }
    catch (err) { setThongBao(err instanceof Error ? err.message : "Không thể tạo nhân viên"); }
  }
  function suaNhanVienLocal(id: string, patch: Partial<AdminNhanVien>) {
    setNhanVien(ds => ds.map(x => x.id === id ? { ...x, ...patch } : x));
  }
  async function luuNhanVien(item: AdminNhanVien) {
    try {
      await capNhatNhanVien(item.id, { chuc_danh: item.chuc_danh, bo_phan: item.bo_phan, trang_thai: item.trang_thai });
      setThongBao(`Đã cập nhật nhân viên ${item.ma_nhan_vien}.`);
      await taiDuLieu();
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể cập nhật nhân viên"); }
  }
  async function taoCa(e: FormEvent) {
    e.preventDefault(); try { await taoCaLam(ca); setThongBao("Đã tạo ca làm việc."); setCa(x => ({ ...x, ma_ca: "", ten_ca: "" })); await taiDuLieu(); }
    catch (err) { setThongBao(err instanceof Error ? err.message : "Không thể tạo ca"); }
  }
  async function xepCa(e: FormEvent) {
    e.preventDefault(); try { await taoPhanCa(pc); setThongBao("Đã xếp ca cho nhân viên."); setPc(x => ({ ...x, ghi_chu: "" })); await taiDuLieu(); }
    catch (err) { setThongBao(err instanceof Error ? err.message : "Không thể xếp ca"); }
  }

  if (tai_khoan === undefined) return <><ThanhDieuHuong/><main className="auth-shell"><div className="auth-card"><p>Đang xác minh quyền quản trị...</p></div></main></>;
  if (!tai_khoan) return <><ThanhDieuHuong/><main className="auth-shell"><section className="auth-card"><h1>Cần đăng nhập</h1><Link className="primary auth-primary-link" href="/dang-nhap?chuyen_den=/quan-tri">Đăng nhập</Link></section></main></>;
  if (!["QUAN_TRI", "SIEU_QUAN_TRI"].includes(tai_khoan.vai_tro)) return <><ThanhDieuHuong/><main className="auth-shell"><section className="auth-card"><h1>Không có quyền truy cập</h1><p>Khu vực này chỉ dành cho Quản trị và Siêu quản trị.</p><Link className="primary auth-primary-link" href="/tai-khoan">Về tài khoản</Link></section></main></>;

  return <>
    <ThanhDieuHuong/>
    <main className="admin-shell page-shell">
      <div className="admin-heading"><div><div className="eyebrow">QUẢN TRỊ HỆ THỐNG</div><h1>Điều hành NhienIn3d</h1><p>{tai_khoan.ho_ten} · {tenVaiTro(tai_khoan.vai_tro)}</p></div><Link className="secondary" href="/tai-khoan">Tài khoản của tôi</Link></div>
      {thong_bao && <div className="inline-message admin-message">{thong_bao}</div>}

      <section className="admin-stats">{Object.entries(tong_quan).map(([k,v]) => <article key={k}><span>{k.replaceAll("_", " ")}</span><b>{v}</b></article>)}</section>

      <section className="admin-panel">
        <div className="panel-heading"><div><div className="eyebrow">PHÂN QUYỀN</div><h2>Người dùng & quyền hệ thống</h2></div><span>Admin quản lý vai trò và trạng thái tài khoản.</span></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Tài khoản</th><th>Vai trò</th><th>Trạng thái</th><th>Nhân viên</th></tr></thead><tbody>{nguoi_dung.map(u => <tr key={u.id}><td><b>{u.ho_ten}</b><small>{u.thu_dien_tu}<br/>{u.so_dien_thoai || "Chưa có SĐT"}</small></td><td><select value={u.vai_tro} onChange={e => doiVaiTro(u, e.target.value as AdminNguoiDung["vai_tro"])} disabled={u.vai_tro === "SIEU_QUAN_TRI" && tai_khoan.vai_tro !== "SIEU_QUAN_TRI"}><option value="KHACH_HANG">Khách hàng</option><option value="NHAN_VIEN">Nhân viên</option><option value="QUAN_LY">Quản lý</option><option value="QUAN_TRI">Quản trị</option>{tai_khoan.vai_tro === "SIEU_QUAN_TRI" && <option value="SIEU_QUAN_TRI">Siêu quản trị</option>}</select></td><td><button className={u.da_kich_hoat ? "status-button active" : "status-button"} onClick={() => doiTrangThai(u)}>{u.da_kich_hoat ? "Đang hoạt động" : "Đã khóa"}</button></td><td>{u.nhan_vien ? <><b>{u.nhan_vien.ma_nhan_vien}</b><small>{u.nhan_vien.bo_phan}</small></> : "—"}</td></tr>)}</tbody></table></div>
      </section>

      <section className="admin-panel">
        <div className="panel-heading"><div><div className="eyebrow">NHÂN VIÊN</div><h2>Hồ sơ nhân sự</h2></div><span>Admin có thể sửa chức danh, bộ phận và trạng thái làm việc.</span></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nhân viên</th><th>Chức danh</th><th>Bộ phận</th><th>Trạng thái</th><th></th></tr></thead><tbody>{nhan_vien.map(n => <tr key={n.id}><td><b>{n.ma_nhan_vien}</b><small>{n.nguoi_dung.ho_ten}<br/>{n.nguoi_dung.thu_dien_tu}</small></td><td><input value={n.chuc_danh} onChange={e=>suaNhanVienLocal(n.id,{chuc_danh:e.target.value})}/></td><td><input value={n.bo_phan} onChange={e=>suaNhanVienLocal(n.id,{bo_phan:e.target.value})}/></td><td><select value={n.trang_thai} onChange={e=>suaNhanVienLocal(n.id,{trang_thai:e.target.value})}><option value="DANG_LAM">Đang làm</option><option value="TAM_NGHI">Tạm nghỉ</option><option value="NGHI_VIEC">Nghỉ việc</option></select></td><td><button className="secondary secondary-button" onClick={()=>luuNhanVien(n)}>Lưu</button></td></tr>)}</tbody></table></div>
      </section>

      <div className="admin-two-col">
        <section className="admin-panel"><div className="panel-heading"><div><div className="eyebrow">NHÂN SỰ</div><h2>Tạo tài khoản nhân viên</h2></div></div><form className="admin-form" onSubmit={taoNV}>
          <input placeholder="Email" type="email" value={nv.thu_dien_tu} onChange={e=>setNv({...nv,thu_dien_tu:e.target.value})} required/>
          <input placeholder="Họ tên" value={nv.ho_ten} onChange={e=>setNv({...nv,ho_ten:e.target.value})} required/>
          <input placeholder="Số điện thoại" value={nv.so_dien_thoai} onChange={e=>setNv({...nv,so_dien_thoai:e.target.value})}/>
          <TruongMatKhau nhan="Mật khẩu ban đầu" gia_tri={nv.mat_khau} datGiaTri={mat_khau => setNv({...nv,mat_khau})} autoComplete="new-password" hien_do_manh />
          <select value={nv.vai_tro} onChange={e=>setNv({...nv,vai_tro:e.target.value})}><option value="NHAN_VIEN">Nhân viên</option><option value="QUAN_LY">Quản lý</option><option value="QUAN_TRI">Quản trị</option></select>
          <input placeholder="Mã nhân viên, VD N3D-NV-011" value={nv.ma_nhan_vien} onChange={e=>setNv({...nv,ma_nhan_vien:e.target.value})} required/>
          <input placeholder="Chức danh" value={nv.chuc_danh} onChange={e=>setNv({...nv,chuc_danh:e.target.value})} required/>
          <input placeholder="Bộ phận" value={nv.bo_phan} onChange={e=>setNv({...nv,bo_phan:e.target.value})} required/>
          <input type="date" value={nv.ngay_vao_lam} onChange={e=>setNv({...nv,ngay_vao_lam:e.target.value})} required/>
          <button className="checkout-button">Tạo nhân viên</button>
        </form></section>

        <section className="admin-panel"><div className="panel-heading"><div><div className="eyebrow">CA LÀM</div><h2>Tạo mẫu ca mới</h2></div></div><form className="admin-form" onSubmit={taoCa}>
          <input placeholder="Mã ca" value={ca.ma_ca} onChange={e=>setCa({...ca,ma_ca:e.target.value})} required/>
          <input placeholder="Tên ca" value={ca.ten_ca} onChange={e=>setCa({...ca,ten_ca:e.target.value})} required/>
          <label><span>Bắt đầu</span><input type="time" value={ca.gio_bat_dau} onChange={e=>setCa({...ca,gio_bat_dau:e.target.value})} required/></label>
          <label><span>Kết thúc</span><input type="time" value={ca.gio_ket_thuc} onChange={e=>setCa({...ca,gio_ket_thuc:e.target.value})} required/></label>
          <label><span>Màu lịch</span><input type="color" value={ca.mau_hien_thi} onChange={e=>setCa({...ca,mau_hien_thi:e.target.value})}/></label>
          <button className="checkout-button">Tạo ca</button>
        </form></section>
      </div>

      <section className="admin-panel">
        <div className="panel-heading"><div><div className="eyebrow">XẾP CA</div><h2>Lịch làm việc nhân viên</h2></div><span>{phan_ca.length} phân ca</span></div>
        <form className="schedule-form" onSubmit={xepCa}><select value={pc.nhan_vien_id} onChange={e=>setPc({...pc,nhan_vien_id:e.target.value})} required>{nhan_vien.map(n => <option key={n.id} value={n.id}>{n.ma_nhan_vien} · {n.nguoi_dung.ho_ten}</option>)}</select><select value={pc.ca_lam_viec_id} onChange={e=>setPc({...pc,ca_lam_viec_id:e.target.value})} required>{ca_lam.map(c => <option key={c.id} value={c.id}>{c.ma_ca} · {c.ten_ca} ({c.gio_bat_dau}-{c.gio_ket_thuc})</option>)}</select><input type="date" value={pc.ngay_lam} onChange={e=>setPc({...pc,ngay_lam:e.target.value})} required/><input placeholder="Ghi chú" value={pc.ghi_chu} onChange={e=>setPc({...pc,ghi_chu:e.target.value})}/><button className="checkout-button">Xếp ca</button></form>
        <div className="schedule-grid">{phan_ca.map(x => <article key={x.id} className="schedule-card" style={{ borderTopColor: x.ca_lam_viec.mau_hien_thi || "#8b5cf6" }}><div><b>{x.nhan_vien.ma_nhan_vien} · {x.nhan_vien.nguoi_dung.ho_ten}</b><span>{new Date(x.ngay_lam).toLocaleDateString("vi-VN")}</span></div><strong>{x.ca_lam_viec.ten_ca} · {x.ca_lam_viec.gio_bat_dau}–{x.ca_lam_viec.gio_ket_thuc}</strong><small>{x.trang_thai}{x.ghi_chu ? ` · ${x.ghi_chu}` : ""}</small><button className="danger-button" onClick={async()=>{try{await xoaPhanCa(x.id);await taiDuLieu();}catch(e){setThongBao(e instanceof Error?e.message:"Không thể xóa phân ca");}}}>Xóa</button></article>)}</div>
      </section>
    </main>
  </>;
}
