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

  trangThaiCauHinh() {
    try {
      const cau_hinh = docCauHinhSmtp();
      if (!cau_hinh.bat) return { bat: false, san_sang: false, host: null, port: null, from: cau_hinh.from };
      return {
        bat: true,
        san_sang: Boolean(this.truyen),
        host: cau_hinh.tuy_chon.host,
        port: cau_hinh.tuy_chon.port,
        from: cau_hinh.from
      };
    } catch (error) {
      return { bat: true, san_sang: false, host: null, port: null, from: this.from, loi: error instanceof Error ? error.message : String(error) };
    }
  }

  async guiCanhBaoTonKho(input: {
    thu_dien_tu: string[];
    nguong_sap_het: number;
    bien_the: Array<{ ma_bien_the: string; ma_san_pham: string; ten_san_pham: string; so_luong_ton: number }>;
  }) {
    if (!this.truyen) throw new Error("Dịch vụ email đang tắt. Hãy đặt MAIL_ENABLED=true và cấu hình SMTP.");
    if (!input.thu_dien_tu.length) throw new Error("Không có địa chỉ Admin để nhận cảnh báo tồn kho.");

    const het = input.bien_the.filter(x => x.so_luong_ton <= 0).length;
    const sapHet = input.bien_the.length - het;
    const rowsText = input.bien_the.map(x => `- ${x.ma_bien_the} · ${x.ma_san_pham} · ${x.ten_san_pham}: ${x.so_luong_ton}`).join("\n");
    const rowsHtml = input.bien_the.map(x => `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb"><b>${thoatHtml(x.ma_bien_the)}</b></td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${thoatHtml(x.ma_san_pham)}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${thoatHtml(x.ten_san_pham)}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right"><b>${x.so_luong_ton}</b></td></tr>`).join("");

    await this.truyen.sendMail({
      from: this.from,
      to: input.thu_dien_tu,
      subject: `[NhienIn3d] Cảnh báo tồn kho: ${input.bien_the.length} biến thể cần xử lý`,
      text: [
        "Cảnh báo tồn kho NhienIn3d",
        `Ngưỡng sắp hết: <= ${input.nguong_sap_het}`,
        `Hết hàng: ${het} · Sắp hết: ${sapHet}`,
        "",
        rowsText,
        "",
        "Email này chỉ được gửi lại khi trạng thái/tồn kho cảnh báo thay đổi."
      ].join("\n"),
      html: `
        <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:760px;margin:auto;padding:28px;color:#111827">
          <h1 style="font-size:24px;margin:0 0 10px">Cảnh báo tồn kho NhienIn3d</h1>
          <p>Ngưỡng sắp hết: <strong>≤ ${input.nguong_sap_het}</strong>. Hiện có <strong>${het}</strong> biến thể hết hàng và <strong>${sapHet}</strong> biến thể sắp hết.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:18px"><thead><tr><th style="text-align:left;padding:8px">Biến thể</th><th style="text-align:left;padding:8px">Sản phẩm</th><th style="text-align:left;padding:8px">Tên</th><th style="text-align:right;padding:8px">Tồn</th></tr></thead><tbody>${rowsHtml}</tbody></table>
          <p style="font-size:12px;color:#64748b;margin-top:20px">Hệ thống chống gửi lặp: email chỉ gửi lại khi danh sách/tồn kho cảnh báo thay đổi.</p>
        </div>`
    });
  }

  async guiCanhBaoHeThong(input: {
    thu_dien_tu: string[];
    trang_thai: string;
    van_de: string[];
    thoi_gian: string;
    cap_leo_thang?: number;
    ton_tai_phut?: number;
  }) {
    if (!this.truyen) throw new Error("Dịch vụ email chưa sẵn sàng để gửi cảnh báo hệ thống.");
    if (!input.thu_dien_tu.length) throw new Error("Không có địa chỉ nhận cảnh báo hệ thống.");
    const listText = input.van_de.map(x => `- ${x}`).join("\n");
    const listHtml = input.van_de.map(x => `<li style="margin:6px 0">${thoatHtml(x)}</li>`).join("");
    await this.truyen.sendMail({
      from: this.from,
      to: input.thu_dien_tu,
      subject: `[NhienIn3d] ${input.cap_leo_thang && input.cap_leo_thang > 0 ? `ESCALATION ${input.cap_leo_thang} · ` : ""}Cảnh báo vận hành: ${input.trang_thai}`,
      text: ["Cảnh báo vận hành NhienIn3d", `Trạng thái: ${input.trang_thai}`, `Thời gian: ${input.thoi_gian}`, ...(input.cap_leo_thang && input.cap_leo_thang > 0 ? [`Escalation: cấp ${input.cap_leo_thang}`, `Sự cố tồn tại: ${input.ton_tai_phut || 0} phút`] : []), "", listText, "", "Hệ thống áp dụng thời gian im lặng và escalation khi sự cố kéo dài."].join("\n"),
      html: `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:680px;margin:auto;padding:28px;color:#111827"><h1 style="font-size:24px;margin:0 0 10px">Cảnh báo vận hành NhienIn3d</h1><p>Trạng thái: <strong>${thoatHtml(input.trang_thai)}</strong></p><p>Thời gian: ${thoatHtml(input.thoi_gian)}</p>${input.cap_leo_thang && input.cap_leo_thang > 0 ? `<p><strong>Escalation cấp ${input.cap_leo_thang}</strong> · sự cố tồn tại khoảng ${input.ton_tai_phut || 0} phút</p>` : ""}<ul>${listHtml}</ul><p style="font-size:12px;color:#64748b;margin-top:20px">Hệ thống áp dụng thời gian im lặng và escalation để tránh spam khi sự cố kéo dài.</p></div>`
    });
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
