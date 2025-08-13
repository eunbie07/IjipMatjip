import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AIInteriorGenerator from '../components/AIInteriorGenerator';

const AIInteriorPage = () => {
  const location = useLocation();
  const [capturedScreenshot, setCapturedScreenshot] = useState(null);


  // 라우트 state와 로컬 스토리지에서 캡처 데이터 복원
  useEffect(() => {
    // 먼저 라우트 state에서 확인
    if (location.state?.capturedScreenshot) {
      setCapturedScreenshot(location.state.capturedScreenshot);
      // localStorage에도 저장 (백업용)
      localStorage.setItem('capturedScreenshot', JSON.stringify(location.state.capturedScreenshot));
    } else {
      // 라우트 state에 없으면 localStorage에서 복원
      const savedScreenshot = localStorage.getItem('capturedScreenshot');
      if (savedScreenshot) {
        try {
          const parsed = JSON.parse(savedScreenshot);
          setCapturedScreenshot(parsed);
        } catch (error) {
          console.error('캡처 데이터 파싱 실패:', error);
        }
      }
    }
  }, [location.state]);


  // 3D 캡처 핸들러 (RoomBox에서 호출 가능하도록)
  const handle3DCapture = () => {
    // 실제로는 RoomBox 컴포넌트가 아니므로 안내 메시지 표시
    alert('3D 화면 캡처는 방 편집 화면에서만 가능합니다. 방 편집 화면으로 돌아가서 캡처 후 다시 시도해주세요.');
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            AI 인테리어 디자이너
          </h1>
          <p className="text-text-secondary">
            캡처된 방 이미지를 바탕으로 AI가 맞춤형 인테리어 디자인을 생성해드립니다.
          </p>
        </div>


        {/* AI 인테리어 생성기 */}
        <AIInteriorGenerator 
          capturedScreenshot={capturedScreenshot}
          onImageGenerated={(image) => {
            console.log('AI 인테리어 이미지 생성 완료:', image);
          }}
        />

        {/* 3D 캡처 안내 */}
        {!capturedScreenshot && (
          <div className="mt-8 p-6 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl">📸</div>
              <h3 className="text-lg font-semibold text-orange-900">3D 캡처 기반 가구 스타일 변경</h3>
            </div>
            <div className="text-orange-800 space-y-2">
              <p>개별 가구의 스타일을 변경하려면:</p>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                <li>방 편집 화면으로 돌아가서 가구를 선택하세요</li>
                <li>"📸 3D 화면 캡처" 버튼을 클릭하세요</li>
                <li>다시 이 페이지로 와서 "가구 스타일 변경"을 선택하세요</li>
              </ol>
              <button
                onClick={() => window.history.back()}
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                ← 방 편집 화면으로 돌아가기
              </button>
            </div>
          </div>
        )}

        {/* 캡처 이미지가 없을 때 안내 */}
        {!capturedScreenshot && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              3D 캡처 이미지가 없습니다
            </h2>
            <p className="text-text-secondary mb-6">
              AI 인테리어 디자인을 생성하려면 3D 화면을 캡처하거나 직접 이미지를 업로드해주세요.
            </p>
            <a 
              href="/"
              className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              방 편집 화면으로 가기
            </a>
          </div>
        )}

      </div>
    </div>
  );
};

export default AIInteriorPage;