import { IsIn, IsOptional, IsString, Length } from "class-validator";

export class CapNhatTrangThaiDonHangDto {
  @IsIn(["CHO_XAC_NHAN", "DA_XAC_NHAN", "DANG_SAN_XUAT", "DANG_GIAO", "HOAN_TAT", "DA_HUY"])
  trang_thai!: "CHO_XAC_NHAN" | "DA_XAC_NHAN" | "DANG_SAN_XUAT" | "DANG_GIAO" | "HOAN_TAT" | "DA_HUY";

  @IsOptional() @IsString() @Length(0, 500)
  ghi_chu?: string;
}
