import React, { useState, useEffect } from 'react';

const RoomSizeController = ({ 
  roomWidth, 
  roomDepth, 
  roomHeight, 
  onRoomSizeChange,
  placedFurniture,
  onFurnitureUpdate 
}) => {
  const [localRoomSize, setLocalRoomSize] = useState({
    width: roomWidth,
    depth: roomDepth,
    height: roomHeight
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // 부모에서 props가 변경되면 로컬 상태 업데이트
  useEffect(() => {
    setLocalRoomSize({
      width: roomWidth,
      depth: roomDepth,
      height: roomHeight
    });
  }, [roomWidth, roomDepth, roomHeight]);

  const handleSizeChange = (dimension, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 150 || numValue > 1000) return;

    const oldSize = { width: localRoomSize.width, depth: localRoomSize.depth, height: localRoomSize.height };
    const newSize = { ...localRoomSize, [dimension]: numValue };
    
    setLocalRoomSize(newSize);

    // 가구 위치 비례 조정
    if (dimension === 'width' || dimension === 'depth') {
      const updatedFurniture = placedFurniture.map(item => {
        let newX = item.x;
        let newZ = item.z;
        
        if (dimension === 'width') {
          const ratio = numValue / oldSize.width;
          newX = Math.max(0, Math.min(numValue - 50, item.x * ratio)); // 50cm 여백
        }
        
        if (dimension === 'depth') {
          const ratio = numValue / oldSize.depth;
          newZ = Math.max(0, Math.min(numValue - 50, item.z * ratio)); // 50cm 여백
        }

        return {
          ...item,
          x: newX,
          z: newZ
        };
      });

      onFurnitureUpdate(updatedFurniture);
    }

    // 부모 컴포넌트에 변경 알림
    onRoomSizeChange(newSize);
  };

  const presetSizes = [
    { label: '3×3m', width: 300, depth: 300 },
    { label: '4×4m', width: 400, depth: 400 },
    { label: '5×5m', width: 500, depth: 500 },
    { label: '4×6m', width: 400, depth: 600 }
  ];

  const applyPreset = (preset) => {
    const oldSize = { width: localRoomSize.width, depth: localRoomSize.depth, height: localRoomSize.height };
    const newSize = { 
      width: preset.width, 
      depth: preset.depth, 
      height: localRoomSize.height 
    };

    setLocalRoomSize(newSize);

    // 가구들을 새로운 방 크기에 맞게 비례 조정
    const widthRatio = preset.width / oldSize.width;
    const depthRatio = preset.depth / oldSize.depth;

    const updatedFurniture = placedFurniture.map(item => {
      const newX = Math.max(0, Math.min(preset.width - 50, item.x * widthRatio));
      const newZ = Math.max(0, Math.min(preset.depth - 50, item.z * depthRatio));

      return {
        ...item,
        x: newX,
        z: newZ
      };
    });

    onFurnitureUpdate(updatedFurniture);
    onRoomSizeChange(newSize);
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l4 4m8-4h4m0 0v4m0-4l-4 4M4 16v4m0 0h4m-4 0l4-4m16 4l-4-4m4 0h4m0 0v-4" />
          </svg>
          방 크기 조절
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg 
            className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* 현재 방 크기 정보 (항상 표시) */}
      <div className="grid grid-cols-4 gap-2 text-sm mb-3">
        <div className="text-center p-2 bg-background rounded border border-border">
          <div className="font-semibold text-text-primary">{(localRoomSize.width / 100).toFixed(1)}m</div>
          <div className="text-text-secondary text-xs">가로</div>
        </div>
        <div className="text-center p-2 bg-background rounded border border-border">
          <div className="font-semibold text-text-primary">{(localRoomSize.depth / 100).toFixed(1)}m</div>
          <div className="text-text-secondary text-xs">세로</div>
        </div>
        <div className="text-center p-2 bg-background rounded border border-border">
          <div className="font-semibold text-primary">
            {(((localRoomSize.width * localRoomSize.depth) / 10000) / 3.3).toFixed(1)}평
          </div>
          <div className="text-text-secondary text-xs">평수</div>
        </div>
        <div className="text-center p-2 bg-background rounded border border-border">
          <div className="font-semibold text-text-primary">
            {((localRoomSize.width * localRoomSize.depth) / 10000).toFixed(1)}㎡
          </div>
          <div className="text-text-secondary text-xs">면적</div>
        </div>
      </div>

      {/* 확장 가능한 조절 패널 */}
      {isExpanded && (
        <div className="space-y-4 pt-3 border-t border-border">
          {/* 프리셋 버튼들 */}
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-2">빠른 설정</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {presetSizes.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => applyPreset(preset)}
                  className="p-2 text-sm border border-border rounded hover:border-primary hover:bg-primary/5 transition-colors text-center"
                >
                  <div className="font-medium text-text-primary">{preset.label}</div>
                  <div className="text-xs text-text-secondary">
                    {(((preset.width * preset.depth) / 10000) / 3.3).toFixed(1)}평
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 세밀 조정 슬라이더 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-text-primary mb-2">세밀 조정</h4>
            
            {/* 가로 조정 */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm text-text-primary">가로 (Width)</label>
                <span className="text-sm text-text-secondary">{(localRoomSize.width / 100).toFixed(1)}m</span>
              </div>
              <input
                type="range"
                min="200"
                max="800"
                step="10"
                value={localRoomSize.width}
                onChange={(e) => handleSizeChange('width', e.target.value)}
                className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* 세로 조정 */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm text-text-primary">세로 (Depth)</label>
                <span className="text-sm text-text-secondary">{(localRoomSize.depth / 100).toFixed(1)}m</span>
              </div>
              <input
                type="range"
                min="200"
                max="800"
                step="10"
                value={localRoomSize.depth}
                onChange={(e) => handleSizeChange('depth', e.target.value)}
                className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* 높이 조정 */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm text-text-primary">높이 (Height)</label>
                <span className="text-sm text-text-secondary">{(localRoomSize.height / 100).toFixed(1)}m</span>
              </div>
              <input
                type="range"
                min="220"
                max="280"
                step="5"
                value={localRoomSize.height}
                onChange={(e) => handleSizeChange('height', e.target.value)}
                className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomSizeController;