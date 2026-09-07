import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { KiemKeKhoV3260Dto } from "./kiem-ke-kho-v3260.dto.js";
export class TaoPhienKiemKeV3280Dto extends KiemKeKhoV3260Dto {
  @IsOptional() @IsString() @MaxLength(1000) ghi_chu?: string;
}
export class PhienKiemKeIdV3280Dto { @IsUUID() id!: string; }
