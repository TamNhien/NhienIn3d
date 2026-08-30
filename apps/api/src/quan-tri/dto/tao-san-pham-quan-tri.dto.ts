import { Type } from "class-transformer";
import { IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Length, Matches, Max, MaxLength, Min } from "class-validator";

export class TaoSanPhamQuanTriDto {
  @IsString()
  @Length(3, 50)
  @Matches(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, { message: "Mã sản phẩm chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang" })
  ma_san_pham!: string;

  @IsString()
  @Length(2, 200)
  ten_san_pham!: string;

  @IsUUID()
  danh_muc_id!: string;

  @IsOptional()
  @IsString()
  @Length(0, 700)
  mo_ta_ngan?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  gia_ban!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  kich_thuoc?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  khoi_luong_gam?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  thoi_gian_in_gio?: number;

  @IsOptional()
  @IsIn(["NHAP", "DANG_BAN", "TAM_AN", "NGUNG_BAN"])
  trang_thai?: "NHAP" | "DANG_BAN" | "TAM_AN" | "NGUNG_BAN";

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000000)
  so_luong_ton!: number;

  @IsString()
  @MaxLength(1800000)
  anh_chinh_data_url!: string;
}
