import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ThuDienTuModule } from "../thu-dien-tu/thu-dien-tu.module.js";
import { JwtGuard } from "./jwt.guard.js";
import { VaiTroGuard } from "./vai-tro.guard.js";
import { XacThucController } from "./xac-thuc.controller.js";
import { XacThucService } from "./xac-thuc.service.js";

@Module({
  imports: [JwtModule.register({}), ThuDienTuModule],
  controllers: [XacThucController],
  providers: [XacThucService, JwtGuard, VaiTroGuard],
  exports: [JwtModule, XacThucService, JwtGuard, VaiTroGuard]
})
export class XacThucModule {}
