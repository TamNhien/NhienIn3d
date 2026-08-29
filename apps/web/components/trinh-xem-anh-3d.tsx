"use client";

import { useRef, useState } from "react";

type Props = {
  duong_dan_anh?: string;
  ten_san_pham: string;
};

const GOC_X_MAC_DINH = -5;
const GOC_Y_MAC_DINH = 14;

export function TrinhXemAnh3D({ duong_dan_anh, ten_san_pham }: Props) {
  const [che_do, setCheDo] = useState<"anh" | "3d">("3d");
  const [goc_x, setGocX] = useState(GOC_X_MAC_DINH);
  const [goc_y, setGocY] = useState(GOC_Y_MAC_DINH);
  const [zoom, setZoom] = useState(1);
  const dang_keo = useRef(false);
  const diem_cu = useRef({ x: 0, y: 0 });

  function datLai() {
    setGocX(GOC_X_MAC_DINH);
    setGocY(GOC_Y_MAC_DINH);
    setZoom(1);
  }

  if (!duong_dan_anh) {
    return <div className="product-main-image product-media-empty">Chưa có hình ảnh sản phẩm</div>;
  }

  return <div className="product-media-shell">
    <div className="product-media-toolbar" aria-label="Chế độ xem sản phẩm">
      <button className={che_do === "anh" ? "active" : ""} onClick={() => setCheDo("anh")}>Ảnh</button>
      <button className={che_do === "3d" ? "active" : ""} onClick={() => setCheDo("3d")}>Xem 3D</button>
      {che_do === "3d" && <button className="media-reset" onClick={datLai}>Đặt lại</button>}
    </div>

    {che_do === "anh" ? <div className="product-main-image">
      <img src={duong_dan_anh} alt={ten_san_pham} referrerPolicy="no-referrer"/>
    </div> : <div
      className="product-image-3d-stage"
      onPointerDown={(event) => {
        dang_keo.current = true;
        diem_cu.current = { x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!dang_keo.current) return;
        const dx = event.clientX - diem_cu.current.x;
        const dy = event.clientY - diem_cu.current.y;
        diem_cu.current = { x: event.clientX, y: event.clientY };
        setGocY(value => Math.max(-42, Math.min(42, value + dx * 0.16)));
        setGocX(value => Math.max(-30, Math.min(30, value - dy * 0.12)));
      }}
      onPointerUp={() => { dang_keo.current = false; }}
      onPointerCancel={() => { dang_keo.current = false; }}
      onWheel={(event) => {
        const huong = event.deltaY > 0 ? -0.08 : 0.08;
        setZoom(value => Math.max(.78, Math.min(1.55, value + huong)));
      }}
      onDoubleClick={datLai}
      role="application"
      aria-label={`Trình xem ảnh 3D tương tác của ${ten_san_pham}`}
    >
      <div
        className="product-image-3d-card"
        style={{ transform: `rotateX(${goc_x}deg) rotateY(${goc_y}deg) scale(${zoom})` }}
      >
        {[18,15,12,9,6,3].map((do_sau, index) => <img
          key={do_sau}
          className="product-image-3d-layer"
          src={duong_dan_anh}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          style={{ transform: `translateZ(-${do_sau}px)`, opacity: .16 + index * .045 }}
        />)}
        <img className="product-image-3d-front" src={duong_dan_anh} alt={ten_san_pham} referrerPolicy="no-referrer"/>
      </div>
      <div className="product-image-3d-light"/>
      <div className="product-image-3d-help">Kéo để xoay • lăn để zoom • nhấp đúp để đặt lại</div>
    </div>}

    {che_do === "3d" && <p className="product-media-note">Chế độ 3D mô phỏng chiều sâu từ ảnh sản phẩm để quan sát trực quan hơn. Model GLB/GLTF thật có thể được bổ sung cho từng sản phẩm ở các phiên bản tiếp theo.</p>}
  </div>;
}
