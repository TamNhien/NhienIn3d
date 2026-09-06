import { IsInt, IsOptional, IsString, Max, MaxLength, Min, Matches } from "class-validator";

export class DecideProbeRolloutV3210Dto {
  @IsString() @Matches(/^[A-Za-z0-9-]{20,80}$/)
  proposal_id!: string;

  @IsOptional() @IsString() @MaxLength(1000)
  note?: string;
}

export class AcknowledgeRemediationV3210Dto {
  @IsString() @Matches(/^[a-z0-9._-]{2,80}$/)
  service!: string;

  @IsOptional() @IsString() @MaxLength(1000)
  note?: string;

  @IsOptional() @IsInt() @Min(1) @Max(168)
  snooze_hours?: number;
}
