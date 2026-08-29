import { existsSync, rmSync } from "node:fs";

const tepCu = [
  "apps/web/lib/lich-su-phien-ban.ts",
];

for (const tep of tepCu) {
  if (existsSync(tep)) {
    rmSync(tep, { force: true });
    console.log(`[cleanup] Đã xóa tệp storefront cũ: ${tep}`);
  }
}
