import { IsOptional, IsString, Length } from "class-validator";

export class XacNhanDangNhapMfaDto {
  @IsString() @Length(20, 3000) thu_thach!: string;
  @IsString() @Length(6, 8) ma_otp!: string;
  @IsOptional() @IsString() @Length(2, 160) trinh_duyet_hien_thi?: string;
}

export class MaOtpMfaDto {
  @IsString() @Length(6, 8) ma_otp!: string;
}

export class TatMfaDto {
  @IsString() @Length(8, 200) mat_khau!: string;
  @IsString() @Length(6, 8) ma_otp!: string;
}
