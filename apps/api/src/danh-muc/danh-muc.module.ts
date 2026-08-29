import { Module } from "@nestjs/common";
import { DanhMucController } from "./danh-muc.controller.js";
@Module({ controllers: [DanhMucController] })
export class DanhMucModule {}
