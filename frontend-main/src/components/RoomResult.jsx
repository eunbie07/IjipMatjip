// frontend/src/components/RoomResult.jsx
import React from "react";
import RoomCanvas from "./RoomCanvas";


const MeasurementDetails = ({ result }) => {
  const hasPixelData = result.pixel_distances;
  const hasPerspectiveData = result.perspective_correction;

  return (
    <div className="bg-surface rounded-lg p-4 mt-4 border border-border">
      <h4 className="text-lg font-semibold mb-3 text-text-primary">
        측정 세부사항
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 픽셀 거리 정보 */}
        {hasPixelData && (
          <div className="bg-background p-3 rounded border border-border">
            <h5 className="font-medium text-text-primary mb-2">픽셀 거리</h5>
            <div className="space-y-1 text-sm text-text-secondary">
              <div>수직: {result.pixel_distances.height_pixels} px</div>
              <div>가로: {result.pixel_distances.width_pixels} px</div>
              <div>세로: {result.pixel_distances.depth_pixels} px</div>
            </div>
          </div>
        )}

        {/* 스케일 정보 */}
        <div className="bg-background p-3 rounded border border-border">
          <h5 className="font-medium text-text-primary mb-2">스케일 정보</h5>
          <div className="space-y-1 text-sm text-text-secondary">
            <div>스케일 팩터: {(result.calculated_values?.pixels_per_meter / 100)?.toFixed(3)} cm/px</div>
            <div>기준 높이: {Math.round(result.dimensions?.height_cm || result.height_cm)} cm</div>
          </div>
        </div>

        {/* 원근 보정 정보 */}
        {hasPerspectiveData && (
          <div className="bg-background p-3 rounded border border-border">
            <h5 className="font-medium text-text-primary mb-2">원근 보정</h5>
            <div className="space-y-1 text-sm text-text-secondary">
              <div>
                가로 보정: {result.perspective_correction.horizontal_factor}
              </div>
              <div>세로 보정: {result.perspective_correction.depth_factor}</div>
              <div>깊이 범위: {result.perspective_correction.depth_range}</div>
            </div>
          </div>
        )}

        {/* 측정 품질 */}
        <div className="bg-background p-3 rounded border border-border">
          <h5 className="font-medium text-text-primary mb-2">측정 품질</h5>
          <div className="space-y-1 text-sm text-text-secondary">
            <div>
              알고리즘 신뢰도: {(result.confidence || 0).toFixed(2)}
            </div>
            <div>
              처리 품질: {result.confidence >= 0.8 ? '높음' : result.confidence >= 0.6 ? '보통' : '낮음'}
            </div>
            <div className="text-xs text-text-secondary mt-1 opacity-75">
              * 이미지 분석 알고리즘의 처리 품질을 나타냅니다
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RoomResult = ({ result }) => {

  if (!result) return null;

  // 새로운 API 응답 형태에 맞춰 데이터 추출
  const width = result.dimensions?.width_cm || result.width_cm;
  const depth = result.dimensions?.depth_cm || result.depth_cm;
  const height = result.dimensions?.height_cm || result.height_cm;
  const confidence = result.confidence || 0;
  const area = result.calculated_values?.area_sqm || result.area_sqm;
  const volume = result.calculated_values?.volume_cum || result.volume_cum;

  // 디버깅 로그
  console.log("RoomResult received:", result);
  console.log("width:", width, "depth:", depth, "height:", height, "confidence:", confidence);

  // NaN 체크 및 기본값 설정
  const validWidth = isNaN(width) ? 0 : width;
  const validDepth = isNaN(depth) ? 0 : depth;
  const validHeight = isNaN(height) ? 0 : height;

  // NaN 값이 있을 때 경고 메시지
  if (isNaN(width) || isNaN(depth) || isNaN(height)) {
    console.warn("측정 결과에 NaN 값이 포함되어 있습니다:", { width, depth, height });
  }

  // 백엔드에서 계산된 값이 있으면 사용, 없으면 프론트엔드에서 계산
  const area_m2 = area || (validWidth * validDepth) / 10000;
  const volume_m3 = volume || (validWidth * validDepth * validHeight) / 1000000;

  // 평 계산 (1평 = 3.3058㎡)
  const area_pyeong = area_m2 / 3.3058;

  // 극단적 값 감지
  const getWarningMessages = () => {
    const warnings = [];
    
    // 면적 기준 경고
    if (area_m2 < 1) {
      warnings.push("측정된 면적이 1㎡ 미만입니다. 화장실보다 작은 크기로, 측정 오류일 가능성이 높습니다.");
    } else if (area_m2 > 100) {
      warnings.push("측정된 면적이 100㎡를 초과합니다. 매우 큰 공간으로, 측정 오류일 가능성이 있습니다.");
    }
    
    // 비율 기준 경고
    const aspectRatio = validWidth / validDepth;
    if (aspectRatio > 5 || aspectRatio < 0.2) {
      warnings.push("가로:세로 비율이 극단적입니다. 일반적인 방 형태가 아닐 수 있습니다.");
    }
    
    // 높이 기준 경고
    if (validHeight < 200) {
      warnings.push("천장 높이가 2m 미만으로 측정되었습니다. 일반적인 주거공간보다 낮습니다.");
    } else if (validHeight > 400) {
      warnings.push("천장 높이가 4m를 초과합니다. 측정 오류이거나 특수한 공간일 수 있습니다.");
    }
    
    return warnings;
  };

  const warningMessages = getWarningMessages();

  return (
    <div className="mt-10">


      {/* 백엔드 경고 메시지 */}
      {result.warning && (
        <div className="mb-6 p-4 bg-danger border border-danger rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-white"></span>
            <span className="font-medium text-white">주의사항</span>
          </div>
          <p className="text-white mt-1">{result.warning}</p>
        </div>
      )}

      {/* 극단적 값 경고 */}
      {warningMessages.length > 0 && (
        <div className="mb-6 p-4 bg-orange-100 border border-orange-300 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-orange-600 font-medium">측정 결과 검토 필요</span>
          </div>
          <div className="space-y-1">
            {warningMessages.map((message, index) => (
              <p key={index} className="text-orange-800 text-sm">• {message}</p>
            ))}
          </div>
          <p className="text-orange-700 text-sm mt-2 font-medium">
            다른 각도나 조명에서 재측정해보시기 바랍니다.
          </p>
        </div>
      )}

      {/* 2D 평면도 내용 */}
      <div>
          {/* 기존 RoomCanvas */}
          <RoomCanvas x={validWidth} y={validDepth} />

          {/* 측정 결과 표시 */}
          <div className="mt-6 p-6 border border-border rounded-xl bg-surface shadow-lg">
            <h2 className="text-xl font-bold mb-6 text-text-primary">
              방 크기 측정 결과
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
                <div className="text-sm text-text-secondary mb-1">가로 (Width)</div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {validWidth?.toFixed(1)} cm
                </div>
                <div className="text-sm text-text-secondary">
                  {(validWidth / 100)?.toFixed(2)} m
                </div>
              </div>

              <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
                <div className="text-sm text-text-secondary mb-1">세로 (Depth)</div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {validDepth?.toFixed(1)} cm
                </div>
                <div className="text-sm text-text-secondary">
                  {(validDepth / 100)?.toFixed(2)} m
                </div>
              </div>

              <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
                <div className="text-sm text-text-secondary mb-1">높이 (Height)</div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {validHeight?.toFixed(1)} cm
                </div>
                <div className="text-sm text-text-secondary">
                  {(validHeight / 100)?.toFixed(2)} m
                </div>
              </div>
            </div>

            <div className="bg-surface p-4 rounded-lg border border-border shadow-sm mb-6">
              <h3 className="text-lg font-semibold mb-3 text-text-primary">면적 및 부피</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-background rounded-lg border border-border">
                  <div className="text-sm text-text-secondary mb-1">제곱미터</div>
                  <div className="text-xl font-bold text-primary">
                    {area_m2.toFixed(2)} ㎡
                  </div>
                </div>
                <div className="text-center p-3 bg-background rounded-lg border border-border">
                  <div className="text-sm text-text-secondary mb-1">평수</div>
                  <div className="text-xl font-bold text-primary">
                    {area_pyeong.toFixed(1)} 평
                  </div>
                </div>
                <div className="text-center p-3 bg-background rounded-lg border border-border">
                  <div className="text-sm text-text-secondary mb-1">부피</div>
                  <div className="text-xl font-bold text-primary">
                    {volume_m3.toFixed(2)} ㎥
                  </div>
                </div>
              </div>
            </div>

            {/* 측정 세부사항 */}
            <MeasurementDetails result={result} />

            {/* 실용적 참고 정보 */}
            <div className="mt-6 p-4 bg-window-fill border border-window-stroke rounded-lg">
              <div className="font-medium text-text-primary mb-2">공간 활용 참고</div>
              <div className="text-sm text-text-primary space-y-1">
                {area_m2 < 6 ? (
                  <p>• 소형 개인실/서재 크기 ({area_pyeong.toFixed(1)}평)</p>
                ) : area_m2 < 10 ? (
                  <p>• 원룸/스튜디오 크기 ({area_pyeong.toFixed(1)}평)</p>
                ) : area_m2 < 16 ? (
                  <p>• 작은 방/침실 크기 ({area_pyeong.toFixed(1)}평)</p>
                ) : area_m2 < 25 ? (
                  <p>• 거실/큰 방 크기 ({area_pyeong.toFixed(1)}평)</p>
                ) : area_m2 < 40 ? (
                  <p>• 넓은 거실/오피스 크기 ({area_pyeong.toFixed(1)}평)</p>
                ) : (
                  <p>• 매우 큰 공간 ({area_pyeong.toFixed(1)}평)</p>
                )}
                
                {validWidth > validDepth * 2 ? (
                  <p>• 복도형 공간 - 길고 좁은 형태</p>
                ) : Math.abs(validWidth - validDepth) < validWidth * 0.2 ? (
                  <p>• 정방형 공간 - 가구 배치가 자유로운 형태</p>
                ) : (
                  <p>• 직사각형 공간 - 일반적인 방 형태</p>
                )}
              </div>
            </div>

            {/* 신뢰도 기반 안내 */}
            {confidence < 0.7 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="font-medium text-yellow-800 mb-2">측정 정확도 개선 권장</div>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>• 현재 측정 신뢰도가 낮아 오차가 클 수 있습니다</p>
                  <p>• 더 나은 결과를 위한 촬영 팁:</p>
                  <p className="ml-4">- 밝은 조명에서 촬영하세요</p>
                  <p className="ml-4">- 방의 모서리가 명확히 보이는 각도에서 촬영하세요</p>
                  <p className="ml-4">- 카메라를 안정적으로 고정하여 촬영하세요</p>
                  <p className="text-xs mt-2 opacity-75">하단의 "새로 측정하기" 버튼을 눌러 다시 시도하세요.</p>
                </div>
              </div>
            )}

            <div className="mt-4 p-4 bg-window-fill border border-window-stroke rounded-lg">
              <div className="font-medium text-text-primary mb-2">측정 정보</div>
              <div className="text-sm text-text-primary space-y-1">
                <p>• AI 기반 이미지 분석으로 추정된 결과입니다</p>
                <p>• 층고 {Math.round(validHeight)}cm를 기준으로 계산되었습니다</p>
                <p>• 실제 측정값과 차이가 있을 수 있으니 참고용으로 활용하세요</p>
              </div>
            </div>
          </div>

        </div>
    </div>
  );
};

export default RoomResult;
