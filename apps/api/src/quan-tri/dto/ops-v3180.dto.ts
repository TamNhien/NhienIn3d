import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class DuyetIncidentPostmortemDto {
  @IsString() @IsIn(["APPROVED", "CHANGES_REQUESTED"])
  decision!: "APPROVED" | "CHANGES_REQUESTED";

  @IsOptional() @IsString() @MaxLength(1000)
  note?: string;
}
