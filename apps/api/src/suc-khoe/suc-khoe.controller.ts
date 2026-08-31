import { Controller, Get } from "@nestjs/common";
@Controller("suc-khoe")
export class SucKhoeController {
  @Get() kiem_tra() { return { trang_thai: "Tốt", dich_vu: "NhienIn3d API", phien_ban: "v3.2.1", thoi_gian: new Date().toISOString() }; }
}
