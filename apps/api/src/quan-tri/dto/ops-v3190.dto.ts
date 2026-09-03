import { IsOptional, IsString, MaxLength } from "class-validator";

export class ApproveProbeRollbackV3190Dto {
  @IsOptional() @IsString() @MaxLength(1000)
  note?: string;
}
