import { Injectable, Logger } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";
import { docCauHinhSmtp } from "./cau-hinh-smtp.js";

function thoatHtml(gia_tri: string) {
  return gia_tri.replace(/[&<>'"]/g, (ky_tu) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[ky_tu] ?? ky_tu);
}

@Injectable()
export class ThuDienTuService {
  private readonly logger = new Logger(ThuDienTuService.name);
  private readonly truyen: Transporter | null;
  private readonly from: string;

  constructor() {
    const cau_hinh = docCauHinhSmtp();
    this.from = cau_hinh.from;
    if (!cau_hinh.bat || !cau_hinh.tuy_chon) {
      this.truyen = null;
      this.logger.warn("MAIL_ENABLED=false; chức năng gửi email đang tắt.");
      return;
    }

    this.truyen = nodemailer.createTransport(cau_hinh.tuy_chon);
    this.logger.log(`SMTP đã bật: ${cau_hinh.tuy_chon.host}:${cau_hinh.tuy_chon.port}`);
  }

  async guiLienKetDatLaiMatKhau(input: {
    thu_dien_tu: string;
    ho_ten: string;
    lien_ket: string;
    het_han_phut: number;
  }) {
    if (!this.truyen) throw new Error("Dịch vụ email đang tắt. Hãy đặt MAIL_ENABLED=true và cấu hình SMTP.");

    const ten = thoatHtml(input.ho_ten);
    const link = thoatHtml(input.lien_ket);

    await this.truyen.sendMail({
      from: this.from,
      to: input.thu_dien_tu,
      subject: "Đặt lại mật khẩu NhienIn3d",
      text: [
        `Xin chào ${input.ho_ten},`,
        "",
        "Bạn vừa yêu cầu đặt lại mật khẩu NhienIn3d.",
        `Mở liên kết sau trong vòng ${input.het_han_phut} phút:`,
        input.lien_ket,
        "",
        "Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email. Liên kết chỉ dùng được một lần."
      ].join("\n"),
      html: `
        <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:620px;margin:auto;padding:28px;color:#111827">
          <h1 style="font-size:24px;margin:0 0 16px">Đặt lại mật khẩu NhienIn3d</h1>
          <p>Xin chào <strong>${ten}</strong>,</p>
          <p>Bạn vừa yêu cầu đặt lại mật khẩu. Liên kết bên dưới có hiệu lực trong <strong>${input.het_han_phut} phút</strong> và chỉ dùng được một lần.</p>
          <p style="margin:28px 0"><a href="${link}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#111827;color:#fff;text-decoration:none;font-weight:700">Đặt lại mật khẩu</a></p>
          <p style="font-size:13px;color:#64748b;word-break:break-all">${link}</p>
          <hr style="border:0;border-top:1px solid #e5e7eb;margin:28px 0">
          <p style="font-size:13px;color:#64748b">Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email. Mật khẩu hiện tại vẫn giữ nguyên.</p>
        </div>`
    });
  }
}
