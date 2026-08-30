import { IsIn, IsOptional, IsString, Length } from "class-validator";

export class CapNhatNhanVienDto {
  @IsOptional() @IsIn(["DANG_LAM", "TAM_NGHI", "NGHI_VIEC"]) trang_thai?: "DANG_LAM" | "TAM_NGHI" | "NGHI_VIEC";
  @IsOptional() @IsString() @Length(0, 500) ghi_chu?: string;
}
