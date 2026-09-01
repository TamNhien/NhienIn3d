import { IsArray, IsBoolean, IsIn, IsISO8601, IsOptional, IsString, MaxLength } from "class-validator";

export class TaoBaoTriNangCaoDto {
  @IsString() @MaxLength(120)
  ten!: string;

  @IsBoolean()
  bat!: boolean;

  @IsISO8601({ strict: true })
  bat_dau!: string;

  @IsISO8601({ strict: true })
  ket_thuc!: string;

  @IsOptional() @IsIn(["KHONG", "HANG_NGAY", "HANG_TUAN"])
  lap_lai?: "KHONG" | "HANG_NGAY" | "HANG_TUAN";

  @IsOptional() @IsString() @MaxLength(500)
  ly_do?: string;
}

export class CapNhatBaoTriNangCaoDto {
  @IsOptional() @IsString() @MaxLength(120)
  ten?: string;

  @IsOptional() @IsBoolean()
  bat?: boolean;

  @IsOptional() @IsISO8601({ strict: true })
  bat_dau?: string;

  @IsOptional() @IsISO8601({ strict: true })
  ket_thuc?: string;

  @IsOptional() @IsIn(["KHONG", "HANG_NGAY", "HANG_TUAN"])
  lap_lai?: "KHONG" | "HANG_NGAY" | "HANG_TUAN";

  @IsOptional() @IsString() @MaxLength(500)
  ly_do?: string;
}

export class XoaBaoTriNangCaoDto {
  @IsBoolean()
  xac_nhan!: boolean;
}
