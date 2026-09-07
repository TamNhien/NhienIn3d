import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class DongDonMuaHangV3280Dto {
  @IsUUID() bien_the_id!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(1000000) so_luong_dat!: number;
  @Type(() => Number) @IsNumber() @Min(0) @Max(1000000000) don_gia_nhap!: number;
  @IsOptional() @IsString() @MaxLength(300) ghi_chu?: string;
}
export class TaoDonMuaHangV3280Dto {
  @IsUUID() nha_cung_cap_id!: string;
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) @MaxLength(10) ngay_du_kien?: string;
  @IsOptional() @IsString() @MaxLength(1000) ghi_chu?: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200) @ValidateNested({each:true}) @Type(() => DongDonMuaHangV3280Dto) dong!: DongDonMuaHangV3280Dto[];
}
export class CapNhatTrangThaiDonMuaV3280Dto {
  @IsIn(["DA_DUYET","DA_DAT","HUY"]) trang_thai!: "DA_DUYET"|"DA_DAT"|"HUY";
  @IsOptional() @IsString() @MaxLength(1000) ghi_chu?: string;
}
