import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { CoSoDuLieuService } from "../co-so-du-lieu/co-so-du-lieu.service.js";
import { DangNhapDto } from "./dto/dang-nhap.dto.js";

@Injectable()
export class XacThucService {
  constructor(private readonly db: CoSoDuLieuService, private readonly jwt: JwtService) {}

  async dang_nhap(dto: DangNhapDto, dia_chi_ip?: string, trinh_duyet?: string) {
    const thu_dien_tu = dto.thu_dien_tu.trim().toLowerCase();
    const nguoi_dung = await this.db.nguoiDung.findUnique({ where: { thu_dien_tu } });
    if (!nguoi_dung || !nguoi_dung.da_kich_hoat || !(await argon2.verify(nguoi_dung.mat_khau_bam, dto.mat_khau))) {
      await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "DANG_NHAP_THAT_BAI", dia_chi_ip, chi_tiet: { thu_dien_tu } } });
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
    }

    const jwt_secret = process.env.JWT_SECRET;
    if (!jwt_secret || jwt_secret.length < 32) throw new Error("JWT_SECRET chưa an toàn");
    const ma_lam_moi = randomBytes(48).toString("base64url");
    const ma_lam_moi_bam = createHash("sha256").update(ma_lam_moi).digest("hex");
    const het_han_luc = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.db.phienDangNhap.create({ data: { nguoi_dung_id: nguoi_dung.id, ma_lam_moi_bam, dia_chi_ip, trinh_duyet, het_han_luc } });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "DANG_NHAP_THANH_CONG", nguoi_dung_id: nguoi_dung.id, dia_chi_ip } });
    const ma_truy_cap = await this.jwt.signAsync({ sub: nguoi_dung.id, vai_tro: nguoi_dung.vai_tro }, { secret: jwt_secret, expiresIn: "15m", issuer: "NhienIn3d", audience: "NhienIn3d-Web" });
    return { ma_truy_cap, ma_lam_moi, nguoi_dung: { id: nguoi_dung.id, thu_dien_tu: nguoi_dung.thu_dien_tu, ho_ten: nguoi_dung.ho_ten, vai_tro: nguoi_dung.vai_tro } };
  }
}
