import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { XacThucController } from "./xac-thuc.controller.js";
import { XacThucService } from "./xac-thuc.service.js";
@Module({ imports: [JwtModule.register({})], controllers: [XacThucController], providers: [XacThucService] })
export class XacThucModule {}
