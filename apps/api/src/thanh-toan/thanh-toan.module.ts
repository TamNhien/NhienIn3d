import { Module } from "@nestjs/common";
import { ThanhToanController } from "./thanh-toan.controller.js";
import { ThanhToanService } from "./thanh-toan.service.js";

@Module({ controllers: [ThanhToanController], providers: [ThanhToanService] })
export class ThanhToanModule {}
