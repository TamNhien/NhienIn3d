import { Module } from "@nestjs/common";
import { XacThucModule } from "../xac-thuc/xac-thuc.module.js";
import { ThuDienTuModule } from "../thu-dien-tu/thu-dien-tu.module.js";
import { QuanTriController } from "./quan-tri.controller.js";
import { QuanTriService } from "./quan-tri.service.js";

@Module({
  imports: [XacThucModule, ThuDienTuModule],
  controllers: [QuanTriController],
  providers: [QuanTriService]
})
export class QuanTriModule {}
