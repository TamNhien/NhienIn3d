import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested } from "class-validator";

export class DongKiemKeKhoV3260Dto {
  @IsUUID()
  bien_the_id!: string;

  @Type(() => Number) @IsInt() @Min(0) @Max(1000000)
  ton_he_thong!: number;

  @Type(() => Number) @IsInt() @Min(0) @Max(1000000)
  ton_thuc_te!: number;

  @IsOptional() @IsString() @MaxLength(300)
  ly_do?: string;
}

export class KiemKeKhoV3260Dto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200)
  @ValidateNested({ each: true }) @Type(() => DongKiemKeKhoV3260Dto)
  dong!: DongKiemKeKhoV3260Dto[];
}
