import { Module } from "@nestjs/common";
import { XacThucModule } from "../xac-thuc/xac-thuc.module.js";
import { ThuDienTuModule } from "../thu-dien-tu/thu-dien-tu.module.js";
import { QuanTriController } from "./quan-tri.controller.js";
import { OpsController } from "./ops.controller.js";
import { ProbeAgentController } from "./probe-agent.controller.js";
import { QuanTriService } from "./quan-tri.service.js";

@Module({
  imports: [XacThucModule, ThuDienTuModule],
  controllers: [QuanTriController, OpsController, ProbeAgentController],
  providers: [QuanTriService]
})
export class QuanTriModule {}
