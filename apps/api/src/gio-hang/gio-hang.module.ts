import { Module } from "@nestjs/common";
import { GioHangController } from "./gio-hang.controller.js";
import { GioHangService } from "./gio-hang.service.js";

@Module({ controllers: [GioHangController], providers: [GioHangService] })
export class GioHangModule {}
