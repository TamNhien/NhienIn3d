import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator";

export class CapNhatProbeDesiredStateDto {
  @IsString() @MaxLength(40)
  @Matches(/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9._-]+)?$/)
  target_version!: string;

  @IsInt() @Min(30) @Max(3600)
  interval_seconds!: number;

  @IsInt() @Min(0) @Max(100)
  rollout_percent!: number;

  @IsArray() @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  canary_agents!: string[];

  @IsBoolean()
  paused!: boolean;

  @IsOptional() @IsString() @MaxLength(500)
  note?: string;
}

export class LuuIncidentPostmortemDto {
  @IsString() @MaxLength(2000)
  summary!: string;

  @IsString() @MaxLength(4000)
  impact!: string;

  @IsString() @MaxLength(4000)
  root_cause!: string;

  @IsString() @MaxLength(4000)
  detection!: string;

  @IsString() @MaxLength(4000)
  resolution!: string;

  @IsOptional() @IsString() @MaxLength(500)
  runbook_url?: string;

  @IsOptional() @IsString() @MaxLength(4000)
  lessons?: string;

  @IsArray() @ArrayMaxSize(50)
  action_items!: Array<Record<string, unknown>>;
}
