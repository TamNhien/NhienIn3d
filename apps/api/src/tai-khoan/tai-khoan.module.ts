import { Module } from "@nestjs/common";
import { XacThucModule } from "../xac-thuc/xac-thuc.module.js";
import { TaiKhoanController } from "./tai-khoan.controller.js";
import { TaiKhoanService } from "./tai-khoan.service.js";

@Module({
  imports: [XacThucModule],
  controllers: [TaiKhoanController],
  providers: [TaiKhoanService]
})
export class TaiKhoanModule {}
