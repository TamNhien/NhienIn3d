import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CapNhatGioHangDto } from "./dto/cap-nhat-gio-hang.dto.js";
import { ThemVaoGioHangDto } from "./dto/them-vao-gio-hang.dto.js";
import { GioHangService } from "./gio-hang.service.js";

@ApiTags("Giỏ hàng")
@Controller("gio-hang")
export class GioHangController {
  constructor(private readonly service: GioHangService) {}

  @Post()
  tao() { return this.service.tao(); }

  @Get(":ma_phien")
  lay(@Param("ma_phien") ma_phien: string) { return this.service.lay(ma_phien); }

  @Post(":ma_phien/them")
  them(@Param("ma_phien") ma_phien: string, @Body() dto: ThemVaoGioHangDto) {
    return this.service.them(ma_phien, dto);
  }

  @Patch(":ma_phien/chi-tiet/:chi_tiet_id")
  cap_nhat(@Param("ma_phien") ma_phien: string, @Param("chi_tiet_id") chi_tiet_id: string, @Body() dto: CapNhatGioHangDto) {
    return this.service.capNhat(ma_phien, chi_tiet_id, dto);
  }

  @Delete(":ma_phien/chi-tiet/:chi_tiet_id")
  xoa(@Param("ma_phien") ma_phien: string, @Param("chi_tiet_id") chi_tiet_id: string) {
    return this.service.xoa(ma_phien, chi_tiet_id);
  }
}
