export type SanPham = {
  ma_san_pham: string;
  ten_san_pham: string;
  duong_dan: string;
  mo_ta_ngan: string;
  gia_ban: number | string;
  kich_thuoc: string;
  thoi_gian_in_gio: number | string;
  khoi_luong_gam: number | string;
  hinh_anh: { duong_dan_anh: string }[];
  danh_muc?: { ten_danh_muc: string };
  bien_the?: {
    ma_bien_the: string;
    gia_chenh_lech: number | string;
    so_luong_ton: number;
    vat_lieu?: { ten_vat_lieu: string };
    mau_sac?: { ten_mau: string; ma_hex: string };
  }[];
};
export const DU_LIEU_MAU: SanPham[] = [
  ["N3D-RC-001","Xe RC Dragon R1 in 3D","xe-rc-dragon-r1-in-3d","Mẫu xe RC mã nguồn mở với nhiều chi tiết có thể in 3D và lắp ráp.",1490000,"330 × 180 × 120 mm",31,780,"https://media.printables.com/media/prints/240045/images/2175581_572d92ae-a3c7-42b1-afcb-ce10c328c366/cover-photo5.jpg"],
  ["N3D-DESK-002","Giá đỡ điện thoại bánh răng","gia-do-dien-thoai-banh-rang","Giá đỡ điện thoại cơ khí với cơ cấu bánh răng.",179000,"110 × 85 × 105 mm",4.5,95,"https://media.printables.com/media/prints/1202776/rich_content/b35b7b3f-bd33-4b27-89f0-1619fb05ae3c/img20250222184203.jpg"],
  ["N3D-DECOR-003","Chậu cây xoắn ốc hiện đại","chau-cay-xoan-oc-hien-dai","Chậu cây decor với bề mặt xoắn hiện đại.",299000,"Ø140 × 125 mm",8.2,210,"https://media.printables.com/media/prints/225251/images/2056517_ec46c87c-5ed1-44ed-b8c6-64dcaed597cc/thumbs/cover/1200x630/jpg/dsc06287.jpg"],
  ["N3D-DESK-004","Hộp cuộn cáp di động","hop-cuon-cap-di-dong","Phụ kiện quản lý cáp nhỏ gọn cho balo và bàn làm việc.",79000,"72 × 72 × 20 mm",1.9,42,"https://media.printables.com/media/prints/564262/images/4519813_011a7764-e3f5-4b41-83f1-61dc9644ff2f/thumbs/inside/1280x960/jpg/20230826_083819.webp"],
  ["N3D-GAME-005","Giá treo tai nghe đôi","gia-treo-tai-nghe-doi","Giá đỡ hai tai nghe cho gaming setup.",399000,"220 × 140 × 260 mm",10.5,290,"https://media.printables.com/media/prints/358656/images/3036990_1df0d722-47bc-4538-acb4-70a96dadd277/thumbs/inside/1280x960/jpeg/img_3710-2.webp"],
  ["N3D-LAMP-006","Chụp đèn Radiant","chup-den-radiant","Chụp đèn in 3D tạo vân sáng mềm cho không gian decor.",349000,"Ø170 × 190 mm",9.1,175,"https://media.printables.com/media/prints/891112/images/6822414_668058dc-1545-4fe5-afc2-536376ef1a25_b912f430-7e2a-4b14-a6cb-d7802c43fb1a/large_display_5fef9ca6-3f06-4bb7-90c1-9d610e21d1a0_891112.png"],
  ["N3D-TOY-007","Khối lập phương bánh răng","khoi-lap-phuong-banh-rang","Mô hình cơ khí cầm tay với nhiều bánh răng liên kết.",199000,"82 × 82 × 82 mm",6.4,135,"https://media.sketchfab.com/models/7f98240fd6d7462e9f57028b54e33bae/thumbnails/f9e86e9ff3204de59780f5fccc4ad401/b5f05db381004883a9a3b37d1437fcdd.jpeg"],
  ["N3D-ORG-008","Khay Gridfinity đa năng","khay-gridfinity-da-nang","Khay mô-đun để sắp xếp linh kiện và dụng cụ nhỏ.",129000,"84 × 84 × 56 mm",3.4,88,"https://media.printables.com/media/prints/522794/images/4228859_4b44b288-f1e0-4da0-b6f8-ce4908f3836f/thumbs/inside/1280x960/jpg/20230708_102805.webp"],
  ["N3D-GIFT-009","Đèn Lithophane theo ảnh","den-lithophane-theo-anh","Đèn ảnh nổi cá nhân hóa từ ảnh khách hàng.",449000,"150 × 150 × 180 mm",12.8,240,"https://media.printables.com/media/prints/884768/images/6779132_4696d008-34b2-401d-9c0b-321bff0f3ee9_25123318-9076-4c07-ae56-aa7fa0e01af1/2023-11-25_0b926c2790b63.webp"],
  ["N3D-MAKER-010","Vỏ Raspberry Pi 5 thoáng khí","vo-raspberry-pi-5-thoang-khi","Vỏ Raspberry Pi 5 có khe thông gió và đủ cổng kết nối.",249000,"100 × 72 × 40 mm",4.8,105,"https://media.printables.com/media/prints/742926/images/5800894_5fd750c3-9554-4676-904f-102be0b36c87_8d786ac5-674f-450b-bd34-081f4410b4c6/rpi-5-render-10.jpg"]
].map(([ma_san_pham,ten_san_pham,duong_dan,mo_ta_ngan,gia_ban,kich_thuoc,thoi_gian_in_gio,khoi_luong_gam,anh]) => ({
  ma_san_pham,
  ten_san_pham,
  duong_dan,
  mo_ta_ngan,
  gia_ban,
  kich_thuoc,
  thoi_gian_in_gio,
  khoi_luong_gam,
  hinh_anh:[{duong_dan_anh:anh}],
  bien_the:[{ma_bien_the:`${ma_san_pham}-BT01`,gia_chenh_lech:0,so_luong_ton:10}]
} as SanPham));
