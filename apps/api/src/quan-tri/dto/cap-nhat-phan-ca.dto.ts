import { IsIn, IsOptional, IsString, Length } from "class-validator";

export class CapNhatPhanCaDto {
  @IsOptional() @IsIn(["DA_XEP", "DA_XAC_NHAN", "DA_HOAN_THANH", "VANG_MAT", "DA_HUY"])
  trang_thai?: "DA_XEP" | "DA_XAC_NHAN" | "DA_HOAN_THANH" | "VANG_MAT" | "DA_HUY";
  @IsOptional() @IsString() @Length(0, 500) ghi_chu?: string;
}
