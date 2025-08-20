import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
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

  // 3D capture handler (for RoomBox component calls)
  const handle3DCapture = () => {
    // Display guide message since this is not the RoomBox component
    alert('3D screen capture is only available in the room editing screen. Please return to the room editor and try again after capturing.');
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 pt-24 md:pt-28 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6 leading-tight">
            AI <span className="text-primary">Interior</span> Designer
          </h1>
          <p className="text-lg text-text-secondary mb-8">
            Generate personalized interior designs using artificial intelligence from captured room images
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* AI 인테리어 생성기 */}
          <AIInteriorGenerator 
            capturedScreenshot={capturedScreenshot}
            onImageGenerated={(image) => {
              console.log('AI 인테리어 이미지 생성 완료:', image);
            }}
          />

          {/* 3D Capture Guide */}
          {!capturedScreenshot && (
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl">📸</div>
                <h3 className="text-lg font-semibold text-blue-900">3D Capture-based Furniture Style Change</h3>
              </div>
              <div className="text-blue-800 space-y-2">
                <p>To change individual furniture styles:</p>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>Return to the room editing screen and select furniture</li>
                  <li>Click the "📸 3D Screen Capture" button</li>
                  <li>Come back to this page and select "Change Furniture Style"</li>
                </ol>
                <button
                  onClick={() => window.history.back()}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
                >
                  ← Back to Room Editor
                </button>
              </div>
            </div>
          )}

          {/* No Capture Image Guide */}
          {!capturedScreenshot && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📸</div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                No 3D Capture Image
              </h2>
              <p className="text-text-secondary mb-6">
                To generate AI interior designs, please capture a 3D screen or upload an image directly.
              </p>
              <Link 
                to="/room-planner"
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Go to Room Editor
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AIInteriorPage;