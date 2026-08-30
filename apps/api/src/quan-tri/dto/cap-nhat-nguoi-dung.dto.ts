import { IsBoolean, IsOptional, IsString, Length, Matches, ValidateIf } from "class-validator";

export class CapNhatNguoiDungDto {
  @IsOptional() @IsString() @Length(2, 150) ho_ten?: string;
  @IsOptional() @IsString() @ValidateIf((_o, value) => value !== "") @Matches(/^[0-9+()\-\s]{8,30}$/) so_dien_thoai?: string;
  @IsOptional() @IsBoolean() da_kich_hoat?: boolean;
}
