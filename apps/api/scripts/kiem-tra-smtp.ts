import { config as docEnv } from "dotenv";
import { resolve } from "node:path";
import nodemailer from "nodemailer";
import { docCauHinhSmtp } from "../src/thu-dien-tu/cau-hinh-smtp.js";

docEnv({ path: resolve(process.cwd(), "../../.env") });
docEnv({ path: resolve(process.cwd(), ".env") });

const cau_hinh = docCauHinhSmtp();
if (!cau_hinh.bat || !cau_hinh.tuy_chon) {
  throw new Error("MAIL_ENABLED đang false. Hãy bật MAIL_ENABLED=true trước khi kiểm tra SMTP.");
}

const truyen = nodemailer.createTransport(cau_hinh.tuy_chon);
await truyen.verify();
console.log(`✅ SMTP kết nối thành công: ${cau_hinh.tuy_chon.host}:${cau_hinh.tuy_chon.port}`);
await truyen.close();
