import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import * as argon2 from "argon2";
import { CoSoDuLieuService } from "../co-so-du-lieu/co-so-du-lieu.service.js";
import { TrangThaiNhanVien, TrangThaiPhanCa, VaiTro } from "../generated/prisma/client.js";
import type { NguoiDungXacThuc } from "../xac-thuc/jwt.guard.js";
import { CapNhatNguoiDungDto } from "./dto/cap-nhat-nguoi-dung.dto.js";
import { CapNhatNhanVienDto } from "./dto/cap-nhat-nhan-vien.dto.js";
import { CapNhatPhanCaDto } from "./dto/cap-nhat-phan-ca.dto.js";
import { TaoCaLamDto } from "./dto/tao-ca-lam.dto.js";
import { TaoNhanVienDto } from "./dto/tao-nhan-vien.dto.js";
import { TaoPhanCaDto } from "./dto/tao-phan-ca.dto.js";

@Injectable()
export class QuanTriService {
  constructor(private readonly db: CoSoDuLieuService) {}

  async tong_quan() {
    const [nguoi_dung, nhan_vien, ca_lam_viec, phan_ca, don_hang, san_pham] = await Promise.all([
      this.db.nguoiDung.count(), this.db.nhanVien.count(), this.db.caLamViec.count(), this.db.phanCa.count(), this.db.donHang.count(), this.db.sanPham.count()
    ]);
    return { nguoi_dung, nhan_vien, ca_lam_viec, phan_ca, don_hang, san_pham };
  }

  danh_sach_nguoi_dung() {
    return this.db.nguoiDung.findMany({
      select: {
        id: true, thu_dien_tu: true, ho_ten: true, so_dien_thoai: true, vai_tro: true, da_kich_hoat: true,
        ngay_tao: true, lan_dang_nhap_cuoi: true,
        nhan_vien: { select: { id: true, ma_nhan_vien: true, chuc_danh: true, bo_phan: true, trang_thai: true } }
      },
      orderBy: [{ vai_tro: "desc" }, { ho_ten: "asc" }]
    });
  }

  async cap_nhat_nguoi_dung(actor: NguoiDungXacThuc, id: string, dto: CapNhatNguoiDungDto) {
    const target = await this.db.nguoiDung.findUnique({ where: { id } });
    if (!target) throw new NotFoundException("Không tìm thấy người dùng");

    const actor_super = actor.vai_tro === VaiTro.SIEU_QUAN_TRI;
    if (target.vai_tro === VaiTro.SIEU_QUAN_TRI && !actor_super) throw new ForbiddenException("Chỉ Siêu quản trị được thay đổi tài khoản Siêu quản trị");
    if (dto.vai_tro === "SIEU_QUAN_TRI" && !actor_super) throw new ForbiddenException("Chỉ Siêu quản trị được cấp vai trò Siêu quản trị");
    if (actor.id === id && (dto.da_kich_hoat === false || (dto.vai_tro && dto.vai_tro !== actor.vai_tro))) {
      throw new BadRequestException("Không thể tự vô hiệu hóa hoặc tự đổi vai trò của tài khoản đang đăng nhập");
    }

    const data: { ho_ten?: string; so_dien_thoai?: string | null; vai_tro?: VaiTro; da_kich_hoat?: boolean } = {};
    if (dto.ho_ten !== undefined) data.ho_ten = dto.ho_ten.trim();
    if (dto.so_dien_thoai !== undefined) data.so_dien_thoai = dto.so_dien_thoai.trim() || null;
    if (dto.vai_tro !== undefined) data.vai_tro = dto.vai_tro as VaiTro;
    if (dto.da_kich_hoat !== undefined) data.da_kich_hoat = dto.da_kich_hoat;

    const da_cap_nhat = await this.db.nguoiDung.update({ where: { id }, data });
    await this.db.nhatKyBaoMat.create({
      data: { loai_su_kien: "QUAN_TRI_CAP_NHAT_NGUOI_DUNG", nguoi_dung_id: actor.id, chi_tiet: { muc_tieu_id: id, truong_cap_nhat: Object.keys(data) } }
    });
    return { id: da_cap_nhat.id, ho_ten: da_cap_nhat.ho_ten, thu_dien_tu: da_cap_nhat.thu_dien_tu, so_dien_thoai: da_cap_nhat.so_dien_thoai, vai_tro: da_cap_nhat.vai_tro, da_kich_hoat: da_cap_nhat.da_kich_hoat };
  }

  async tao_nhan_vien(actor: NguoiDungXacThuc, dto: TaoNhanVienDto) {
    const email = dto.thu_dien_tu.trim().toLowerCase();
    const [email_da_co, ma_da_co] = await Promise.all([
      this.db.nguoiDung.findUnique({ where: { thu_dien_tu: email }, select: { id: true } }),
      this.db.nhanVien.findUnique({ where: { ma_nhan_vien: dto.ma_nhan_vien.trim().toUpperCase() }, select: { id: true } })
    ]);
    if (email_da_co) throw new ConflictException("Email đã tồn tại");
    if (ma_da_co) throw new ConflictException("Mã nhân viên đã tồn tại");

    const mat_khau_bam = await argon2.hash(dto.mat_khau, { type: argon2.argon2id });
    const vai_tro = dto.vai_tro as VaiTro;
    const ket_qua = await this.db.$transaction(async tx => {
      const nguoi_dung = await tx.nguoiDung.create({
        data: { thu_dien_tu: email, ho_ten: dto.ho_ten.trim(), so_dien_thoai: dto.so_dien_thoai?.trim() || null, mat_khau_bam, vai_tro, da_kich_hoat: true }
      });
      const nhan_vien = await tx.nhanVien.create({
        data: {
          nguoi_dung_id: nguoi_dung.id,
          ma_nhan_vien: dto.ma_nhan_vien.trim().toUpperCase(),
          chuc_danh: dto.chuc_danh.trim(),
          bo_phan: dto.bo_phan.trim(),
          ngay_vao_lam: new Date(`${dto.ngay_vao_lam}T00:00:00Z`)
        }
      });
      return { nguoi_dung, nhan_vien };
    });
    await this.db.nhatKyBaoMat.create({
      data: { loai_su_kien: "QUAN_TRI_TAO_NHAN_VIEN", nguoi_dung_id: actor.id, chi_tiet: { nhan_vien_id: ket_qua.nhan_vien.id, ma_nhan_vien: ket_qua.nhan_vien.ma_nhan_vien } }
    });
    return { id: ket_qua.nhan_vien.id, ma_nhan_vien: ket_qua.nhan_vien.ma_nhan_vien, nguoi_dung_id: ket_qua.nguoi_dung.id };
  }

  danh_sach_nhan_vien() {
    return this.db.nhanVien.findMany({
      include: { nguoi_dung: { select: { id: true, thu_dien_tu: true, ho_ten: true, so_dien_thoai: true, vai_tro: true, da_kich_hoat: true } } },
      orderBy: { ma_nhan_vien: "asc" }
    });
  }

  async cap_nhat_nhan_vien(actor: NguoiDungXacThuc, id: string, dto: CapNhatNhanVienDto) {
    const hien_tai = await this.db.nhanVien.findUnique({ where: { id }, select: { id: true, nguoi_dung_id: true } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy nhân viên");
    const data: { chuc_danh?: string; bo_phan?: string; trang_thai?: TrangThaiNhanVien; ghi_chu?: string | null } = {};
    if (dto.chuc_danh !== undefined) data.chuc_danh = dto.chuc_danh.trim();
    if (dto.bo_phan !== undefined) data.bo_phan = dto.bo_phan.trim();
    if (dto.trang_thai !== undefined) data.trang_thai = dto.trang_thai as TrangThaiNhanVien;
    if (dto.ghi_chu !== undefined) data.ghi_chu = dto.ghi_chu.trim() || null;
    const kq = await this.db.nhanVien.update({ where: { id }, data });
    await this.db.nhatKyBaoMat.create({
      data: { loai_su_kien: "QUAN_TRI_CAP_NHAT_NHAN_VIEN", nguoi_dung_id: actor.id, chi_tiet: { nhan_vien_id: id, truong_cap_nhat: Object.keys(data) } }
    });
    return kq;
  }

  danh_sach_ca() {
    return this.db.caLamViec.findMany({ orderBy: { ma_ca: "asc" } });
  }

  async tao_ca(dto: TaoCaLamDto) {
    const ma_ca = dto.ma_ca.trim().toUpperCase();
    const da_co = await this.db.caLamViec.findUnique({ where: { ma_ca }, select: { id: true } });
    if (da_co) throw new ConflictException("Mã ca đã tồn tại");
    return this.db.caLamViec.create({ data: { ma_ca, ten_ca: dto.ten_ca.trim(), gio_bat_dau: dto.gio_bat_dau, gio_ket_thuc: dto.gio_ket_thuc, mau_hien_thi: dto.mau_hien_thi || "#22C55E" } });
  }

  danh_sach_phan_ca() {
    return this.db.phanCa.findMany({
      include: {
        nhan_vien: { include: { nguoi_dung: { select: { ho_ten: true, thu_dien_tu: true } } } },
        ca_lam_viec: true
      },
      orderBy: [{ ngay_lam: "asc" }, { ngay_tao: "asc" }],
      take: 300
    });
  }

  async tao_phan_ca(dto: TaoPhanCaDto) {
    const [nhan_vien, ca] = await Promise.all([
      this.db.nhanVien.findUnique({ where: { id: dto.nhan_vien_id }, include: { nguoi_dung: true } }),
      this.db.caLamViec.findUnique({ where: { id: dto.ca_lam_viec_id } })
    ]);
    if (!nhan_vien || !nhan_vien.nguoi_dung.da_kich_hoat) throw new BadRequestException("Nhân viên không tồn tại hoặc đã bị vô hiệu hóa");
    if (!ca || !ca.dang_hoat_dong) throw new BadRequestException("Ca làm việc không tồn tại hoặc đã ngừng hoạt động");

    try {
      return await this.db.phanCa.create({
        data: { nhan_vien_id: dto.nhan_vien_id, ca_lam_viec_id: dto.ca_lam_viec_id, ngay_lam: new Date(`${dto.ngay_lam}T00:00:00Z`), ghi_chu: dto.ghi_chu?.trim() || null }
      });
    } catch {
      throw new ConflictException("Nhân viên đã được xếp ca này trong ngày đã chọn");
    }
  }

  async cap_nhat_phan_ca(id: string, dto: CapNhatPhanCaDto) {
    const da_co = await this.db.phanCa.findUnique({ where: { id }, select: { id: true } });
    if (!da_co) throw new NotFoundException("Không tìm thấy phân ca");
    return this.db.phanCa.update({ where: { id }, data: { trang_thai: dto.trang_thai as TrangThaiPhanCa | undefined, ghi_chu: dto.ghi_chu?.trim() } });
  }

  async xoa_phan_ca(id: string) {
    const da_co = await this.db.phanCa.findUnique({ where: { id }, select: { id: true } });
    if (!da_co) throw new NotFoundException("Không tìm thấy phân ca");
    await this.db.phanCa.delete({ where: { id } });
    return { thong_bao: "Đã xóa phân ca" };
  }
}
