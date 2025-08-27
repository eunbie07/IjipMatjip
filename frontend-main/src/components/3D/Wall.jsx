import React from "react";
import * as THREE from "three";

const Wall = React.memo(function Wall({
  width,
  height,
  position,
  rotation,
  isWindow = false,
  color = "#f8f6f0",
  texture = null,
  roughness = 0.9,
  metalness = 0.02,
  thickness = 20, // 벽 두께 추가 (기본 20cm)
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      {/* 평면 대신 박스 지오메트리로 실제 두께감 구현 */}
      <boxGeometry args={[width, height, thickness]} />
      <meshPhysicalMaterial
        color={isWindow ? "#E8F4FD" : color}
        map={texture}
        roughness={isWindow ? 0.1 : roughness}
        metalness={isWindow ? 0.02 : metalness}
        clearcoat={isWindow ? 0.8 : metalness > 0.1 ? 0.6 : 0.1}
        clearcoatRoughness={isWindow ? 0.1 : roughness}
        opacity={isWindow ? 0.3 : 1}
        transparent={isWindow}
        normalScale={[0.5, 0.5]}
        envMapIntensity={0.7}
        reflectivity={metalness > 0.1 ? 0.8 : 0.2}
      />
    </mesh>
  );
});

export default Wall;