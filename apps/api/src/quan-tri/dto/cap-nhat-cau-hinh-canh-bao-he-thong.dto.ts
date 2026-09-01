import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CapNhatCauHinhCanhBaoHeThongDto {
  @IsBoolean()
  bat!: boolean;

  @IsInt() @Min(15) @Max(1440)
  chu_ky_phut!: number;

  @IsInt() @Min(6) @Max(720)
  backup_qua_han_gio!: number;

  @IsInt() @Min(15) @Max(10080)
  im_lang_phut!: number;

  @IsInt() @Min(60) @Max(43200)
  leo_thang_phut!: number;

  @IsOptional() @IsString() @MaxLength(1000)
  nguoi_nhan?: string;
}
