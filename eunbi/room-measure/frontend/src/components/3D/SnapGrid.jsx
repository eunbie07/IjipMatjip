import React from "react";
import { Line } from "@react-three/drei";

const SnapGrid = React.memo(function SnapGrid({
  roomSize,
  gridSize = 50,
  visible = false,
}) {
  if (!visible) return null;

  const [roomWidth, roomHeight, roomDepth] = roomSize;
  const lines = [];

  for (let x = 0; x <= roomWidth; x += gridSize) {
    lines.push(
      <Line
        key={`vertical-${x}`}
        points={[
          [x, 0.2, 0],
          [x, 0.2, roomDepth],
        ]}
        color="#e0e0e0"
        lineWidth={1}
      />
    );
  }

  for (let z = 0; z <= roomDepth; z += gridSize) {
    lines.push(
      <Line
        key={`horizontal-${z}`}
        points={[
          [0, 0.2, z],
          [roomWidth, 0.2, z],
        ]}
        color="#e0e0e0"
        lineWidth={1}
      />
    );
  }

  return <group>{lines}</group>;
});

export default SnapGrid;