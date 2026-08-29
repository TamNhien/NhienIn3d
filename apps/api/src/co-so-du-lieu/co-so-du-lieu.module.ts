import { Global, Module } from "@nestjs/common";
import { CoSoDuLieuService } from "./co-so-du-lieu.service.js";

@Global()
@Module({ providers: [CoSoDuLieuService], exports: [CoSoDuLieuService] })
export class CoSoDuLieuModule {}
