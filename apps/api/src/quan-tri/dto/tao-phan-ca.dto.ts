import { IsOptional, IsString, IsUUID, Length, Matches } from "class-validator";

export class TaoPhanCaDto {
  @IsUUID() nhan_vien_id!: string;
  @IsUUID() ca_lam_viec_id!: string;
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) ngay_lam!: string;
  @IsOptional() @IsString() @Length(0, 500) ghi_chu?: string;
}
