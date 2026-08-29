import { Module } from "@nestjs/common";
import { SucKhoeController } from "./suc-khoe.controller.js";
@Module({ controllers: [SucKhoeController] })
export class SucKhoeModule {}
