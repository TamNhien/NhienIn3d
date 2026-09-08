import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class DongDoiTraV3290Dto {
  @IsUUID() chi_tiet_don_hang_id!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(100000) so_luong!: number;
  @IsIn(["HOAN_TIEN", "DOI_HANG"]) xu_ly!: "HOAN_TIEN" | "DOI_HANG";
  @IsOptional() @IsBoolean() nhap_lai_ton?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(1000000000) so_tien_hoan_duyet?: number;
  @IsOptional() @IsString() @MaxLength(500) ly_do?: string;
}

export class TaoYeuCauDoiTraV3290Dto {
  @IsString() @MaxLength(500) ly_do!: string;
  @IsOptional() @IsString() @MaxLength(1000) ghi_chu?: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => DongDoiTraV3290Dto) dong!: DongDoiTraV3290Dto[];
}

export class NhanHangDoiTraDongV3290Dto {
  @IsUUID() chi_tiet_doi_tra_id!: string;
  @Type(() => Number) @IsInt() @Min(0) @Max(100000) so_luong_nhan!: number;
}

export class NhanHangDoiTraV3290Dto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => NhanHangDoiTraDongV3290Dto) dong!: NhanHangDoiTraDongV3290Dto[];
  @IsOptional() @IsString() @MaxLength(1000) ghi_chu?: string;
}

export class XacNhanHoanTienMotPhanV3290Dto {
  @Type(() => Number) @IsNumber() @Min(1) @Max(1000000000) so_tien!: number;
  @IsOptional() @IsString() @MaxLength(500) ghi_chu?: string;
}

export class CapNhatTrangThaiDoiTraV3290Dto {
  @IsIn(["DA_DUYET", "HUY", "HOAN_TAT"]) trang_thai!: "DA_DUYET" | "HUY" | "HOAN_TAT";
  @IsOptional() @IsString() @MaxLength(500) ghi_chu?: string;
}
