import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from "class-validator";

export class TaoOpsOnCallScheduleDto {
  @IsString() @MaxLength(80)
  dich_vu!: string;

  @IsUUID()
  nguoi_dung_id!: string;

  @IsInt() @Min(0) @Max(6)
  thu_trong_tuan!: number;

  @IsInt() @Min(0) @Max(1439)
  bat_dau_phut!: number;

  @IsInt() @Min(0) @Max(1439)
  ket_thuc_phut!: number;

  @IsOptional() @IsString() @MaxLength(80)
  timezone?: string;

  @IsOptional() @IsInt() @Min(1) @Max(5)
  cap_escalation?: number;

  @IsOptional() @IsBoolean()
  dang_hoat_dong?: boolean;
}

export class UpsertOpsEscalationPolicyDto {
  @IsString() @MaxLength(80)
  dich_vu!: string;

  @IsInt() @Min(1) @Max(5)
  cap_escalation!: number;

  @IsInt() @Min(0) @Max(10080)
  sau_phut!: number;

  @IsOptional() @IsIn(["EMAIL", "WEBHOOK", "EMAIL_WEBHOOK"])
  kenh?: "EMAIL" | "WEBHOOK" | "EMAIL_WEBHOOK";

  @IsOptional() @IsBoolean()
  dang_hoat_dong?: boolean;
}

export class GanChuSoHuuIncidentDto {
  @IsOptional() @IsUUID()
  nguoi_dung_id?: string;

  @IsOptional() @IsString() @MaxLength(80)
  dich_vu?: string;
}

export class TaoWebhookReplayJobDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100)
  @IsString({ each: true })
  ids!: string[];

  @IsOptional() @IsBoolean()
  bo_qua_idempotency?: boolean;
}

export class RotateDlqKeyDto {
  @IsOptional() @IsInt() @Min(1) @Max(500)
  gioi_han?: number;
}

export class OpsArchiveDto {
  @IsIn(["lich_su_van_hanh", "slo_endpoint_mau"])
  bang_nguon!: "lich_su_van_hanh" | "slo_endpoint_mau";

  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  thang!: string;
}
