import { Module } from "@nestjs/common";
import { ThuDienTuService } from "./thu-dien-tu.service.js";

@Module({
  providers: [ThuDienTuService],
  exports: [ThuDienTuService]
})
export class ThuDienTuModule {}
