import { useEffect } from 'react';

/**
 * 키보드 컨트롤 훅
 * 가구 조작, 모드 전환, 단축키 등을 처리
 */
export const useKeyboardControls = (
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
) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // 이미 입력 필드에 포커스가 있으면 키보드 이벤트 무시
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'delete':
        case 'backspace':
          if (selectedFurniture) {
            event.preventDefault();
            handleDeleteFurniture(selectedFurniture.id);
          }
          break;

        case 'r':
          if (selectedFurniture) {
            event.preventDefault();
            handleRotateFurniture(selectedFurniture.id, 90);
          }
          break;

        case 'escape':
          event.preventDefault();
          setSelectedFurniture(null);
          setPlacementMode(false);
          setMeasurementMode(false);
          setMeasurePoints([]);
          break;

        case 'm':
          event.preventDefault();
          setMeasurementMode(!measurementMode);
          if (measurementMode) {
            setMeasurePoints([]);
          }
          break;

        case 'g':
          event.preventDefault();
          setShowFloorGrid(!showFloorGrid);
          break;

        case 's':
          event.preventDefault();
          setEnableSnap(!enableSnap);
          break;

        default:
          break;
      }
    };

    // 키보드 이벤트 리스너 등록
    document.addEventListener('keydown', handleKeyDown);

    // 클린업 함수
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
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
  ]);
};
