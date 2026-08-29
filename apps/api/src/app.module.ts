import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CoSoDuLieuModule } from "./co-so-du-lieu/co-so-du-lieu.module.js";
import { SucKhoeModule } from "./suc-khoe/suc-khoe.module.js";
import { DanhMucModule } from "./danh-muc/danh-muc.module.js";
import { SanPhamModule } from "./san-pham/san-pham.module.js";
import { XacThucModule } from "./xac-thuc/xac-thuc.module.js";
import { GioHangModule } from "./gio-hang/gio-hang.module.js";
import { ThanhToanModule } from "./thanh-toan/thanh-toan.module.js";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CoSoDuLieuModule, SucKhoeModule, DanhMucModule, SanPhamModule, XacThucModule, GioHangModule, ThanhToanModule]
})
export class AppModule {}
