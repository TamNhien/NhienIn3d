import { IsIn, IsOptional, IsString, Length } from "class-validator";

export class CapNhatNhanVienDto {
  @IsOptional() @IsString() @Length(2, 120) chuc_danh?: string;
  @IsOptional() @IsString() @Length(2, 120) bo_phan?: string;
  @IsOptional() @IsIn(["DANG_LAM", "TAM_NGHI", "NGHI_VIEC"]) trang_thai?: "DANG_LAM" | "TAM_NGHI" | "NGHI_VIEC";
  @IsOptional() @IsString() @Length(0, 500) ghi_chu?: string;
}
