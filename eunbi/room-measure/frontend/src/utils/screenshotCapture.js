export const downloadCapturedImage = (dataURL, screenshotData) => {
  try {
    // 파일명 생성 (타임스탬프 + 선택된 가구 정보)
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const selectedFurnitureName =
      screenshotData.selectedFurniture?.name || "no-selection";
    const filename = `3d-capture-${selectedFurnitureName}-${timestamp}.png`;

    // Blob 생성
    const byteCharacters = atob(dataURL.split(",")[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/png" });

    // 다운로드 링크 생성
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = filename;

    // 자동 다운로드 실행
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // URL 정리
    URL.revokeObjectURL(downloadLink.href);

    console.log(`📸 3D 캡처 이미지 저장 완료: ${filename}`);
    return true;
  } catch (error) {
    console.error("이미지 저장 실패:", error);
    return false;
  }
};

export const createScreenshotCapture = (
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
) => {
  return () => {
    try {
      // Canvas 요소 찾기 (React Three Fiber의 Canvas)
      const canvasElement = document.querySelector("canvas");

      if (!canvasElement) {
        showError("3D 캔버스를 찾을 수 없습니다");
        return;
      }

      showInfo("3D 화면을 캡처하고 있습니다...");

      // 렌더링이 완료될 때까지 잠시 대기
      setTimeout(() => {
        try {
          // Canvas에서 이미지 데이터 추출 (고품질)
          const dataURL = canvasElement.toDataURL("image/png", 1.0);

          // 이미지가 검은색인지 확인
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const data = imageData.data;

            // 검은색 픽셀 비율 확인
            let blackPixels = 0;
            for (let i = 0; i < data.length; i += 4) {
              if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) {
                blackPixels++;
              }
            }

            const blackRatio = blackPixels / (data.length / 4);

            if (blackRatio > 0.8) {
              showWarning("캡처된 이미지가 검은색입니다. 다시 시도해주세요.");
              return;
            }

            // 캡처된 스크린샷 데이터 생성
            const screenshotData = {
              imageData: dataURL,
              timestamp: new Date().toISOString(),
              furniture: furniture.map((f) => ({
                id: f.id,
                type: f.type,
                name: f.name,
                position: f.position,
                size: f.size,
                selected: f.id === selectedFurniture,
              })),
              selectedFurniture: selectedFurniture
                ? furniture.find((f) => f.id === selectedFurniture)
                : null,
              roomSize: [w, h, d],
              canvasSize: {
                width: canvasElement.width,
                height: canvasElement.height,
              },
            };

            setCapturedScreenshot(screenshotData);

            // 로컬 스토리지에 캡처 데이터 저장
            localStorage.setItem(
              "capturedScreenshot",
              JSON.stringify(screenshotData)
            );

            // 캡처된 이미지를 파일로 자동 저장
            const success = downloadCapturedImage(dataURL, screenshotData);

            showSuccess(
              `3D 화면 캡처 완료! ${furniture.length}개 가구 감지됨${
                success ? " (이미지 저장됨)" : ""
              }`
            );

            // 스타일 변경 패널로 데이터 전달
            if (selectedFurniture) {
              showInfo(
                `선택된 가구: ${
                  screenshotData.selectedFurniture?.name || "없음"
                } - AI 인테리어 페이지에서 스타일을 변경할 수 있습니다`
              );
            } else {
              showWarning("가구를 먼저 선택한 후 스타일을 변경할 수 있습니다");
            }
          };

          img.src = dataURL;
        } catch (error) {
          console.error("캡처 처리 실패:", error);
          showError("3D 화면 캡처에 실패했습니다");
        }
      }, 200); // 200ms 대기로 렌더링 완료 보장
    } catch (error) {
      console.error("3D 캡처 실패:", error);
      showError("3D 화면 캡처에 실패했습니다");
    }
  };
};