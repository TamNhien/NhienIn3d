"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import type { Mesh } from "three";

function VatThe() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.35; });
  return <Float speed={2} rotationIntensity={0.35} floatIntensity={0.7}><mesh ref={ref} castShadow><torusKnotGeometry args={[1.05,0.34,180,24]} /><meshPhysicalMaterial color="#8b5cf6" roughness={0.15} metalness={0.15} clearcoat={1} iridescence={0.55} /></mesh></Float>;
}
export function Hero3D() { return <div className="hero3d" aria-label="Mô hình 3D tương tác"><Canvas camera={{ position:[0,0,4.5], fov:42 }} dpr={[1,1.7]}><ambientLight intensity={1.2}/><directionalLight position={[3,4,4]} intensity={4}/><VatThe/><Environment preset="city"/><OrbitControls enablePan={false} minDistance={3.2} maxDistance={6} autoRotate autoRotateSpeed={0.55}/></Canvas><div className="keo">Kéo để xoay • cuộn để zoom</div></div>; }
