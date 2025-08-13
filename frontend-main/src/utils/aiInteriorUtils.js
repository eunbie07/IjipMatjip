export const createAIInteriorHandler = (
  w,
  h,
  d,
  furniture,
  navigate,
  showInfo,
  showSuccess,
  showError,
  setCapturedScreenshot
) => {
  return async () => {
    try {
      showInfo("3D 화면을 캡처하고 있습니다...");

      // 3D 화면 캡처
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        showError("3D 캔버스를 찾을 수 없습니다.");
        return;
      }

      // 캔버스 데이터를 이미지로 변환
      const imageData = canvas.toDataURL('image/png');
      
      // 캡처된 스크린샷을 상태로 저장
      const captureData = {
        imageData,
        furniture: furniture.length > 0 ? furniture[0] : null,
        timestamp: new Date().toISOString(),
        roomDimensions: { width: w, height: h, depth: d }
      };
      
      setCapturedScreenshot(captureData);
      showSuccess("3D 화면 캡처 완료!");

      showInfo("방 데이터를 저장하고 있습니다...");

      // 이상적인 JSON 구조에 맞게 가구 데이터 변환
      const sceneObjects = furniture.map((f) => ({
        name: f.name || f.type,
        type: f.type,
        position: f.position,
        rotation_y: f.rotation ? Math.round((f.rotation[1] * 180) / Math.PI) : 0,
        size: f.size,
      }));

      // 현재 방 데이터 준비 (네비게이션용)
      const roomData = {
        dimensions: {
          width_cm: w,
          height_cm: h,
          depth_cm: d,
        },
        area_sqm: (w * d) / 10000,
        volume_cum: (w * h * d) / 1000000,
        furniture_3d: sceneObjects,
        created_at: new Date().toISOString(),
        capturedScreenshot: captureData,
      };

      // MongoDB에 저장할 데이터 (API가 사용할 최종 JSON 구조)
      const saveData = {
        scene: {
          description: "AI 인테리어 생성을 위한 방 공간",
          room: {
            width: w,
            depth: d,
            height: h,
          },
          objects: sceneObjects,
        },
        // 기존에 있던 추가 정보들도 유지
        area_sqm: (w * d) / 10000,
        volume_cum: (w * h * d) / 1000000,
        created_at: new Date().toISOString(),
        capturedScreenshot: captureData,
      };

      // MongoDB 저장
      const { saveRoomLayoutToMongoDB } = await import("./api");
      const saveResult = await saveRoomLayoutToMongoDB(saveData);

      console.log("MongoDB 저장 성공:", saveResult);

      // localStorage에도 저장 (백업용)
      localStorage.setItem("currentRoomData", JSON.stringify(roomData));
      localStorage.setItem("mongoRoomId", saveResult.layout_id);

      showSuccess("방 데이터 저장 완료!");

      // AI 인테리어 페이지로 네비게이션 (MongoDB ID 포함)
      navigate("/ai-interior", {
        state: {
          roomData,
          mongoId: saveResult.layout_id,
          capturedScreenshot: captureData,
        },
      });

      showInfo("AI 인테리어 디자이너로 이동합니다...");
    } catch (error) {
      console.error("방 데이터 저장 실패:", error);
      showError("방 데이터 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };
};