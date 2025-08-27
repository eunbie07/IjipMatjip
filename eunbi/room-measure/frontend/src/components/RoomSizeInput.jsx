import React, { useState } from 'react';

const RoomSizeInput = ({ onRoomSizeSubmit, isProcessing }) => {
  const [roomSize, setRoomSize] = useState({
    width: 400, // 4m 기본값 (중형 방)
    depth: 400, // 4m 기본값 (중형 방)
    height: 230 // 2.3m 기본값
  });

  const [errors, setErrors] = useState({});

  const validateInput = (value, min = 150, max = 1000) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < min || num > max) {
      return false;
    }
    return true;
  };

  const handleInputChange = (field, value) => {
    setRoomSize(prev => ({
      ...prev,
      [field]: value
    }));

    // 실시간 유효성 검사
    const newErrors = { ...errors };
    if (value === '' || validateInput(value)) {
      delete newErrors[field];
    } else {
      newErrors[field] = `${field === 'width' ? '가로' : field === 'depth' ? '세로' : '높이'}는 1.5m ~ 10m 사이여야 합니다`;
    }
    setErrors(newErrors);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 모든 값 검증
    const validationErrors = {};
    if (!validateInput(roomSize.width)) {
      validationErrors.width = '가로는 1.5m ~ 10m 사이여야 합니다';
    }
    if (!validateInput(roomSize.depth)) {
      validationErrors.depth = '세로는 1.5m ~ 10m 사이여야 합니다';
    }
    if (!validateInput(roomSize.height, 200, 400)) {
      validationErrors.height = '높이는 2m ~ 4m 사이여야 합니다';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // 방 크기 데이터 전달
    const roomData = {
      width_cm: parseFloat(roomSize.width),
      depth_cm: parseFloat(roomSize.depth),
      height_cm: parseFloat(roomSize.height),
      dimensions: {
        width_cm: parseFloat(roomSize.width),
        depth_cm: parseFloat(roomSize.depth),
        height_cm: parseFloat(roomSize.height)
      },
      confidence: 1.0, // 사용자가 직접 입력한 값이므로 신뢰도 100%
      detectionMethod: "manual_input",
      calculated_values: {
        area_sqm: (parseFloat(roomSize.width) * parseFloat(roomSize.depth)) / 10000,
        volume_cum: (parseFloat(roomSize.width) * parseFloat(roomSize.depth) * parseFloat(roomSize.height)) / 1000000
      }
    };

    onRoomSizeSubmit(roomData);
  };

  const presetSizes = [
    { label: '소형 방 (3×3m, 2.7평)', width: 300, depth: 300, height: 230 },
    { label: '중형 방 (4×4m, 4.8평)', width: 400, depth: 400, height: 230 },
    { label: '대형 방 (5×5m, 7.6평)', width: 500, depth: 500, height: 230 }
  ];

  const handlePresetSelect = (preset) => {
    setRoomSize({
      width: preset.width,
      depth: preset.depth,
      height: preset.height
    });
    setErrors({});
  };

  return (
    <div className="w-full">
      <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold text-text-primary mb-4">
          방 크기 직접 입력
        </h3>
        <p className="text-text-secondary mb-6">
          방의 가로, 세로, 높이를 직접 입력하여 가구 배치를 시작하세요.
        </p>

        {/* 프리셋 버튼들 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-text-primary mb-3">빠른 선택</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {presetSizes.map((preset, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className="p-3 text-sm border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-center"
              >
                <div className="font-medium text-text-primary">{preset.label}</div>
                <div className="text-xs text-text-secondary mt-1">
                  {(preset.width/100).toFixed(1)}×{(preset.depth/100).toFixed(1)}×{(preset.height/100).toFixed(1)}m
                </div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 가로 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                가로 (Width)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="150"
                  max="1000"
                  step="10"
                  value={roomSize.width}
                  onChange={(e) => handleInputChange('width', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    errors.width ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="350"
                />
                <span className="absolute right-3 top-3 text-text-secondary">cm</span>
              </div>
              {errors.width && (
                <p className="mt-1 text-sm text-red-600">{errors.width}</p>
              )}
              <p className="mt-1 text-xs text-text-secondary">
                {(roomSize.width / 100).toFixed(1)}m
              </p>
            </div>

            {/* 세로 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                세로 (Depth)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="150"
                  max="1000"
                  step="10"
                  value={roomSize.depth}
                  onChange={(e) => handleInputChange('depth', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    errors.depth ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="350"
                />
                <span className="absolute right-3 top-3 text-text-secondary">cm</span>
              </div>
              {errors.depth && (
                <p className="mt-1 text-sm text-red-600">{errors.depth}</p>
              )}
              <p className="mt-1 text-xs text-text-secondary">
                {(roomSize.depth / 100).toFixed(1)}m
              </p>
            </div>

            {/* 높이 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                높이 (Height)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="200"
                  max="400"
                  step="10"
                  value={roomSize.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    errors.height ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="230"
                />
                <span className="absolute right-3 top-3 text-text-secondary">cm</span>
              </div>
              {errors.height && (
                <p className="mt-1 text-sm text-red-600">{errors.height}</p>
              )}
              <p className="mt-1 text-xs text-text-secondary">
                {(roomSize.height / 100).toFixed(1)}m
              </p>
            </div>
          </div>

          {/* 계산된 면적, 평수, 부피 미리보기 */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-background border border-border rounded-lg">
            <div className="text-center">
              <div className="text-lg font-semibold text-text-primary">
                {((roomSize.width * roomSize.depth) / 10000).toFixed(1)}㎡
              </div>
              <div className="text-sm text-text-secondary">바닥 면적</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">
                {(((roomSize.width * roomSize.depth) / 10000) / 3.3).toFixed(1)}평
              </div>
              <div className="text-sm text-text-secondary">평수</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-text-primary">
                {((roomSize.width * roomSize.depth * roomSize.height) / 1000000).toFixed(1)}㎥
              </div>
              <div className="text-sm text-text-secondary">공간 부피</div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing || Object.keys(errors).length > 0}
            className="w-full py-4 bg-primary hover:bg-secondary text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                처리 중...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                가구 배치 시작하기
              </>
            )}
          </button>
        </form>

        <div className="mt-4 p-4 bg-background rounded-lg border border-border">
          <p className="text-sm text-text-primary">
            <strong>💡 팁:</strong> 정확한 측정을 위해서는 이미지 업로드를 권장하지만, 
            대략적인 방 크기로도 가구 배치를 체험해볼 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoomSizeInput;