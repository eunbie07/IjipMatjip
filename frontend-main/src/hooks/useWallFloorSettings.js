import { useState } from "react";

export const useWallFloorSettings = () => {
  // 벽면 스타일 상태
  const [wallSettings, setWallSettings] = useState({
    color: "#ffffff",
    roughness: 0.9,
    metalness: 0.02,
    textureType: "none", // "none", "brick", "wood", "concrete", "wallpaper"
  });

  // 바닥 스타일 상태
  const [floorSettings, setFloorSettings] = useState({
    color: "#f5f5dc",
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