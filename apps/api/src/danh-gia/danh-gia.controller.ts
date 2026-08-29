import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { DanhGiaService } from "./danh-gia.service.js";
import { LuuDanhGiaDto } from "./dto/luu-danh-gia.dto.js";

@ApiTags("Đánh giá sản phẩm")
@Controller("danh-gia")
export class DanhGiaController {
  constructor(private readonly service: DanhGiaService) {}

  @Get("san-pham/:duong_dan")
  danh_sach(@Param("duong_dan") duong_dan: string) { return this.service.danhSach(duong_dan); }

  @Post("san-pham/:duong_dan")
  luu(@Param("duong_dan") duong_dan: string, @Body() dto: LuuDanhGiaDto) { return this.service.luu(duong_dan, dto); }
}
