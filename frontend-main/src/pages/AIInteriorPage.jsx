import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import AIInteriorGenerator from '../components/AIInteriorGenerator';
import { useAuth } from '../contexts/AuthContext';

const AIInteriorPage = () => {
  const location = useLocation();
  const [capturedScreenshot, setCapturedScreenshot] = useState(null);
  const { isAuthenticated, isLoading } = useAuth();

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

  // 인증 상태 로딩 중 표시
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-text-secondary">사용자 정보를 확인 중입니다...</p>
      </div>
    );
  }

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
          {!isAuthenticated ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                로그인이 필요한 서비스입니다
              </h2>
              <p className="text-text-secondary mb-6">
                AI 인테리어 기능을 사용하고 생성된 이미지를 저장하려면 로그인을 해주세요.
              </p>
              <Link 
                to="/login"
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                로그인 페이지로 이동
              </Link>
            </div>
          ) : (
            <>
              {/* AI 인테리어 생성기 */}
              <AIInteriorGenerator 
                capturedScreenshot={capturedScreenshot}
                onImageGenerated={(image) => {
                  console.log('AI 인테리어 이미지 생성 완료:', image);
                }}
              />

            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default AIInteriorPage;