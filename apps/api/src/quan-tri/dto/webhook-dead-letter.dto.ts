import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class AckWebhookDeadLetterDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ghi_chu?: string;
}

export class ReplayBulkWebhookDeadLetterDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  ids!: string[];

  @IsOptional()
  @IsBoolean()
  bo_qua_idempotency?: boolean;
}
