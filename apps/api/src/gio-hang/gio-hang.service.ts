import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { CoSoDuLieuService } from "../co-so-du-lieu/co-so-du-lieu.service.js";
import { CapNhatGioHangDto } from "./dto/cap-nhat-gio-hang.dto.js";
import { ThemVaoGioHangDto } from "./dto/them-vao-gio-hang.dto.js";

@Injectable()
export class GioHangService {
  constructor(private readonly db: CoSoDuLieuService) {}

  private includeGioHang() {
    return {
      chi_tiet: {
        include: {
          bien_the: {
            include: {
              vat_lieu: true,
              mau_sac: true,
              san_pham: { include: { hinh_anh: { where: { la_anh_chinh: true }, take: 1 } } }
            }
          }
        },
        orderBy: { ngay_tao: "asc" as const }
      }
    } as const;
  }

  private dinhDang(gio_hang: any) {
    const tong_so_luong = gio_hang.chi_tiet.reduce((tong: number, item: any) => tong + item.so_luong, 0);
    const tam_tinh = gio_hang.chi_tiet.reduce((tong: number, item: any) => tong + Number(item.don_gia) * item.so_luong, 0);
    return { ...gio_hang, tong_so_luong, tam_tinh };
  }

  async tao() {
    const gio_hang = await this.db.gioHang.create({
      data: {
        ma_phien: randomBytes(24).toString("base64url"),
        ngay_het_han: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      include: this.includeGioHang()
    });
    return this.dinhDang(gio_hang);
  }

  async lay(ma_phien: string) {
    const gio_hang = await this.db.gioHang.findUnique({
      where: { ma_phien },
      include: this.includeGioHang()
    });
    if (!gio_hang || gio_hang.trang_thai !== "DANG_MO" || gio_hang.ngay_het_han <= new Date()) {
      throw new NotFoundException("Giỏ hàng không tồn tại hoặc đã hết hạn");
    }
    return this.dinhDang(gio_hang);
  }

  async them(ma_phien: string, dto: ThemVaoGioHangDto) {
    const gio_hang = await this.db.gioHang.findUnique({ where: { ma_phien } });
    if (!gio_hang || gio_hang.trang_thai !== "DANG_MO") throw new NotFoundException("Không tìm thấy giỏ hàng đang mở");

    const bien_the = await this.db.bienTheSanPham.findUnique({
      where: { ma_bien_the: dto.ma_bien_the },
      include: { san_pham: true }
    });
    if (!bien_the || !bien_the.dang_hien_thi || bien_the.san_pham.trang_thai !== "DANG_BAN") {
      throw new NotFoundException("Biến thể sản phẩm không khả dụng");
    }

    const da_co = await this.db.chiTietGioHang.findUnique({
      where: { gio_hang_id_bien_the_id: { gio_hang_id: gio_hang.id, bien_the_id: bien_the.id } }
    });
    const so_luong_moi = (da_co?.so_luong ?? 0) + dto.so_luong;
    if (so_luong_moi > Math.min(20, bien_the.so_luong_ton)) throw new BadRequestException("Số lượng vượt tồn kho hiện tại");

    const don_gia = Number(bien_the.san_pham.gia_ban) + Number(bien_the.gia_chenh_lech);
    await this.db.chiTietGioHang.upsert({
      where: { gio_hang_id_bien_the_id: { gio_hang_id: gio_hang.id, bien_the_id: bien_the.id } },
      update: { so_luong: so_luong_moi, don_gia },
      create: { gio_hang_id: gio_hang.id, bien_the_id: bien_the.id, so_luong: dto.so_luong, don_gia }
    });
    return this.lay(ma_phien);
  }

  async capNhat(ma_phien: string, chi_tiet_id: string, dto: CapNhatGioHangDto) {
    const gio_hang = await this.db.gioHang.findUnique({ where: { ma_phien } });
    if (!gio_hang || gio_hang.trang_thai !== "DANG_MO") throw new NotFoundException("Không tìm thấy giỏ hàng đang mở");

    const chi_tiet = await this.db.chiTietGioHang.findFirst({
      where: { id: chi_tiet_id, gio_hang_id: gio_hang.id },
      include: { bien_the: true }
    });
    if (!chi_tiet) throw new NotFoundException("Không tìm thấy dòng giỏ hàng");
    if (dto.so_luong > chi_tiet.bien_the.so_luong_ton) throw new BadRequestException("Số lượng vượt tồn kho hiện tại");

    await this.db.chiTietGioHang.update({ where: { id: chi_tiet.id }, data: { so_luong: dto.so_luong } });
    return this.lay(ma_phien);
  }

  async xoa(ma_phien: string, chi_tiet_id: string) {
    const gio_hang = await this.db.gioHang.findUnique({ where: { ma_phien } });
    if (!gio_hang || gio_hang.trang_thai !== "DANG_MO") throw new NotFoundException("Không tìm thấy giỏ hàng đang mở");
    await this.db.chiTietGioHang.deleteMany({ where: { id: chi_tiet_id, gio_hang_id: gio_hang.id } });
    return this.lay(ma_phien);
  }
}
