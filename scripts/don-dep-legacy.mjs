import { existsSync, rmSync } from "node:fs";

const tepCu = [
  "apps/web/lib/lich-su-phien-ban.ts",
  "apps/web/components/trinh-xem-anh-3d.tsx",
  // v3.1.0 gỡ MFA khỏi runtime; khi người dùng chép source mới đè lên thư mục cũ,
  // hai file v3.0.x vẫn có thể còn sót và làm regression test/release thất bại.
  "apps/api/src/xac-thuc/mfa-totp.ts",
  "apps/api/src/xac-thuc/dto/xac-nhan-mfa.dto.ts",
];

for (const tep of tepCu) {
  if (existsSync(tep)) {
    rmSync(tep, { force: true });
    console.log(`[cleanup] Đã xóa tệp legacy: ${tep}`);
  }
}
