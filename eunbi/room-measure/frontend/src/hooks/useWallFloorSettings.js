import { useState } from "react";

export const useWallFloorSettings = () => {
  // 벽면 스타일 상태
  const [wallSettings, setWallSettings] = useState({
    color: "#f8f6f0",
    roughness: 0.9,
    metalness: 0.02,
    textureType: "none", // "none", "brick", "wood", "concrete", "wallpaper"
  });

  // 바닥 스타일 상태
  const [floorSettings, setFloorSettings] = useState({
    color: "#e2e8f0",
    roughness: 0.85,
    metalness: 0.05,
  });

  return {
    wallSettings,
    setWallSettings,
    floorSettings,
    setFloorSettings,
  };
};