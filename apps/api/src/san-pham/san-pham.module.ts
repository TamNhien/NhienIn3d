import { Module } from "@nestjs/common";
import { SanPhamController } from "./san-pham.controller.js";
@Module({ controllers: [SanPhamController] })
export class SanPhamModule {}
