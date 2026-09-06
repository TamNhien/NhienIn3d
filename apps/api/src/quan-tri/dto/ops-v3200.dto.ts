import { IsOptional, IsString, MaxLength, Matches } from "class-validator";

export class ApproveProbeRolloutV3200Dto {
  @IsString() @Matches(/^[A-Za-z0-9-]{20,80}$/)
  proposal_id!: string;

  @IsOptional() @IsString() @MaxLength(1000)
  note?: string;
}
