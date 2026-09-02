import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class TaoProbeEnrollmentTokenDto {
  @IsString() @MaxLength(80)
  agent_id!: string;

  @IsString() @MaxLength(80)
  region!: string;

  @IsString() @MaxLength(120)
  node_name!: string;

  @IsOptional() @IsInt() @Min(5) @Max(1440)
  expires_minutes?: number;
}

export class ProbeAgentEnrollDto {
  @IsString() @MaxLength(4096)
  token!: string;

  @IsString() @MaxLength(80)
  agent_id!: string;

  @IsString() @MaxLength(80)
  region!: string;

  @IsString() @MaxLength(120)
  node_name!: string;

  @IsString() @MaxLength(80)
  key_id!: string;

  @IsString() @MaxLength(4096)
  public_key!: string;
}
