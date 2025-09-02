import React, { useState, useEffect } from 'react';

const AILoadingOverlay = ({ 
  isVisible, 
  title = "AI가 인테리어를 생성하고 있습니다...", 
  subtitle = "잠시만 기다려주세요",
  estimatedTime = 30,
  onComplete 
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(estimatedTime);

  const steps = [
    { id: 0, text: "방 구조 분석 중...", duration: 3 },
    { id: 1, text: "스타일 패턴 적용 중...", duration: 5 },
    { id: 2, text: "가구 배치 최적화 중...", duration: 8 },
    { id: 3, text: "조명 및 색상 조정 중...", duration: 6 },
    { id: 4, text: "최종 렌더링 중...", duration: 8 },
  ];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStep(0);
      setTimeLeft(estimatedTime);
      return;
    }

    let totalElapsed = 0;
    const interval = setInterval(() => {
      totalElapsed += 0.5;
      
      // 진행률 계산 (0-95% 까지, 마지막 5%는 실제 완료시)
      const newProgress = Math.min(95, (totalElapsed / estimatedTime) * 95);
      setProgress(newProgress);
      
      // 현재 단계 계산
      let cumulativeDuration = 0;
      let stepIndex = 0;
      
      for (let i = 0; i < steps.length; i++) {
        cumulativeDuration += steps[i].duration;
        if (totalElapsed <= cumulativeDuration) {
          stepIndex = i;
          break;
        }
      }
      
      setCurrentStep(stepIndex);
      setTimeLeft(Math.max(0, estimatedTime - totalElapsed));

      // 예상 시간 초과시 99%에서 대기
      if (totalElapsed >= estimatedTime) {
        setProgress(99);
        setCurrentStep(steps.length - 1);
        setTimeLeft(0);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible, estimatedTime]);

  // 외부에서 완료 신호를 받으면 100%로 설정
  useEffect(() => {
    if (onComplete) {
      setProgress(100);
      setTimeout(() => {
        // 완료 애니메이션 후 오버레이 숨김
      }, 1000);
    }
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-md w-mx-4 text-center shadow-2xl">
        {/* AI 아이콘 */}
        <div className="mb-6">
          <div className="relative mx-auto w-20 h-20">
            {/* 회전하는 원 */}
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div 
              className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"
              style={{ 
                animationDuration: '2s',
                transform: `rotate(${progress * 3.6}deg)` 
              }}
            ></div>
            
            {/* 중앙 AI 아이콘 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center animate-pulse">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 제목 */}
        <h3 className="text-xl font-bold text-gray-800 mb-2" style={{fontFamily: "'Inter', 'Pretendard', sans-serif"}}>
          {title}
        </h3>

        {/* 부제목 */}
        <p className="text-gray-600 mb-6" style={{fontFamily: "'Inter', 'Pretendard', sans-serif"}}>
          {subtitle}
        </p>

        {/* 진행률 바 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">진행률</span>
            <span className="text-sm font-semibold text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* 진행률 바 애니메이션 효과 */}
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* 현재 단계 */}
        <div className="mb-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
            <span className="text-sm text-gray-700 font-medium">
              {steps[currentStep]?.text || "처리 중..."}
            </span>
          </div>
        </div>

        {/* 단계 표시기 */}
        <div className="flex justify-center gap-2 mb-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index <= currentStep 
                  ? 'bg-primary' 
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* 예상 시간 */}
        {timeLeft > 0 && (
          <p className="text-xs text-gray-500">
            예상 소요 시간: 약 {Math.ceil(timeLeft)}초
          </p>
        )}

        {/* 완료 시 메시지 */}
        {progress >= 100 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700 font-medium">생성 완료!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AILoadingOverlay;