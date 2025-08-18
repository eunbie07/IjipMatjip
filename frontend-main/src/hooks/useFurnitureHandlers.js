import { useCallback } from "react";
import { FURNITURE_PRESETS } from "../constants/furniture";
import CollisionDetector from "../utils/CollisionDetector";
import { convertCoordinatesLocally } from "../utils/coordinateConversion";

export const useFurnitureHandlers = (
  placementMode,
  setPlacementMode,
  furniture,
  setFurniture,
  selectedFurniture,
  setSelectedFurniture,
  roomSize,
  onFurnitureChange,
  updatePlacedFurniturePositionOnDragEnd,
  isUpdatingFromDragRef
) => {
  const handleViewChange = useCallback(
    (preset, controlsRef, setActiveView) => {
      if (controlsRef.current) {
        controlsRef.current.object.position.set(...preset.position);
        controlsRef.current.target.set(...preset.target);
        controlsRef.current.update();
        setActiveView(preset.name);
      }
    },
    []
  );

  const handlePlaceFurniture = useCallback(
    (position) => {
      if (!placementMode) return;

      const preset = FURNITURE_PRESETS[placementMode];
      if (!preset) return;

      const newFurniture = {
        id: `${placementMode}_${Date.now()}`,
        type: placementMode,
        position: position,
        rotation: [0, 0, 0],
        size: preset.size,
        name: preset.name,
        color: preset.color,
      };

      const adjustedPosition = CollisionDetector.adjustToValidPosition(
        position,
        newFurniture.size,
        roomSize,
        furniture,
        newFurniture.id,
        FURNITURE_PRESETS
      );

      const furnitureCollisions = CollisionDetector.checkFurnitureCollisions(
        furniture,
        newFurniture.id,
        adjustedPosition,
        FURNITURE_PRESETS
      );

      if (furnitureCollisions.length === 0) {
        newFurniture.position = adjustedPosition;
        setFurniture((prev) => [...prev, newFurniture]);
        setSelectedFurniture(newFurniture.id);
        setPlacementMode(null);

        // 2D와 동기화
        if (typeof onFurnitureChange === "function") {
          const { position: pos3D, size } = newFurniture;
          const [x3D, y3D, z3D] = pos3D;

          const x2D = x3D - size[0] / 2;
          const z2D = z3D - size[2] / 2;

          const newItem2D = {
            id: newFurniture.id,
            x: x2D,
            z: z2D,
            width: size[0],
            depth: size[2],
            rotation: 0,
            type: newFurniture.type,
            name: newFurniture.name,
            color: newFurniture.color,
          };

          onFurnitureChange((prev) => [...prev, newItem2D]);
        }
      }
    },
    [placementMode, furniture, roomSize, onFurnitureChange, setFurniture, setSelectedFurniture, setPlacementMode]
  );

  const handleFloorClick = useCallback(
    (event, measurementMode, setMeasurePoints) => {
      event.stopPropagation();
      if (placementMode) {
        const position = [
          event.point.x,
          FURNITURE_PRESETS[placementMode].size[1] / 2,
          event.point.z,
        ];
        handlePlaceFurniture(position);
      } else if (measurementMode) {
        const clickPoint = [event.point.x, event.point.y, event.point.z];
        setMeasurePoints((prev) =>
          prev[0] ? [prev[0], clickPoint] : [clickPoint, null]
        );
      }
    },
    [placementMode, handlePlaceFurniture]
  );

  const handleMoveFurniture = useCallback((id, newPosition) => {
    setFurniture((prev) => {
      const updated = prev.map((f) => {
        if (f.id === id) {
          return { ...f, position: newPosition };
        }
        return f;
      });
      return updated;
    });
  }, [setFurniture]);

  const handleRotateFurniture = useCallback(
    (id) => {
      setFurniture((prev) =>
        prev.map((f) => {
          if (f.id === id) {
            const newRotation = [0, f.rotation[1] + Math.PI / 2, 0];
            const updatedFurniture = { ...f, rotation: newRotation };

            // 회전 후 2D 좌표도 업데이트
            if (updatePlacedFurniturePositionOnDragEnd) {
              updatePlacedFurniturePositionOnDragEnd(
                id,
                f.position,
                newRotation
              );
            }

            return updatedFurniture;
          }
          return f;
        })
      );
    },
    [updatePlacedFurniturePositionOnDragEnd, setFurniture]
  );

  const handleDeleteFurniture = useCallback(
    (id) => {
      setFurniture((prev) => prev.filter((f) => f.id !== id));
      if (selectedFurniture === id) {
        setSelectedFurniture(null);
      }

      if (typeof onFurnitureChange === "function") {
        onFurnitureChange((prev) => prev.filter((item) => item.id !== id));
      }
    },
    [selectedFurniture, onFurnitureChange, setFurniture, setSelectedFurniture]
  );

  const handleAddFurniture = useCallback((type) => {
    setPlacementMode(type);
  }, [setPlacementMode]);

  const updatePlacedFurniturePositionOnDragEndHandler = useCallback(
    (id, newPosition, newRotation) => {
      if (typeof onFurnitureChange === "function") {
        const furnitureItem = furniture.find((f) => f.id === id);

        if (furnitureItem) {
          const size = furnitureItem.size;
          isUpdatingFromDragRef.current = true;
          const converted2D = convertCoordinatesLocally(
            id,
            newPosition,
            size,
            roomSize
          );

          // 3D 회전을 2D 회전으로 변환 (Y축 회전만 사용)
          const rotation2D = newRotation
            ? Math.round((newRotation[1] * 180) / Math.PI)
            : 0;

          onFurnitureChange((prev) => {
            const updated = prev.map((item) => {
              if (item.id === id) {
                const newItem = {
                  ...item,
                  x: converted2D.x,
                  z: converted2D.z,
                  rotation: rotation2D,
                };
                console.log("3D → 2D 업데이트:", {
                  id,
                  "3D position": newPosition,
                  "2D position": { x: converted2D.x, z: converted2D.z },
                  "3D rotation": newRotation,
                  "2D rotation": rotation2D,
                });
                return newItem;
              }
              return item;
            });
            return updated;
          });

          setTimeout(() => {
            isUpdatingFromDragRef.current = false;
          }, 100);
        }
      }
    },
    [furniture, onFurnitureChange, roomSize]
  );

  return {
    handleViewChange,
    handlePlaceFurniture,
    handleFloorClick,
    handleMoveFurniture,
    handleRotateFurniture,
    handleDeleteFurniture,
    handleAddFurniture,
    updatePlacedFurniturePositionOnDragEnd: updatePlacedFurniturePositionOnDragEndHandler,
  };
};