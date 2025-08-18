import React, {
  useState,
  useMemo,
  Suspense,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import SafeCanvas from "./SafeCanvas";
import {
  OrbitControls,
  Text as DreiText,
  Line,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";

// CSS 애니메이션 스타일 주입
import { injectRoomBoxStyles } from "../styles/RoomBoxStyles";
injectRoomBoxStyles();

// 분리된 유틸리티들
import CollisionDetector from "../utils/CollisionDetector";
import PositionSnapper from "../utils/PositionSnapper";

// 분리된 UI 컴포넌트들
import ViewPresets from "./UI/ViewPresets";
import SpaceUtilization from "./UI/SpaceUtilization";
import ToastContainer from "./UI/Toast";
import { LoadingButton } from "./UI/LoadingSpinner";
import PlacementGuide from "./UI/PlacementGuide";

// 분리된 3D 컴포넌트들
import EnhancedLighting from "./3D/EnhancedLighting";
import FloorGrid from "./3D/FloorGrid";
import {
  DimensionArrow,
  DimensionLabel,
  DistanceMeasurer,
} from "./3D/DimensionComponents";
import { ValidPlacementArea } from "./3D/CollisionComponents";
import { WindowsOnWalls } from "./3D/WindowComponents";
import { DraggableFurnitureWithCollision } from "./3D/DraggableFurniture";
import { DraggableHuman } from "./3D/DraggableHuman";

// 분리된 훅들
import { useRoomState } from "../hooks/useRoomState";
import { useToast } from "../hooks/useToast";
import { useFurnitureHandlers } from "../hooks/useFurnitureHandlers";
import { useKeyboardControls } from "../hooks/useKeyboardControls";
import { useWallFloorSettings } from "../hooks/useWallFloorSettings";
import { usePanelStates } from "../hooks/usePanelStates";
import { useFurnitureConversion } from "../hooks/useFurnitureConversion";

// 분리된 상수들
import {
  FURNITURE_PRESETS,
  FURNITURE_ID_MAPPING,
} from "../constants/furniture";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { iconMapping } from "../constants/iconMapping";
import { wallPresets, floorPresets } from "../constants/stylePresets";

// 분리된 유틸리티들
import { convertCoordinatesLocally } from "../utils/coordinateConversion";
import { createRoomLayoutData } from "../utils/dataConversion";
import { saveRoomLayoutToMongoDB } from "../utils/api";
import { createScreenshotCapture } from "../utils/screenshotCapture";
import { createAIInteriorHandler } from "../utils/aiInteriorUtils";
import { extractMeshesToSeparateFiles } from "../utils/glbExtractor";
import { createWindowDetectionHandler } from "../utils/windowDetection";

// 분리된 3D 컴포넌트들
import SnapGrid from "./3D/SnapGrid";
import Wall from "./3D/Wall";

// 메인 컴포넌트
export default function RoomBox({
  width = 400,
  height = 230,
  depth = 400,
  isFullscreen = false,
  uploadedImageFile = null,
  placedFurniture = [],
  onFurnitureChange = null,
}) {
  const w = width;
  const h = height;
  const d = depth;
  const navigate = useNavigate();

  // 커스텀 훅으로 상태 관리
  const roomState = useRoomState([w, h, d]);

  // Toast 알림 시스템
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } =
    useToast();

  const {
    furniture,
    setFurniture,
    selectedFurniture,
    setSelectedFurniture,
    showSnapGrid,
    setShowSnapGrid,
    showFloorGrid,
    setShowFloorGrid,
    enableSnap,
    setEnableSnap,
    showCollisions,
    setShowCollisions,
    showWindows,
    setShowWindows,
    showHuman,
    setShowHuman,
    placementMode,
    setPlacementMode,
    activeView,
    setActiveView,
    measurementMode,
    setMeasurementMode,
    isDragging,
    setIsDragging,
    collisionAlert,
    setCollisionAlert,
    measurePoints,
    setMeasurePoints,
    humanPosition,
    setHumanPosition,
    detectedWindows,
    setDetectedWindows,
    isDetectingWindows,
    setIsDetectingWindows,
    isSaving,
    setIsSaving,
  } = roomState;

  // 방 계산 최적화 (먼저 정의)
  const roomSize = useMemo(() => [w, h, d], [w, h, d]);
  const roomArea = useMemo(() => (w * d) / 10000, [w, d]);

  // 가구 변환 로직 (isUpdatingFromDragRef 먼저 정의)
  const { convertedFurniture, isUpdatingFromDragRef } = useFurnitureConversion(
    placedFurniture,
    setFurniture,
    isDragging
  );

  // 3D 캡처 관련 상태 (먼저 선언)
  const [capturedScreenshot, setCapturedScreenshot] = useState(null);

  // 가구 핸들러들
  const {
    handleViewChange,
    handlePlaceFurniture,
    handleFloorClick,
    handleMoveFurniture,
    handleRotateFurniture,
    handleDeleteFurniture,
    handleAddFurniture,
    updatePlacedFurniturePositionOnDragEnd,
  } = useFurnitureHandlers(
    placementMode,
    setPlacementMode,
    furniture,
    setFurniture,
    selectedFurniture,
    setSelectedFurniture,
    roomSize,
    onFurnitureChange,
    null, // 이 매개변수는 더 이상 필요없음
    isUpdatingFromDragRef
  );

  // AI 인테리어 생성 핸들러
  const handleAIInteriorGenerate = () => {
    // AI 생성 전에 3D 모델 자동 활성화 및 사람 GLB 숨기기
    if (!use3DModels) {
      setUse3DModels(true);
    }
    setShowHuman(false);
    
    // 원래 핸들러 실행
    createAIInteriorHandler(
      w,
      h,
      d,
      furniture,
      navigate,
      showInfo,
      showSuccess,
      showError,
      setCapturedScreenshot
    )();
  };

  // 3D 화면 캡처 핸들러
  const handle3DCapture = () => {
    // 캡처 전에 3D 모델 자동 활성화 및 사람 GLB 임시 숨기기
    const originalUse3DModels = use3DModels;
    const originalShowHuman = showHuman;
    
    if (!use3DModels) {
      setUse3DModels(true);
    }
    setShowHuman(false);
    
    // 약간의 지연 후 캡처 실행 (렌더링 완료 대기)
    setTimeout(() => {
      createScreenshotCapture(
        furniture,
        selectedFurniture,
        w,
        h,
        d,
        showInfo,
        showSuccess,
        showError,
        showWarning,
        setCapturedScreenshot
      )();
      
      // 캡처 완료 후 원래 상태로 복원
      setTimeout(() => {
        setUse3DModels(originalUse3DModels);
        setShowHuman(originalShowHuman);
      }, 100);
    }, 100);
  };

  // 3D 모델 사용 상태
  const [use3DModels, setUse3DModels] = useState(false);

  // 벽면/바닥 스타일 설정
  const { wallSettings, setWallSettings, floorSettings, setFloorSettings } =
    useWallFloorSettings();

  // 패널 확장 상태
  const {
    wallPanelExpanded,
    setWallPanelExpanded,
    floorPanelExpanded,
    setFloorPanelExpanded,
  } = usePanelStates();

  const controlsRef = useRef();

  // 브라우저 콘솔에서 사용할 수 있도록 등록
  useEffect(() => {
    window.extractMeshes = extractMeshesToSeparateFiles;
    console.log("🚀 GLB 추출 도구 준비 완료!");
    console.log("콘솔에서 extractMeshes() 를 실행하세요.");
  }, []);

  useEffect(() => {
    setHumanPosition([w / 2, 0, d / 2]);
  }, [w, d]);

  const handleDetectWindows = createWindowDetectionHandler(
    uploadedImageFile,
    w,
    h,
    d,
    setIsDetectingWindows,
    setDetectedWindows,
    setShowWindows,
    showSuccess,
    showWarning,
    showError
  );

  const selectedFurnitureData = useMemo(
    () => furniture.find((f) => f.id === selectedFurniture),
    [furniture, selectedFurniture]
  );

  // 키보드 컨트롤
  useKeyboardControls(
    selectedFurniture,
    handleDeleteFurniture,
    handleRotateFurniture,
    placementMode,
    setPlacementMode,
    setSelectedFurniture,
    measurementMode,
    setMeasurementMode,
    setMeasurePoints,
    showFloorGrid,
    setShowFloorGrid,
    enableSnap,
    setEnableSnap
  );

  return (
    <div
      className={`room-3d-viewer relative w-full bg-background overflow-hidden shadow-lg transition-all duration-300 ${
        isFullscreen
          ? "h-screen rounded-none"
          : "h-[700px] rounded-xl border border-border"
      }`}
    >
      {/* 키보드 단축키 도움말 */}
      <div className="absolute top-4 right-4 z-20">
        <div className="relative group">
          <button
            className="p-2 rounded-lg backdrop-blur-sm bg-surface/20 hover:bg-surface/30 transition-all duration-200 shadow-lg"
            title="키보드 단축키 도움말"
            aria-label="키보드 단축키 도움말"
          >
            <svg
              className="w-5 h-5 text-text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          <div className="absolute top-full right-0 mt-2 w-64 p-4 bg-surface/95 backdrop-blur-lg rounded-xl shadow-xl border border-border/50 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-50">
            <h4 className="font-bold text-sm text-text-primary mb-3">
              키보드 단축키
            </h4>
            <div className="space-y-2 text-xs text-text-secondary">
              <div className="flex justify-between">
                <span className="font-mono bg-background px-2 py-1 rounded">
                  Del/Backspace
                </span>
                <span>가구 삭제</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                  R
                </span>
                <span>가구 회전</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                  Esc
                </span>
                <span>취소/선택 해제</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                  M
                </span>
                <span>거리 측정</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                  G
                </span>
                <span>그리드 토글</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                  S
                </span>
                <span>스냅 토글</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 왼쪽 UI 패널들 - 주요 기능 */}
      <div className="absolute top-4 left-4 z-10 space-y-4 w-80 max-w-sm">
        {/* 가구 추가 패널 */}
        <div className="backdrop-blur-lg p-4 rounded-xl shadow-xl bg-surface/90 border border-border/50 hover:bg-surface/95 transition-all duration-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-text-primary">
              {placementMode
                ? `${FURNITURE_PRESETS[placementMode].name} 배치 중`
                : "가구 추가"}
            </h3>
          </div>
          {placementMode ? (
            <button
              onClick={() => setPlacementMode(null)}
              className="w-full px-4 py-2.5 bg-danger text-white rounded-lg text-sm font-medium hover:bg-danger-dark transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                배치 취소
              </span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(FURNITURE_PRESETS).map(([type, preset]) => (
                <button
                  key={type}
                  onClick={() => handleAddFurniture(type)}
                  className="group flex items-center gap-2 px-3 py-2.5 bg-surface text-text-secondary border border-border rounded-lg hover:bg-background transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                >
                  <FontAwesomeIcon
                    icon={iconMapping[preset.icon]}
                    className="text-lg group-hover:scale-110 transition-transform duration-200 text-text-secondary"
                  />
                  <span className="text-text-secondary group-hover:text-primary">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 거리 측정 패널 */}
        <div className="backdrop-blur-lg p-4 rounded-xl shadow-lg bg-surface/85 border border-border/50 hover:bg-surface/90 transition-all duration-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21l3-3 9.5-9.5a2.12 2.12 0 000-3l-1-1a2.12 2.12 0 00-3 0L6 14l-3 3v4h4z"
                />
              </svg>
            </div>
            <h4 className="font-bold text-sm text-text-primary">거리 측정</h4>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => {
                setMeasurementMode(!measurementMode);
                setMeasurePoints([null, null]);
              }}
              className={`w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
                measurementMode
                  ? "bg-accent text-white hover:bg-primary"
                  : "bg-white text-primary border border-primary hover:bg-background"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                {measurementMode ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21l3-3 9.5-9.5a2.12 2.12 0 000-3l-1-1a2.12 2.12 0 00-3 0L6 14l-3 3v4h4z"
                    />
                  </svg>
                )}
                {measurementMode ? "측정 종료" : "거리 측정"}
              </span>
            </button>
            {measurementMode && (
              <div className="p-3 bg-background rounded-lg border border-border">
                <p className="text-xs text-text-secondary font-medium">
                  측정 방법:
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  바닥을 클릭하여 두 점 사이의 거리를 측정하세요
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 왼쪽 하단 - 벽면 스타일 패널 */}
      <div className="absolute bottom-4 left-4 z-20 w-80 max-w-sm space-y-4">
        {/* 벽면 스타일 패널 */}
        <div className="backdrop-blur-lg rounded-xl shadow-lg bg-surface/85 border border-border/50 hover:bg-surface/90 transition-all duration-200">
          {/* 헤더 (클릭 가능) */}
          <button
            onClick={() => setWallPanelExpanded(!wallPanelExpanded)}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-primary/5 transition-colors duration-200"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <svg
                  className="w-4 h-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4.5 4.5 0 01-4.5-4.5V5a2 2 0 012-2h14L21 10v6.5a4.5 4.5 0 01-4.5 4.5"
                  />
                </svg>
              </div>
              <h4 className="font-bold text-sm text-text-primary">
                벽면 스타일
              </h4>
            </div>
            {/* 펼치기/접기 아이콘 */}
            <svg
              className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
                wallPanelExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* 콘텐츠 (접었다 폈다) */}
          {wallPanelExpanded && (
            <div className="px-4 pb-4 space-y-3">
              {/* 색상 프리셋 선택 */}
              <div>
                <p className="text-xs text-text-secondary mb-2 font-medium">
                  벽 색상
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {Object.entries(wallPresets).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() =>
                        setWallSettings({
                          ...wallSettings,
                          color: preset.color,
                          roughness: preset.roughness,
                          metalness: preset.metalness,
                        })
                      }
                      className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                        wallSettings.color === preset.color
                          ? "border-primary shadow-lg"
                          : "border-white/30 hover:border-white/60"
                      }`}
                      style={{ backgroundColor: preset.color }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              {/* 커스텀 색상 선택 */}
              <div>
                <p className="text-xs text-text-secondary mb-2 font-medium">
                  커스텀 색상
                </p>
                <input
                  type="color"
                  value={wallSettings.color}
                  onChange={(e) =>
                    setWallSettings({ ...wallSettings, color: e.target.value })
                  }
                  className="w-full h-8 rounded-lg border border-border bg-background cursor-pointer"
                />
              </div>

              {/* 재질 조절 */}
              <div>
                <p className="text-xs text-text-secondary mb-2 font-medium">
                  거칠기 ({wallSettings.roughness.toFixed(1)})
                </p>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={wallSettings.roughness}
                  onChange={(e) =>
                    setWallSettings({
                      ...wallSettings,
                      roughness: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                      wallSettings.roughness * 100
                    }%, #e5e7eb ${
                      wallSettings.roughness * 100
                    }%, #e5e7eb 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-text-secondary mt-1">
                  <span>매끄러움</span>
                  <span>거침</span>
                </div>
              </div>

              {/* 금속성 조절 */}
              <div>
                <p className="text-xs text-text-secondary mb-2 font-medium">
                  금속성 ({wallSettings.metalness.toFixed(2)})
                </p>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={wallSettings.metalness}
                  onChange={(e) =>
                    setWallSettings({
                      ...wallSettings,
                      metalness: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                      wallSettings.metalness * 200
                    }%, #e5e7eb ${
                      wallSettings.metalness * 200
                    }%, #e5e7eb 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-text-secondary mt-1">
                  <span>매트</span>
                  <span>금속</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 바닥 스타일 패널 */}
        <div className="backdrop-blur-lg rounded-xl shadow-lg bg-surface/85 border border-border/50 hover:bg-surface/90 transition-all duration-200">
          {/* 헤더 (클릭 가능) */}
          <button
            onClick={() => setFloorPanelExpanded(!floorPanelExpanded)}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-primary/5 transition-colors duration-200"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <svg
                  className="w-4 h-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                  />
                </svg>
              </div>
              <h4 className="font-bold text-sm text-text-primary">
                바닥 스타일
              </h4>
            </div>
            {/* 펼치기/접기 아이콘 */}
            <svg
              className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
                floorPanelExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* 콘텐츠 (접었다 폈다) */}
          {floorPanelExpanded && (
            <div
              className="px-4 pb-4 space-y-3"
              style={{
                animation: floorPanelExpanded
                  ? "fadeIn 0.3s ease-in-out"
                  : undefined,
              }}
            >
              {/* 바닥 색상 프리셋 */}
              <div>
                <p className="text-xs text-text-secondary mb-2 font-medium">
                  바닥 재질
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {Object.entries(floorPresets).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() =>
                        setFloorSettings({
                          color: preset.color,
                          roughness: preset.roughness,
                          metalness: preset.metalness,
                        })
                      }
                      className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                        floorSettings.color === preset.color
                          ? "border-primary shadow-lg"
                          : "border-white/30 hover:border-white/60"
                      }`}
                      style={{ backgroundColor: preset.color }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              {/* 커스텀 바닥 색상 */}
              <div>
                <p className="text-xs text-text-secondary mb-2 font-medium">
                  커스텀 색상
                </p>
                <input
                  type="color"
                  value={floorSettings.color}
                  onChange={(e) =>
                    setFloorSettings({
                      ...floorSettings,
                      color: e.target.value,
                    })
                  }
                  className="w-full h-8 rounded-lg border border-border bg-background cursor-pointer"
                />
              </div>

              {/* 바닥 거칠기 */}
              <div>
                <p className="text-xs text-text-secondary mb-2 font-medium">
                  바닥 거칠기 ({floorSettings.roughness.toFixed(1)})
                </p>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={floorSettings.roughness}
                  onChange={(e) =>
                    setFloorSettings({
                      ...floorSettings,
                      roughness: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                      floorSettings.roughness * 100
                    }%, #e5e7eb ${
                      floorSettings.roughness * 100
                    }%, #e5e7eb 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-text-secondary mt-1">
                  <span>매끄러움</span>
                  <span>거침</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 선택된 가구 정보 */}
      {selectedFurnitureData && (
        <div className="absolute bottom-60 right-4 z-30 backdrop-blur-lg p-4 rounded-xl shadow-xl bg-white/90 border border-white/50 max-w-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-window-fill">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">
                {selectedFurnitureData.name}
              </p>
              <p className="text-xs text-slate-500">선택된 가구</p>
            </div>
          </div>
          {(() => {
            const [x3d, y3d, z3d] = selectedFurnitureData.position;
            const size = selectedFurnitureData.size || [100, 100, 100];
            const [width, height, depth] = size;

            const leftBottomX = Math.round(x3d - width / 2);
            const leftBottomZ = Math.round(z3d - depth / 2);
            const rightTopX = Math.round(x3d + width / 2);
            const rightTopZ = Math.round(z3d + depth / 2);

            return (
              <div className="text-xs text-slate-600 mb-3 space-y-2 bg-slate-50 p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-3 h-3 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                  <span className="font-medium">크기:</span> {width} × {depth} ×{" "}
                  {height} cm
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-3 h-3 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="font-medium">왼쪽아래:</span> ({leftBottomX},{" "}
                  {leftBottomZ}) cm
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-3 h-3 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="font-medium">오른쪽위:</span> ({rightTopX},{" "}
                  {rightTopZ}) cm
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-3 h-3 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 12v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span className="font-medium">중심 좌표:</span> (
                  {Math.round(x3d)}, {Math.round(z3d)}) cm
                </div>
                {selectedFurnitureData.rotation &&
                  selectedFurnitureData.rotation[1] !== 0 && (
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-3 h-3 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span className="font-medium">회전:</span>{" "}
                      {Math.round(
                        (selectedFurnitureData.rotation[1] * 180) / Math.PI
                      )}
                      °
                    </div>
                  )}
              </div>
            );
          })()}
          <div className="flex gap-2">
            <button
              onClick={() => handleRotateFurniture(selectedFurniture)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-primary border border-primary rounded-lg hover:bg-window-fill text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              회전
            </button>
            <button
              onClick={() => handleDeleteFurniture(selectedFurniture)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-red-600 border border-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              삭제
            </button>
          </div>
        </div>
      )}

      {/* 시각 옵션 패널 */}
      <div className="absolute bottom-4 right-4 z-20 w-80 max-w-sm space-y-4">
        <div className="backdrop-blur-lg p-4 rounded-xl shadow-lg bg-surface/85 border border-border/50 hover:bg-surface/90 transition-all duration-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <h4 className="font-bold text-sm text-text-primary">시각 옵션</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="flex items-center gap-2 group cursor-pointer">
              <input
                type="checkbox"
                checked={enableSnap}
                onChange={(e) => {
                  console.log(
                    "스냅 기능 변경:",
                    e.target.checked,
                    "enableSnap:",
                    enableSnap
                  );
                  setEnableSnap(e.target.checked);
                }}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-1"
              />
              <span className="text-text-primary group-hover:text-primary transition-colors duration-200">
                스냅 기능
              </span>
            </label>
            <label className="flex items-center gap-2 group cursor-pointer">
              <input
                type="checkbox"
                checked={showSnapGrid}
                onChange={(e) => {
                  console.log(
                    "스냅 그리드 변경:",
                    e.target.checked,
                    "showSnapGrid:",
                    showSnapGrid
                  );
                  setShowSnapGrid(e.target.checked);
                }}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-1"
              />
              <span className="text-text-primary group-hover:text-primary transition-colors duration-200">
                스냅 그리드
              </span>
            </label>
            <label className="flex items-center gap-2 group cursor-pointer">
              <input
                type="checkbox"
                checked={showFloorGrid}
                onChange={(e) => {
                  console.log(
                    "바닥 그리드 변경:",
                    e.target.checked,
                    "showFloorGrid:",
                    showFloorGrid
                  );
                  setShowFloorGrid(e.target.checked);
                }}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-1"
              />
              <span className="text-text-primary group-hover:text-primary transition-colors duration-200">
                바닥 그리드
              </span>
            </label>
            <label className="flex items-center gap-2 group cursor-pointer">
              <input
                type="checkbox"
                checked={showCollisions}
                onChange={(e) => setShowCollisions(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-1"
              />
              <span className="text-text-primary group-hover:text-primary transition-colors duration-200">
                충돌 표시
              </span>
            </label>
            <label className="flex items-center gap-2 group cursor-pointer">
              <input
                type="checkbox"
                checked={showWindows}
                onChange={(e) => setShowWindows(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-1"
              />
              <span className="text-text-primary group-hover:text-primary transition-colors duration-200">
                창문 표시
              </span>
            </label>
            <label className="flex items-center gap-2 group cursor-pointer">
              <input
                type="checkbox"
                checked={use3DModels}
                onChange={(e) => setUse3DModels(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-1"
              />
              <span className="text-text-primary group-hover:text-primary transition-colors duration-200">
                3D 모델
              </span>
            </label>
            <label className="flex items-center gap-2 group cursor-pointer">
              <input
                type="checkbox"
                checked={showHuman}
                onChange={(e) => setShowHuman(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-1"
              />
              <span className="text-text-primary group-hover:text-primary transition-colors duration-200">
                사람 표시
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 오른쪽 UI 패널들 */}
      <div className="absolute top-4 right-4 z-10 space-y-4 w-80 max-w-sm">
        {/* 데이터 저장 패널 */}
        <div className="backdrop-blur-lg p-4 rounded-xl shadow-lg bg-surface/85 border border-border/50 hover:bg-surface/90 transition-all duration-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h4 className="font-bold text-sm text-text-primary">데이터 저장</h4>
          </div>
          <div className="space-y-3">
            <LoadingButton
              onClick={async () => {
                if (furniture.length === 0 && detectedWindows.length === 0) {
                  return;
                }

                try {
                  setIsSaving(true);
                  const saveData = createRoomLayoutData(
                    w,
                    d,
                    h,
                    furniture,
                    detectedWindows
                  );
                  await saveRoomLayoutToMongoDB(saveData);
                  showSuccess(
                    `저장 완료! 가구 ${furniture.length}개, 창문 ${detectedWindows.length}개`
                  );
                } catch (error) {
                  showError(`MongoDB 저장 실패: ${error.message}`);
                } finally {
                  setIsSaving(false);
                }
              }}
              loading={isSaving}
              loadingText="저장 중..."
              disabled={furniture.length === 0 && detectedWindows.length === 0}
              className="w-full px-4 py-3 bg-white text-primary border border-primary rounded-lg text-sm font-semibold hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            >
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Save Layout
              </span>
            </LoadingButton>
            <div className="flex items-center justify-center gap-3 text-xs text-text-secondary bg-background px-3 py-2 rounded-lg">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>가구 {furniture.length}개</span>
              </div>
              <div className="w-px h-3 bg-border"></div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>창문 {detectedWindows.length}개</span>
              </div>
            </div>
          </div>
        </div>

        {/* 창문 감지 패널 */}
        {uploadedImageFile && (
          <div className="backdrop-blur-lg p-4 rounded-xl shadow-lg bg-surface/85 border border-border/50 hover:bg-surface/90 transition-all duration-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <svg
                  className="w-4 h-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                  />
                </svg>
              </div>
              <h4 className="font-bold text-sm text-text-primary">창문 감지</h4>
            </div>
            <div className="space-y-3">
              <LoadingButton
                onClick={handleDetectWindows}
                loading={isDetectingWindows}
                loadingText="창문 감지 중..."
                className="w-full px-4 py-3 bg-white text-primary border border-primary rounded-lg text-sm font-semibold hover:bg-background disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  AI 창문 감지
                </span>
              </LoadingButton>
            </div>
          </div>
        )}

        {/* 창문 조정 패널 */}
        {detectedWindows.length > 0 && (
          <div className="backdrop-blur-lg p-4 rounded-xl shadow-lg bg-surface/85 border border-border/50 hover:bg-surface/90 transition-all duration-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <svg
                  className="w-4 h-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
              </div>
              <h4 className="font-bold text-sm text-text-primary">창문 조정</h4>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {detectedWindows.map((window, index) => (
                <div
                  key={index}
                  className="bg-background p-3 rounded-lg space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="text-xs font-medium text-text-secondary">
                      창문 {index + 1}:{" "}
                      {Math.round((window.width_meters || 1.2) * 100)}×
                      {Math.round((window.height_meters || 1.5) * 100)}cm (
                      {window.wall_position}벽)
                    </div>
                    <button
                      onClick={() => {
                        const newWindows = detectedWindows.filter(
                          (_, i) => i !== index
                        );
                        setDetectedWindows(newWindows);
                      }}
                      className="text-danger hover:text-danger-dark p-1"
                      title="창문 삭제"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* 수평 위치 조정 */}
                  <div className="flex gap-1 items-center">
                    <span className="text-xs w-12 text-text-secondary">
                      수평:
                    </span>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={window.x_position || 0.5}
                      onChange={(e) => {
                        const newWindows = [...detectedWindows];
                        newWindows[index] = {
                          ...window,
                          x_position: parseFloat(e.target.value),
                        };
                        setDetectedWindows(newWindows);
                      }}
                      className="flex-1 h-1"
                    />
                    <span className="text-xs w-8">
                      {Math.round((window.x_position || 0.5) * 100)}%
                    </span>
                  </div>

                  {/* 수직 위치 조정 */}
                  <div className="flex gap-1 items-center">
                    <span className="text-xs w-12 text-text-secondary">
                      수직:
                    </span>
                    <input
                      type="range"
                      min="0.3"
                      max="1.0"
                      step="0.05"
                      value={window.y_position || 0.8}
                      onChange={(e) => {
                        const newWindows = [...detectedWindows];
                        newWindows[index] = {
                          ...window,
                          y_position: parseFloat(e.target.value),
                        };
                        setDetectedWindows(newWindows);
                      }}
                      className="flex-1 h-1"
                    />
                    <span className="text-xs w-8">
                      {Math.round((window.y_position || 0.8) * 100)}%
                    </span>
                  </div>

                  {/* 창문 너비 조정 */}
                  <div className="flex gap-1 items-center">
                    <span className="text-xs w-12 text-text-secondary">
                      너비:
                    </span>
                    <input
                      type="range"
                      min="60"
                      max="400"
                      value={Math.round((window.width_meters || 1.2) * 100)}
                      onChange={(e) => {
                        const newWindows = [...detectedWindows];
                        newWindows[index] = {
                          ...window,
                          width_meters: parseInt(e.target.value) / 100,
                        };
                        setDetectedWindows(newWindows);
                      }}
                      className="flex-1 h-1"
                    />
                    <span className="text-xs w-12">
                      {Math.round((window.width_meters || 1.2) * 100)}cm
                    </span>
                  </div>

                  {/* 창문 높이 조정 */}
                  <div className="flex gap-1 items-center">
                    <span className="text-xs w-12 text-text-secondary">
                      높이:
                    </span>
                    <input
                      type="range"
                      min="60"
                      max="300"
                      value={Math.round((window.height_meters || 1.5) * 100)}
                      onChange={(e) => {
                        const newWindows = [...detectedWindows];
                        newWindows[index] = {
                          ...window,
                          height_meters: parseInt(e.target.value) / 100,
                        };
                        setDetectedWindows(newWindows);
                      }}
                      className="flex-1 h-1"
                    />
                    <span className="text-xs w-12">
                      {Math.round((window.height_meters || 1.5) * 100)}cm
                    </span>
                  </div>
                </div>
              ))}

              {/* 새 창문 추가 버튼 */}
              <button
                onClick={() => {
                  const newWindow = {
                    wall_position: "back",
                    x_position: 0.5,
                    y_position: 0.8,
                    width_meters: 1.2,
                    height_meters: 1.5,
                    confidence: 1.0,
                  };
                  setDetectedWindows([...detectedWindows, newWindow]);
                }}
                className="w-full px-3 py-2 bg-white text-primary border border-primary rounded-lg text-xs font-medium hover:bg-background transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
              >
                <span className="flex items-center justify-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  새 창문 추가
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 뷰 컨트롤 */}
        <ViewPresets
          onViewChange={(preset) =>
            handleViewChange(preset, controlsRef, setActiveView)
          }
          roomSize={roomSize}
        />

        {/* 공간 분석 */}
        <SpaceUtilization
          furniture={furniture}
          roomArea={roomArea}
          furniturePresets={FURNITURE_PRESETS}
        />
      </div>

      {/* 3D Canvas */}
      <div className="relative w-full h-full">
        <SafeCanvas
          camera={{
            position: [w, h, d],
            fov: 50,
            near: 1,
            far: Math.max(w, h, d) * 5,
          }}
          shadows="soft"
          gl={{
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
            outputColorSpace: THREE.SRGBColorSpace,
            shadowMapType: THREE.PCFSoftShadowMap,
            physicallyCorrectLights: true,
          }}
        >
          <Suspense fallback={null}>
            <EnhancedLighting roomSize={roomSize} />
            <Environment
              preset="studio"
              background={false}
              environmentIntensity={0.8}
              environmentRotation={[0, Math.PI / 4, 0]}
            />
            <color attach="background" args={["#e0f2fe"]} />

            {/* 바닥 */}
            <mesh
              position={[w / 2, 0, d / 2]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
              onClick={(event) =>
                handleFloorClick(event, measurementMode, setMeasurePoints)
              }
            >
              <planeGeometry args={[w, d]} />
              <meshPhysicalMaterial
                color={placementMode ? "#E1F5FE" : floorSettings.color}
                roughness={floorSettings.roughness}
                metalness={floorSettings.metalness}
                clearcoat={floorSettings.metalness > 0.1 ? 0.8 : 0.15}
                clearcoatRoughness={floorSettings.roughness}
                normalScale={[1.0, 1.0]}
                envMapIntensity={1.0}
                reflectivity={floorSettings.metalness > 0.1 ? 0.9 : 0.1}
                transmission={0}
                thickness={0.1}
              />
            </mesh>

            {/* 왼쪽 벽 */}
            <Wall
              width={d}
              height={h}
              position={[0, h / 2, d / 2]}
              rotation={[0, Math.PI / 2, 0]}
              color={wallSettings.color}
              roughness={wallSettings.roughness}
              metalness={wallSettings.metalness}
            />

            {/* 뒤쪽 벽 */}
            <Wall
              width={w}
              height={h}
              position={[w / 2, h / 2, 0]}
              rotation={[0, 0, 0]}
              color={wallSettings.color}
              roughness={wallSettings.roughness}
              metalness={wallSettings.metalness}
            />

            <SnapGrid roomSize={roomSize} visible={showSnapGrid} />
            <FloorGrid roomSize={roomSize} visible={showFloorGrid} />

            {placementMode && (
              <ValidPlacementArea
                roomSize={roomSize}
                furniture={furniture}
                furniturePresets={FURNITURE_PRESETS}
                selectedFurnitureSize={FURNITURE_PRESETS[placementMode].size}
              />
            )}

            {furniture.map((f) => (
              <DraggableFurnitureWithCollision
                key={f.id}
                {...f}
                onMove={handleMoveFurniture}
                onSelect={setSelectedFurniture}
                selected={selectedFurniture === f.id}
                furniture={furniture}
                furniturePresets={FURNITURE_PRESETS}
                roomSize={roomSize}
                enableSnap={enableSnap}
                showCollisions={showCollisions}
                onDragStateChange={setIsDragging}
                customFurnitureData={f.isCustom ? f : null}
                updatePlacedFurniturePosition={
                  updatePlacedFurniturePositionOnDragEnd
                }
                use3DModels={use3DModels}
              />
            ))}

            {showWindows && detectedWindows.length > 0 && (
              <WindowsOnWalls windows={detectedWindows} roomSize={roomSize} />
            )}

            {showHuman && (
              <DraggableHuman
                height={170}
                position={humanPosition}
                onPositionChange={setHumanPosition}
                roomSize={roomSize}
                onDragStateChange={setIsDragging}
              />
            )}

            <DistanceMeasurer
              point1={measurePoints[0]}
              point2={measurePoints[1]}
              visible={measurementMode && !!measurePoints[0]}
            />

            <group position={[0, 0.1, 0]}>
              <DimensionArrow start={[0, 0, d + 10]} end={[w, 0, d + 10]} />
              <DimensionLabel
                position={[w / 2, 0, d + 15]}
                text={`${(w / 100).toFixed(1)}m`}
              />
              <DimensionArrow start={[w + 10, 0, 0]} end={[w + 10, 0, d]} />
              <DimensionLabel
                position={[w + 15, 0, d / 2]}
                text={`${(d / 100).toFixed(1)}m`}
                rotation={[0, Math.PI / 2, 0]}
              />
              <DimensionArrow start={[w + 10, 0, 0]} end={[w + 10, h, 0]} />
              <DimensionLabel
                position={[w + 15, h / 2, 0]}
                text={`${(h / 100).toFixed(1)}m`}
              />
            </group>

            <OrbitControls
              ref={controlsRef}
              enablePan={!isDragging}
              enableZoom={!isDragging}
              enableRotate={!isDragging}
              minDistance={50}
              maxDistance={Math.max(w, h, d) * 2}
              maxPolarAngle={Math.PI / 2.1}
              target={[w / 2, h / 3, d / 2]}
              enableDamping
              dampingFactor={0.1}
            />
          </Suspense>
        </SafeCanvas>
      </div>

      {/* 배치 가이드 */}
      {placementMode && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="animate-pulse bg-accent/20 rounded-full p-8">
              <div className="bg-primary/30 rounded-full p-6">
                <div className="bg-secondary/40 rounded-full p-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-primary text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
              바닥을 클릭하여 {FURNITURE_PRESETS[placementMode]?.name}를
              배치하세요
            </div>
          </div>
        </div>
      )}

      <PlacementGuide
        placementMode={placementMode}
        onClose={() => setPlacementMode(null)}
      />

      {/* Toast 알림 */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* 중앙 하단 버튼들 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-4 items-center">
        {/* 3D 화면 캡처 버튼 */}
        <button
          onClick={handle3DCapture}
          disabled={furniture.length === 0}
          className="group flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div className="text-left">
            <div className="font-bold text-sm">3D 화면 캡처</div>
            <div className="text-xs text-white/80">가구 스타일 변경용</div>
          </div>
        </button>

        {/* AI 인테리어 생성 버튼 */}
        <button
          onClick={handleAIInteriorGenerate}
          className="group flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div className="text-left">
            <div className="font-bold text-sm">AI 인테리어 생성</div>
            <div className="text-xs text-white/80">
              방 크기 기반 맞춤 디자인
            </div>
          </div>
          <svg
            className="w-5 h-5 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* 캡처된 이미지 미리보기 - 우상단 */}
      {capturedScreenshot && (
        <div className="absolute top-20 right-4 bg-white rounded-xl shadow-lg p-3 w-48 z-30">
          <div className="text-xs font-medium text-gray-600 mb-2">
            캡처된 이미지
          </div>
          <img
            src={capturedScreenshot.imageData}
            alt="캡처된 3D 화면"
            className="w-full h-auto rounded-lg border border-gray-200"
          />
          <div className="text-xs text-gray-500 mt-2">
            {capturedScreenshot.selectedFurniture?.name || "가구 미선택"}
            <br />
            <span className="text-green-600">저장됨 ✓</span>
          </div>
        </div>
      )}
    </div>
  );
}
