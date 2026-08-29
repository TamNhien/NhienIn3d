"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls, RoundedBox } from "@react-three/drei";
import { useMemo, useState } from "react";
import { DoubleSide } from "three";

const PI = Math.PI;

type Props = {
  duong_dan_anh?: string;
  ten_san_pham: string;
  ma_san_pham?: string;
};

type Mau = {
  chinh: string;
  phu: string;
  diem: string;
};

const BANG_MAU: Record<string, Mau> = {
  "N3D-RC-001": { chinh: "#f97316", phu: "#111827", diem: "#22d3ee" },
  "N3D-DESK-002": { chinh: "#e5e7eb", phu: "#64748b", diem: "#8b5cf6" },
  "N3D-DECOR-003": { chinh: "#f59e0b", phu: "#fb7185", diem: "#22d3ee" },
  "N3D-DESK-004": { chinh: "#64748b", phu: "#0f172a", diem: "#38bdf8" },
  "N3D-GAME-005": { chinh: "#dc2626", phu: "#111827", diem: "#f8fafc" },
  "N3D-LAMP-006": { chinh: "#fde68a", phu: "#f8fafc", diem: "#f59e0b" },
  "N3D-TOY-007": { chinh: "#ef4444", phu: "#38bdf8", diem: "#f8fafc" },
  "N3D-ORG-008": { chinh: "#2563eb", phu: "#f97316", diem: "#e2e8f0" },
  "N3D-GIFT-009": { chinh: "#f8fafc", phu: "#c4b5fd", diem: "#fbbf24" },
  "N3D-MAKER-010": { chinh: "#111827", phu: "#334155", diem: "#22c55e" }
};

function VatLieu({ mau, kim_loai = 0.05, do_nham = 0.35 }: { mau: string; kim_loai?: number; do_nham?: number }) {
  return <meshStandardMaterial color={mau} metalness={kim_loai} roughness={do_nham}/>;
}

function BanhXe({ vi_tri }: { vi_tri: [number, number, number] }) {
  return <mesh position={vi_tri} rotation={[PI / 2, 0, 0]} castShadow>
    <cylinderGeometry args={[0.38, 0.38, 0.32, 28]}/>
    <meshStandardMaterial color="#111827" roughness={0.68}/>
  </mesh>;
}

function XeRc({ mau }: { mau: Mau }) {
  return <group rotation={[0.04, -0.18, 0]}>
    <RoundedBox args={[2.8, 0.55, 1.35]} radius={0.16} smoothness={5} position={[0, -0.18, 0]} castShadow><VatLieu mau={mau.chinh}/></RoundedBox>
    <RoundedBox args={[1.35, 0.6, 1.05]} radius={0.2} smoothness={5} position={[0.15, 0.38, 0]} castShadow><VatLieu mau={mau.phu}/></RoundedBox>
    <RoundedBox args={[0.75, 0.28, 0.98]} radius={0.12} smoothness={4} position={[-1.18, 0.12, 0]} castShadow><VatLieu mau={mau.diem} kim_loai={0.15}/></RoundedBox>
    {([-1.05, 1.05] as const).flatMap(x => ([-0.77, 0.77] as const).map(z => <BanhXe key={`${x}-${z}`} vi_tri={[x, -0.48, z]}/>))}
  </group>;
}

function GiaDienThoai({ mau }: { mau: Mau }) {
  return <group rotation={[0, -0.25, 0]}>
    <RoundedBox args={[2.15, 0.24, 1.45]} radius={0.12} smoothness={4} position={[0, -0.92, 0]} castShadow><VatLieu mau={mau.phu}/></RoundedBox>
    <RoundedBox args={[1.5, 2.15, 0.2]} radius={0.16} smoothness={5} position={[0, 0.08, 0.2]} rotation={[-0.2, 0, 0]} castShadow><VatLieu mau={mau.chinh}/></RoundedBox>
    <RoundedBox args={[1.62, 0.25, 0.38]} radius={0.1} smoothness={4} position={[0, -0.62, 0.65]} castShadow><VatLieu mau={mau.diem}/></RoundedBox>
    <mesh position={[0, -0.72, -0.2]} rotation={[PI / 2, 0, 0]} castShadow><torusGeometry args={[0.38, 0.1, 12, 32]}/><VatLieu mau={mau.diem}/></mesh>
  </group>;
}

function ChauXoan({ mau }: { mau: Mau }) {
  const vong = useMemo(() => Array.from({ length: 9 }, (_, i) => i), []);
  return <group rotation={[0.02, 0.16, 0]}>
    <mesh castShadow><cylinderGeometry args={[1.05, 0.78, 1.75, 48]}/><VatLieu mau={mau.chinh}/></mesh>
    {vong.map(i => <mesh key={i} position={[0, -0.72 + i * 0.18, 0]} rotation={[PI / 2, 0, i * 0.2]} castShadow>
      <torusGeometry args={[0.9 - i * 0.015, 0.055, 10, 48]}/><VatLieu mau={i % 2 ? mau.phu : mau.diem}/>
    </mesh>)}
    <mesh position={[0, 0.86, 0]} rotation={[PI / 2, 0, 0]}><torusGeometry args={[0.94, 0.09, 14, 48]}/><VatLieu mau={mau.phu}/></mesh>
  </group>;
}

function HopCuonCap({ mau }: { mau: Mau }) {
  return <group rotation={[0.08, -0.25, 0]}>
    <RoundedBox args={[2.2, 0.5, 2.2]} radius={0.35} smoothness={8} castShadow><VatLieu mau={mau.chinh}/></RoundedBox>
    <mesh position={[0, 0.28, 0]} rotation={[PI / 2, 0, 0]}><torusGeometry args={[0.58, 0.16, 16, 48]}/><VatLieu mau={mau.diem}/></mesh>
    <mesh position={[0, 0.32, 0]} rotation={[PI / 2, 0, 0]}><cylinderGeometry args={[0.25, 0.25, 0.12, 32]}/><VatLieu mau={mau.phu}/></mesh>
  </group>;
}

function GiaTaiNghe({ mau }: { mau: Mau }) {
  return <group>
    <RoundedBox args={[2.2, 0.22, 1.4]} radius={0.14} smoothness={5} position={[0, -1.15, 0]} castShadow><VatLieu mau={mau.phu}/></RoundedBox>
    <RoundedBox args={[0.28, 2.35, 0.3]} radius={0.12} smoothness={4} position={[0, 0, 0]} castShadow><VatLieu mau={mau.chinh}/></RoundedBox>
    <RoundedBox args={[2.25, 0.28, 0.48]} radius={0.16} smoothness={5} position={[0, 1.05, 0]} castShadow><VatLieu mau={mau.chinh}/></RoundedBox>
    {[-0.78, 0.78].map(x => <mesh key={x} position={[x, 0.76, 0.04]} rotation={[PI / 2, 0, 0]}><torusGeometry args={[0.34, 0.08, 12, 32, PI]}/><VatLieu mau={mau.diem}/></mesh>)}
  </group>;
}

function ChupDen({ mau }: { mau: Mau }) {
  return <group>
    <pointLight color="#fde68a" intensity={12} distance={5}/>
    <mesh castShadow><cylinderGeometry args={[0.72, 1.18, 2.15, 48, 1, true]}/><meshStandardMaterial color={mau.chinh} roughness={0.42} transparent opacity={0.78} side={DoubleSide}/></mesh>
    {[-0.75, -0.25, 0.25, 0.75].map((y, i) => <mesh key={y} position={[0, y, 0]} rotation={[PI / 2, 0, 0]}><torusGeometry args={[0.9 + (y < 0 ? -y * 0.18 : -y * 0.12), 0.04, 10, 48]}/><VatLieu mau={i % 2 ? mau.diem : mau.phu}/></mesh>)}
  </group>;
}

function BanhRang({ mau, vi_tri, xoay, kich_thuoc = 0.55 }: { mau: string; vi_tri: [number, number, number]; xoay: [number, number, number]; kich_thuoc?: number }) {
  const rang = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
  return <group position={vi_tri} rotation={xoay} scale={kich_thuoc}>
    <mesh rotation={[PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.78, 0.78, 0.18, 36]}/><VatLieu mau={mau}/></mesh>
    {rang.map(i => {
      const goc = i / 12 * PI * 2;
      return <RoundedBox key={i} args={[0.32, 0.26, 0.2]} radius={0.05} smoothness={3} position={[Math.cos(goc) * 0.91, Math.sin(goc) * 0.91, 0]} rotation={[0, 0, goc]} castShadow><VatLieu mau={mau}/></RoundedBox>;
    })}
    <mesh position={[0, 0, 0.12]} rotation={[PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.14, 24]}/><VatLieu mau="#0f172a"/></mesh>
  </group>;
}

function KhoiLapPhuongBanhRang({ mau }: { mau: Mau }) {
  return <group rotation={[0.18, -0.35, 0.08]}>
    <RoundedBox args={[2.25, 2.25, 2.25]} radius={0.16} smoothness={6} castShadow><VatLieu mau={mau.phu} do_nham={0.3}/></RoundedBox>
    <BanhRang mau={mau.chinh} vi_tri={[0, 0, 1.16]} xoay={[0, 0, 0]} kich_thuoc={0.78}/>
    <BanhRang mau={mau.diem} vi_tri={[1.16, 0, 0]} xoay={[0, PI / 2, 0]} kich_thuoc={0.78}/>
    <BanhRang mau={mau.chinh} vi_tri={[0, 1.16, 0]} xoay={[-PI / 2, 0, 0]} kich_thuoc={0.78}/>
    <BanhRang mau={mau.diem} vi_tri={[-1.16, 0, 0]} xoay={[0, -PI / 2, 0]} kich_thuoc={0.78}/>
    <BanhRang mau={mau.chinh} vi_tri={[0, -1.16, 0]} xoay={[PI / 2, 0, 0]} kich_thuoc={0.78}/>
  </group>;
}

function KhayGridfinity({ mau }: { mau: Mau }) {
  return <group rotation={[0.1, -0.28, 0]}>
    <RoundedBox args={[2.5, 0.3, 2.5]} radius={0.16} smoothness={5} position={[0, -0.78, 0]} castShadow><VatLieu mau={mau.chinh}/></RoundedBox>
    {[-0.62, 0.62].flatMap(x => [-0.62, 0.62].map(z => <RoundedBox key={`${x}-${z}`} args={[1.02, 1.25, 1.02]} radius={0.13} smoothness={4} position={[x, -0.05, z]} castShadow><VatLieu mau={(x + z) > 0 ? mau.phu : mau.diem}/></RoundedBox>))}
  </group>;
}

function DenLithophane({ mau }: { mau: Mau }) {
  return <group>
    <pointLight position={[0, 0.1, 0]} color="#fbbf24" intensity={16} distance={4}/>
    <RoundedBox args={[1.85, 2.25, 1.85]} radius={0.18} smoothness={5} castShadow><meshStandardMaterial color={mau.chinh} roughness={0.5} transparent opacity={0.72}/></RoundedBox>
    {[0, 1, 2, 3].map(i => <mesh key={i} position={[0, -0.82 + i * 0.55, 0.94]}><boxGeometry args={[1.35, 0.08, 0.05]}/><VatLieu mau={mau.phu}/></mesh>)}
    <RoundedBox args={[2.1, 0.18, 2.1]} radius={0.08} smoothness={3} position={[0, -1.2, 0]}><VatLieu mau="#334155"/></RoundedBox>
  </group>;
}

function VoRaspberryPi({ mau }: { mau: Mau }) {
  return <group rotation={[0.08, -0.3, 0]}>
    <RoundedBox args={[2.6, 0.46, 1.8]} radius={0.2} smoothness={6} castShadow><VatLieu mau={mau.chinh}/></RoundedBox>
    {Array.from({ length: 7 }, (_, i) => <RoundedBox key={i} args={[0.16, 0.08, 1.15]} radius={0.04} smoothness={3} position={[-0.72 + i * 0.24, 0.25, 0]}><VatLieu mau={mau.phu}/></RoundedBox>)}
    <RoundedBox args={[0.5, 0.18, 0.5]} radius={0.06} smoothness={3} position={[0.74, 0.3, 0.42]}><VatLieu mau={mau.diem}/></RoundedBox>
  </group>;
}

function MoHinhSanPham({ ma_san_pham }: { ma_san_pham?: string }) {
  const mau = BANG_MAU[ma_san_pham || ""] || { chinh: "#8b5cf6", phu: "#334155", diem: "#22d3ee" };
  switch (ma_san_pham) {
    case "N3D-RC-001": return <XeRc mau={mau}/>;
    case "N3D-DESK-002": return <GiaDienThoai mau={mau}/>;
    case "N3D-DECOR-003": return <ChauXoan mau={mau}/>;
    case "N3D-DESK-004": return <HopCuonCap mau={mau}/>;
    case "N3D-GAME-005": return <GiaTaiNghe mau={mau}/>;
    case "N3D-LAMP-006": return <ChupDen mau={mau}/>;
    case "N3D-TOY-007": return <KhoiLapPhuongBanhRang mau={mau}/>;
    case "N3D-ORG-008": return <KhayGridfinity mau={mau}/>;
    case "N3D-GIFT-009": return <DenLithophane mau={mau}/>;
    case "N3D-MAKER-010": return <VoRaspberryPi mau={mau}/>;
    default: return <RoundedBox args={[2.2, 2.2, 2.2]} radius={0.2} smoothness={6} castShadow><VatLieu mau={mau.chinh}/></RoundedBox>;
  }
}

export function TrinhXemAnh3D({ duong_dan_anh, ten_san_pham, ma_san_pham }: Props) {
  const [che_do, setCheDo] = useState<"anh" | "3d">("3d");
  const [khoa_canvas, setKhoaCanvas] = useState(0);

  return <div className="product-media-shell">
    <div className="product-media-toolbar" aria-label="Chế độ xem sản phẩm">
      <button className={che_do === "anh" ? "active" : ""} onClick={() => setCheDo("anh")}>Ảnh</button>
      <button className={che_do === "3d" ? "active" : ""} onClick={() => setCheDo("3d")}>3D thật</button>
      {che_do === "3d" && <button className="media-reset" onClick={() => setKhoaCanvas(x => x + 1)}>Đặt lại góc nhìn</button>}
    </div>

    {che_do === "anh" ? (
      duong_dan_anh ? <div className="product-main-image"><img src={duong_dan_anh} alt={ten_san_pham} referrerPolicy="no-referrer"/></div> : <div className="product-main-image product-media-empty">Chưa có hình ảnh sản phẩm</div>
    ) : <div className="product-model-3d-stage" role="application" aria-label={`Mô hình 3D WebGL tương tác của ${ten_san_pham}`}>
      <Canvas key={khoa_canvas} shadows camera={{ position: [4.2, 3.1, 5.1], fov: 38 }} dpr={[1, 1.8]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={1.35}/>
        <hemisphereLight color="#ffffff" groundColor="#111827" intensity={1.1}/>
        <directionalLight position={[4, 6, 4]} intensity={4.5} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
        <directionalLight position={[-4, 2, -3]} intensity={2.1} color="#67e8f9"/>
        <group position={[0, 0.2, 0]}><MoHinhSanPham ma_san_pham={ma_san_pham}/></group>
        <ContactShadows position={[0, -1.45, 0]} opacity={0.45} scale={7} blur={2.8} far={4.5}/>
        <OrbitControls enablePan={false} enableDamping dampingFactor={0.07} minDistance={3.2} maxDistance={7.2} autoRotate autoRotateSpeed={0.5}/>
      </Canvas>
      <div className="product-model-3d-badge">WebGL • Three.js</div>
      <div className="product-image-3d-help">Kéo để xoay 360° • lăn để zoom • giữ chuột để quan sát</div>
    </div>}

    {che_do === "3d" && <p className="product-media-note">Đây là mô hình 3D WebGL dựng bằng hình học thật trong Three.js, không còn là ảnh 2D xoay giả lập. Kiến trúc viewer đã sẵn sàng để thay bằng file GLB/GLTF chính xác của từng sản phẩm khi có model CAD/mesh gốc.</p>}
  </div>;
}
