import { IsIn, IsOptional, IsString, IsUUID, Length, Matches } from "class-validator";

export class CapNhatPhanCaDto {
  @IsOptional() @IsUUID() nhan_vien_id?: string;
  @IsOptional() @IsUUID() ca_lam_viec_id?: string;
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) ngay_lam?: string;
  @IsOptional() @IsIn(["DA_XEP", "DA_XAC_NHAN", "DA_HOAN_THANH", "VANG_MAT", "DA_HUY"])
  trang_thai?: "DA_XEP" | "DA_XAC_NHAN" | "DA_HOAN_THANH" | "VANG_MAT" | "DA_HUY";
  @IsOptional() @IsString() @Length(0, 500) ghi_chu?: string;
}
