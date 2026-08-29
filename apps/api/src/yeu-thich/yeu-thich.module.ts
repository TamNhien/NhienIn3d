import { Module } from "@nestjs/common";
import { YeuThichController } from "./yeu-thich.controller.js";
import { YeuThichService } from "./yeu-thich.service.js";

@Module({ controllers: [YeuThichController], providers: [YeuThichService] })
export class YeuThichModule {}
