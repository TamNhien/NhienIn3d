import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import * as argon2 from "argon2";
import { CoSoDuLieuService } from "../co-so-du-lieu/co-so-du-lieu.service.js";
import { TrangThaiNhanVien, TrangThaiPhanCa, VaiTro } from "../generated/prisma/client.js";
import type { NguoiDungXacThuc } from "../xac-thuc/jwt.guard.js";
import { CapNhatNguoiDungDto } from "./dto/cap-nhat-nguoi-dung.dto.js";
import { CapNhatNhanVienDto } from "./dto/cap-nhat-nhan-vien.dto.js";
import { CapNhatCaLamDto } from "./dto/cap-nhat-ca-lam.dto.js";
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

  async danh_sach_nguoi_dung() {
    const ds = await this.db.nguoiDung.findMany({
      select: {
        id: true, thu_dien_tu: true, ho_ten: true, so_dien_thoai: true, vai_tro: true, da_kich_hoat: true,
        ngay_tao: true, lan_dang_nhap_cuoi: true,
        nhan_vien: { select: { id: true, ma_nhan_vien: true, chuc_danh: true, bo_phan: true, trang_thai: true } }
      }
    });
    const thu_tu: Record<VaiTro, number> = {
      ADMIN: 0, NHAN_VIEN: 1, KHACH_HANG: 2
    };
    return ds.sort((a, b) => thu_tu[a.vai_tro] - thu_tu[b.vai_tro] || a.ho_ten.localeCompare(b.ho_ten, "vi"));
  }

  async cap_nhat_nguoi_dung(actor: NguoiDungXacThuc, id: string, dto: CapNhatNguoiDungDto) {
    const target = await this.db.nguoiDung.findUnique({ where: { id }, select: { id: true } });
    if (!target) throw new NotFoundException("Không tìm thấy người dùng");

    // Vai trò được cố định theo luồng tạo tài khoản: Admin bootstrap, đăng ký = khách hàng,
    // tạo nhân viên = Nhân viên bán hàng. PATCH người dùng không còn được đổi vai trò.
    if (actor.id === id && dto.da_kich_hoat === false) {
      throw new BadRequestException("Không thể tự khóa tài khoản Admin đang đăng nhập");
    }

    const data: {
      ho_ten?: string;
      so_dien_thoai?: string | null;
      da_kich_hoat?: boolean;
      so_lan_dang_nhap_that_bai?: number;
      khoa_den?: Date | null;
    } = {};
    if (dto.ho_ten !== undefined) data.ho_ten = dto.ho_ten.trim();
    if (dto.so_dien_thoai !== undefined) data.so_dien_thoai = dto.so_dien_thoai.trim() || null;
    if (dto.da_kich_hoat !== undefined) {
      data.da_kich_hoat = dto.da_kich_hoat;
      if (dto.da_kich_hoat) {
        data.so_lan_dang_nhap_that_bai = 0;
        data.khoa_den = null;
      }
    }

    const da_cap_nhat = await this.db.$transaction(async tx => {
      const updated = await tx.nguoiDung.update({ where: { id }, data });
      if (dto.da_kich_hoat === false) {
        await tx.phienDangNhap.updateMany({
          where: { nguoi_dung_id: id, da_thu_hoi: false },
          data: { da_thu_hoi: true }
        });
      }
      return updated;
    });
    await this.db.nhatKyBaoMat.create({
      data: {
        loai_su_kien: dto.da_kich_hoat === true ? "ADMIN_KICH_HOAT_NGUOI_DUNG" : dto.da_kich_hoat === false ? "ADMIN_KHOA_NGUOI_DUNG" : "ADMIN_CAP_NHAT_NGUOI_DUNG",
        nguoi_dung_id: actor.id,
        chi_tiet: { muc_tieu_id: id, truong_cap_nhat: Object.keys(data) }
      }
    });
    return { id: da_cap_nhat.id, ho_ten: da_cap_nhat.ho_ten, thu_dien_tu: da_cap_nhat.thu_dien_tu, so_dien_thoai: da_cap_nhat.so_dien_thoai, vai_tro: da_cap_nhat.vai_tro, da_kich_hoat: da_cap_nhat.da_kich_hoat };
  }

  async kich_hoat_nguoi_dung(actor: NguoiDungXacThuc, id: string) {
    const target = await this.db.nguoiDung.findUnique({
      where: { id },
      select: { id: true, thu_dien_tu: true, nhan_vien: { select: { id: true } } }
    });
    if (!target) throw new NotFoundException("Không tìm thấy người dùng");

    // Endpoint riêng để mở khóa dứt điểm: bật tài khoản + xóa lockout đăng nhập sai.
    // Nếu đây là nhân viên bán hàng, trạng thái hồ sơ cũng chuyển về ĐANG_LÀM để
    // khu người dùng, hồ sơ nhân sự và xếp ca không còn lệch trạng thái.
    const updated = await this.db.$transaction(async tx => {
      const user = await tx.nguoiDung.update({
        where: { id },
        data: { da_kich_hoat: true, so_lan_dang_nhap_that_bai: 0, khoa_den: null }
      });
      if (target.nhan_vien) {
        await tx.nhanVien.update({
          where: { id: target.nhan_vien.id },
          data: { trang_thai: TrangThaiNhanVien.DANG_LAM, chuc_danh: "Nhân viên bán hàng", bo_phan: "Bán hàng" }
        });
      }
      return user;
    });
    await this.db.nhatKyBaoMat.create({
      data: { loai_su_kien: "ADMIN_KICH_HOAT_NGUOI_DUNG", nguoi_dung_id: actor.id, chi_tiet: { muc_tieu_id: id, thu_dien_tu: target.thu_dien_tu, reset_lockout: true } }
    });
    return { id: updated.id, da_kich_hoat: updated.da_kich_hoat, khoa_den: updated.khoa_den, so_lan_dang_nhap_that_bai: updated.so_lan_dang_nhap_that_bai, thong_bao: `Đã kích hoạt tài khoản ${target.thu_dien_tu}` };
  }

  async khoa_nguoi_dung(actor: NguoiDungXacThuc, id: string) {
    if (actor.id === id) throw new BadRequestException("Không thể tự khóa tài khoản Admin đang đăng nhập");
    const target = await this.db.nguoiDung.findUnique({
      where: { id },
      select: { id: true, thu_dien_tu: true, nhan_vien: { select: { id: true, trang_thai: true } } }
    });
    if (!target) throw new NotFoundException("Không tìm thấy người dùng");

    await this.db.$transaction(async tx => {
      await tx.nguoiDung.update({ where: { id }, data: { da_kich_hoat: false } });
      await tx.phienDangNhap.updateMany({ where: { nguoi_dung_id: id, da_thu_hoi: false }, data: { da_thu_hoi: true } });
      if (target.nhan_vien && target.nhan_vien.trang_thai !== TrangThaiNhanVien.NGHI_VIEC) {
        await tx.nhanVien.update({ where: { id: target.nhan_vien.id }, data: { trang_thai: TrangThaiNhanVien.TAM_NGHI } });
      }
    });
    await this.db.nhatKyBaoMat.create({
      data: { loai_su_kien: "ADMIN_KHOA_NGUOI_DUNG", nguoi_dung_id: actor.id, chi_tiet: { muc_tieu_id: id, thu_dien_tu: target.thu_dien_tu, thu_hoi_phien: true } }
    });
    return { id, da_kich_hoat: false, thong_bao: `Đã khóa tài khoản ${target.thu_dien_tu}` };
  }

  async xoa_nguoi_dung(actor: NguoiDungXacThuc, id: string) {
    const target = await this.db.nguoiDung.findUnique({
      where: { id },
      select: { id: true, ho_ten: true, thu_dien_tu: true, vai_tro: true, nhan_vien: { select: { id: true } } }
    });
    if (!target) throw new NotFoundException("Không tìm thấy người dùng");
    if (actor.id === id) throw new BadRequestException("Không thể xóa chính tài khoản Admin đang đăng nhập");

    // Dọn quan hệ tường minh để xóa được cả database đã nâng cấp từ các bản cũ
    // có constraint chưa đồng nhất. Đơn hàng/giỏ hàng chỉ bỏ liên kết, không xóa lịch sử.
    await this.db.$transaction(async tx => {
      await tx.donHang.updateMany({ where: { nguoi_dung_id: id }, data: { nguoi_dung_id: null } });
      await tx.gioHang.updateMany({ where: { nguoi_dung_id: id }, data: { nguoi_dung_id: null } });
      await tx.phienDangNhap.deleteMany({ where: { nguoi_dung_id: id } });
      await tx.datLaiMatKhau.deleteMany({ where: { nguoi_dung_id: id } });
      await tx.diaChiNguoiDung.deleteMany({ where: { nguoi_dung_id: id } });
      if (target.nhan_vien) {
        await tx.phanCa.deleteMany({ where: { nhan_vien_id: target.nhan_vien.id } });
        await tx.nhanVien.deleteMany({ where: { id: target.nhan_vien.id } });
      }
      await tx.nguoiDung.delete({ where: { id } });
    });

    await this.db.nhatKyBaoMat.create({
      data: {
        loai_su_kien: "ADMIN_XOA_NGUOI_DUNG",
        nguoi_dung_id: actor.id,
        chi_tiet: { muc_tieu_id: id, thu_dien_tu: target.thu_dien_tu, ho_ten: target.ho_ten, vai_tro: target.vai_tro, don_quan_he: true }
      }
    });
    return { thong_bao: `Đã xóa tài khoản ${target.thu_dien_tu}` };
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
    const ket_qua = await this.db.$transaction(async tx => {
      const nguoi_dung = await tx.nguoiDung.create({
        data: { thu_dien_tu: email, ho_ten: dto.ho_ten.trim(), so_dien_thoai: dto.so_dien_thoai?.trim() || null, mat_khau_bam, vai_tro: VaiTro.NHAN_VIEN, da_kich_hoat: true }
      });
      const nhan_vien = await tx.nhanVien.create({
        data: {
          nguoi_dung_id: nguoi_dung.id,
          ma_nhan_vien: dto.ma_nhan_vien.trim().toUpperCase(),
          chuc_danh: "Nhân viên bán hàng",
          bo_phan: "Bán hàng",
          ngay_vao_lam: new Date(`${dto.ngay_vao_lam}T00:00:00Z`),
          trang_thai: TrangThaiNhanVien.DANG_LAM,
          ghi_chu: "Nhân viên bán hàng do Admin quản lý."
        }
      });
      return { nguoi_dung, nhan_vien };
    });
    await this.db.nhatKyBaoMat.create({
      data: { loai_su_kien: "ADMIN_TAO_NHAN_VIEN", nguoi_dung_id: actor.id, chi_tiet: { nhan_vien_id: ket_qua.nhan_vien.id, ma_nhan_vien: ket_qua.nhan_vien.ma_nhan_vien } }
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
    const hien_tai = await this.db.nhanVien.findUnique({ where: { id }, select: { id: true, nguoi_dung_id: true, ma_nhan_vien: true } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy nhân viên");

    const data: { trang_thai?: TrangThaiNhanVien; ghi_chu?: string | null; chuc_danh: string; bo_phan: string } = {
      chuc_danh: "Nhân viên bán hàng",
      bo_phan: "Bán hàng"
    };
    if (dto.trang_thai !== undefined) data.trang_thai = dto.trang_thai as TrangThaiNhanVien;
    if (dto.ghi_chu !== undefined) data.ghi_chu = dto.ghi_chu.trim() || null;

    await this.db.$transaction(async tx => {
      await tx.nhanVien.update({ where: { id }, data });
      if (dto.trang_thai === TrangThaiNhanVien.DANG_LAM) {
        await tx.nguoiDung.update({
          where: { id: hien_tai.nguoi_dung_id },
          data: { vai_tro: VaiTro.NHAN_VIEN, da_kich_hoat: true, so_lan_dang_nhap_that_bai: 0, khoa_den: null }
        });
      } else if (dto.trang_thai === TrangThaiNhanVien.TAM_NGHI || dto.trang_thai === TrangThaiNhanVien.NGHI_VIEC) {
        await tx.nguoiDung.update({
          where: { id: hien_tai.nguoi_dung_id },
          data: { vai_tro: VaiTro.NHAN_VIEN, da_kich_hoat: false, khoa_den: null }
        });
        await tx.phienDangNhap.updateMany({
          where: { nguoi_dung_id: hien_tai.nguoi_dung_id, da_thu_hoi: false },
          data: { da_thu_hoi: true }
        });
      }
    });

    // Đọc lại trực tiếp từ PostgreSQL sau commit. Response này là source of truth
    // để frontend không thể giữ trạng thái select cục bộ rồi F5 quay về dữ liệu cũ.
    const kq = await this.db.nhanVien.findUniqueOrThrow({
      where: { id },
      include: {
        nguoi_dung: {
          select: { id: true, thu_dien_tu: true, ho_ten: true, so_dien_thoai: true, vai_tro: true, da_kich_hoat: true }
        }
      }
    });

    await this.db.nhatKyBaoMat.create({
      data: {
        loai_su_kien: "ADMIN_CAP_NHAT_NHAN_VIEN",
        nguoi_dung_id: actor.id,
        chi_tiet: { nhan_vien_id: id, ma_nhan_vien: hien_tai.ma_nhan_vien, trang_thai: kq.trang_thai, dong_bo_tai_khoan: dto.trang_thai !== undefined, da_doc_lai_sau_commit: true }
      }
    });
    return kq;
  }

  danh_sach_ca() {
    return this.db.caLamViec.findMany({ orderBy: [{ gio_bat_dau: "asc" }, { ma_ca: "asc" }] });
  }

  private kiem_tra_khung_gio(gio_bat_dau: string, gio_ket_thuc: string) {
    if (gio_bat_dau >= gio_ket_thuc) {
      throw new BadRequestException("Giờ kết thúc phải sau giờ bắt đầu trong cùng ngày");
    }
  }

  async tao_ca(dto: TaoCaLamDto) {
    const ma_ca = dto.ma_ca.trim().toUpperCase();
    this.kiem_tra_khung_gio(dto.gio_bat_dau, dto.gio_ket_thuc);
    const da_co = await this.db.caLamViec.findUnique({ where: { ma_ca }, select: { id: true } });
    if (da_co) throw new ConflictException("Mã ca đã tồn tại");
    return this.db.caLamViec.create({
      data: {
        ma_ca,
        ten_ca: dto.ten_ca.trim(),
        gio_bat_dau: dto.gio_bat_dau,
        gio_ket_thuc: dto.gio_ket_thuc,
        mau_hien_thi: dto.mau_hien_thi || "#22C55E"
      }
    });
  }

  async cap_nhat_ca(id: string, dto: CapNhatCaLamDto) {
    const hien_tai = await this.db.caLamViec.findUnique({ where: { id } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy ca làm việc");

    const ma_ca = dto.ma_ca?.trim().toUpperCase() ?? hien_tai.ma_ca;
    const ten_ca = dto.ten_ca?.trim() ?? hien_tai.ten_ca;
    const gio_bat_dau = dto.gio_bat_dau ?? hien_tai.gio_bat_dau;
    const gio_ket_thuc = dto.gio_ket_thuc ?? hien_tai.gio_ket_thuc;
    this.kiem_tra_khung_gio(gio_bat_dau, gio_ket_thuc);

    if (ma_ca !== hien_tai.ma_ca) {
      const trung_ma = await this.db.caLamViec.findUnique({ where: { ma_ca }, select: { id: true } });
      if (trung_ma && trung_ma.id !== id) throw new ConflictException("Mã ca đã tồn tại");
    }

    // Không chặn chỉnh sửa mẫu ca khi đã có phân công. PhanCa giữ khóa ngoại tới
    // cùng ca_lam_viec_id nên tên/giờ/màu mới tự động áp dụng cho toàn bộ lịch đã xếp.
    const [da_cap_nhat, so_phan_ca_bi_anh_huong] = await this.db.$transaction([
      this.db.caLamViec.update({
        where: { id },
        data: {
          ma_ca,
          ten_ca,
          gio_bat_dau,
          gio_ket_thuc,
          mau_hien_thi: dto.mau_hien_thi ?? hien_tai.mau_hien_thi,
          dang_hoat_dong: dto.dang_hoat_dong ?? hien_tai.dang_hoat_dong
        }
      }),
      this.db.phanCa.count({ where: { ca_lam_viec_id: id } })
    ]);
    return { ...da_cap_nhat, so_phan_ca_bi_anh_huong };
  }

  async xoa_ca(id: string) {
    const hien_tai = await this.db.caLamViec.findUnique({
      where: { id },
      select: { id: true, ma_ca: true, ten_ca: true, _count: { select: { phan_ca: true } } }
    });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy ca làm việc");

    await this.db.$transaction(async tx => {
      await tx.phanCa.deleteMany({ where: { ca_lam_viec_id: id } });
      await tx.caLamViec.delete({ where: { id } });
    });

    return {
      thong_bao: `Đã xóa ca ${hien_tai.ma_ca} · ${hien_tai.ten_ca}`,
      so_phan_ca_da_xoa: hien_tai._count.phan_ca
    };
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
    const hien_tai = await this.db.phanCa.findUnique({ where: { id } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy phân ca");

    const nhan_vien_id = dto.nhan_vien_id ?? hien_tai.nhan_vien_id;
    const ca_lam_viec_id = dto.ca_lam_viec_id ?? hien_tai.ca_lam_viec_id;
    const ngay_lam = dto.ngay_lam ? new Date(`${dto.ngay_lam}T00:00:00Z`) : hien_tai.ngay_lam;

    const [nhan_vien, ca] = await Promise.all([
      this.db.nhanVien.findUnique({ where: { id: nhan_vien_id }, include: { nguoi_dung: true } }),
      this.db.caLamViec.findUnique({ where: { id: ca_lam_viec_id } })
    ]);
    if (!nhan_vien) throw new BadRequestException("Nhân viên không tồn tại");
    if (nhan_vien_id !== hien_tai.nhan_vien_id && !nhan_vien.nguoi_dung.da_kich_hoat) {
      throw new BadRequestException("Không thể chuyển phân ca sang nhân viên đã bị vô hiệu hóa");
    }
    if (!ca) throw new BadRequestException("Ca làm việc không tồn tại");
    if (ca_lam_viec_id !== hien_tai.ca_lam_viec_id && !ca.dang_hoat_dong) {
      throw new BadRequestException("Không thể chuyển phân ca sang mẫu ca đã ngừng hoạt động");
    }

    const trung = await this.db.phanCa.findFirst({
      where: { id: { not: id }, nhan_vien_id, ca_lam_viec_id, ngay_lam },
      select: { id: true }
    });
    if (trung) throw new ConflictException("Nhân viên đã được xếp ca này trong ngày đã chọn");

    return this.db.phanCa.update({
      where: { id },
      data: {
        nhan_vien_id,
        ca_lam_viec_id,
        ngay_lam,
        trang_thai: dto.trang_thai as TrangThaiPhanCa | undefined,
        ghi_chu: dto.ghi_chu !== undefined ? dto.ghi_chu.trim() || null : undefined
      },
      include: {
        nhan_vien: { include: { nguoi_dung: { select: { ho_ten: true, thu_dien_tu: true } } } },
        ca_lam_viec: true
      }
    });
  }

  async xoa_phan_ca(id: string) {
    const da_co = await this.db.phanCa.findUnique({ where: { id }, select: { id: true } });
    if (!da_co) throw new NotFoundException("Không tìm thấy phân ca");
    await this.db.phanCa.delete({ where: { id } });
    return { thong_bao: "Đã xóa phân ca" };
  }
}
