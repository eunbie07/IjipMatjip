import { useMemo, useEffect, useRef } from "react";
import { FURNITURE_PRESETS, FURNITURE_ID_MAPPING } from "../constants/furniture";

export const useFurnitureConversion = (placedFurniture, setFurniture, isDragging) => {
  const isUpdatingFromDragRef = useRef(false);

  const convertedFurniture = useMemo(() => {
    if (!placedFurniture || placedFurniture.length === 0) {
      return [];
    }

    return placedFurniture.map((item) => {
      let furnitureSize, mappedType, presetData;

      if (item.isCustom) {
        furnitureSize = [item.width, item.height || 60, item.depth];
        mappedType = "custom";
        presetData = {
          name: item.name,
          color: item.color || "#DDA0DD",
          size: furnitureSize,
          icon: "faBox", // Default icon for custom furniture
        };
      } else {
        const baseId = item.id
          ? item.id.split("_").slice(0, -1).join("_")
          : "desk";
        mappedType = FURNITURE_ID_MAPPING[baseId] || "desk";
        presetData = FURNITURE_PRESETS[mappedType];
        furnitureSize = presetData.size;
      }

      const x3d = item.x;
      const z3d = item.z;

      return {
        id: item.id,
        type: mappedType,
        name: presetData.name,
        color: presetData.color,
        size: furnitureSize,
        position: [
          x3d + furnitureSize[0] / 2,
          furnitureSize[1] / 2,
          z3d + furnitureSize[2] / 2,
        ],
        rotation: [0, (item.rotation || 0) * (Math.PI / 180), 0],
        original2D: item,
        isCustom: item.isCustom || false,
      };
    });
  }, [placedFurniture]);

  useEffect(() => {
    if (isDragging || isUpdatingFromDragRef.current) {
      return;
    }
    setFurniture(convertedFurniture);
  }, [convertedFurniture, isDragging, setFurniture]);

  return {
    convertedFurniture,
    isUpdatingFromDragRef,
  };
};