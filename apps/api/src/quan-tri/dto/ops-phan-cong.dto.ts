import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";

export class TaoOpsPhanCongDto {
  @IsUUID()
  nguoi_dung_id!: string;

  @IsString()
  @MaxLength(80)
  dich_vu!: string;

  @IsIn(["OPS_VIEWER", "ON_CALL", "SERVICE_OWNER"])
  vai_tro_ops!: "OPS_VIEWER" | "ON_CALL" | "SERVICE_OWNER";

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  cap_escalation?: number;

  @IsOptional()
  @IsBoolean()
  dang_hoat_dong?: boolean;
}

export class CapNhatOpsPhanCongDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  cap_escalation?: number;

  @IsOptional()
  @IsBoolean()
  dang_hoat_dong?: boolean;
}
