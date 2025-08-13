import { useState } from "react";

export const usePanelStates = () => {
  // 스타일 패널 접기/펼치기 상태 (디폴트는 접힌 상태)
  const [wallPanelExpanded, setWallPanelExpanded] = useState(false);
  const [floorPanelExpanded, setFloorPanelExpanded] = useState(false);

  return {
    wallPanelExpanded,
    setWallPanelExpanded,
    floorPanelExpanded,
    setFloorPanelExpanded,
  };
};