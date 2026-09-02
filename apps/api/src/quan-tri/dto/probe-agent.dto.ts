import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsObject, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from "class-validator";

export class ProbeAgentHeartbeatDto {
  @IsString() @MaxLength(80)
  agent_id!: string;

  @IsString() @MaxLength(80)
  region!: string;

  @IsString() @MaxLength(120)
  node_name!: string;

  @IsOptional() @IsString() @MaxLength(40)
  phien_ban?: string;

  @IsOptional() @IsObject()
  metadata?: Record<string, unknown>;
}

export class ProbeAgentSampleDto {
  @IsString() @MaxLength(80)
  endpoint_id!: string;

  @IsIn(["TOT", "LOI", "CANH_BAO"])
  trang_thai!: "TOT" | "LOI" | "CANH_BAO";

  @IsOptional() @IsInt() @Min(100) @Max(599)
  http_status?: number;

  @IsNumber() @Min(0) @Max(600000)
  do_tre_ms!: number;

  @IsInt() @Min(1) @Max(600000)
  latency_target_ms!: number;

  @IsOptional() @IsBoolean()
  maintenance_active?: boolean;

  @IsOptional() @IsString() @MaxLength(40)
  observed_at?: string;
}

export class ProbeAgentIngestDto extends ProbeAgentHeartbeatDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProbeAgentSampleDto)
  samples!: ProbeAgentSampleDto[];
}
