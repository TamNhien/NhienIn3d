import { Module } from "@nestjs/common";
import { DanhGiaController } from "./danh-gia.controller.js";
import { DanhGiaService } from "./danh-gia.service.js";

@Module({ controllers: [DanhGiaController], providers: [DanhGiaService] })
export class DanhGiaModule {}
