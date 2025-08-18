import { detectWindowsInImage } from "./api";

export const createWindowDetectionHandler = (
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
) => {
  return async () => {
    if (!uploadedImageFile) {
      return;
    }
    setIsDetectingWindows(true);
    try {
      const roomDimensions = {
        width_cm: w,
        height_cm: h,
        depth_cm: d,
        area_sqm: (w * d) / 10000,
        wall_height_cm: h,
        scale_factor: 1,
      };

      const wallInfo = {
        front_wall: { width: w, height: h, position: "front" },
        back_wall: { width: w, height: h, position: "back" },
        left_wall: { width: d, height: h, position: "left" },
        right_wall: { width: d, height: h, position: "right" },
      };

      const result = await detectWindowsInImage(
        uploadedImageFile,
        wallInfo,
        roomDimensions
      );

      if (result.windows && result.windows.length > 0) {
        const validatedWindows = result.windows.map((window, index) => {
          const minWidth = 60;
          const maxWidth = Math.min(200, w * 0.8);
          const minHeight = 80;
          const maxHeight = Math.min(180, h * 0.8);

          let adjustedWindow = { ...window };

          if (window.width_meters) {
            const widthCm = window.width_meters * 100;
            adjustedWindow.width_meters =
              Math.max(minWidth, Math.min(maxWidth, widthCm)) / 100;
          } else {
            adjustedWindow.width_meters = 1.2;
          }

          if (window.height_meters) {
            const heightCm = window.height_meters * 100;
            adjustedWindow.height_meters =
              Math.max(minHeight, Math.min(maxHeight, heightCm)) / 100;
          } else {
            adjustedWindow.height_meters = 1.5;
          }

          if (
            !window.wall_position ||
            !["front", "back", "left", "right"].includes(window.wall_position)
          ) {
            adjustedWindow.wall_position = "back";
          }

          return adjustedWindow;
        });

        setDetectedWindows(validatedWindows);
        setShowWindows(true);
        showSuccess(`${validatedWindows.length}개의 창문을 감지했습니다`);
      } else {
        showWarning("창문을 감지하지 못했습니다");
      }
    } catch (error) {
      showError(`창문 감지 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsDetectingWindows(false);
    }
  };
};