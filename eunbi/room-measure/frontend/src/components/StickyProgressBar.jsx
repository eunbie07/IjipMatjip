import React from 'react';

const StickyProgressBar = ({ currentStep, progress, steps, isVisible }) => {
  if (!isVisible) return null;

  const currentStepData = steps.find(step => step.id === currentStep);

  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* 현재 단계 아이콘 */}
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
              progress >= 100 ? 
                'bg-green-500 text-white' : 
                'bg-primary text-white'
            }`}>
              {progress >= 100 ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </div>
            
            {/* 현재 단계 이름 */}
            <span className="text-sm font-medium text-text-primary hidden sm:inline">
              {currentStepData?.name || '처리 중'}
            </span>
          </div>

          {/* 진행률 바 */}
          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 진행률 퍼센트 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary tabular-nums">
              {progress}%
            </span>
            
            {/* 처리 상태 표시 */}
            {currentStep === 'processing' && (
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            )}
          </div>
        </div>

        {/* 모바일에서 단계 이름과 안내 메시지 */}
        <div className="sm:hidden mt-2">
          <div className="text-xs font-medium text-text-primary">
            {currentStepData?.name}
          </div>
          {currentStep === 'processing' && (
            <div className="text-xs text-text-secondary">
              AI 분석 중... (약 30초)
            </div>
          )}
          {currentStep === 'clicking' && (
            <div className="text-xs text-text-secondary">
              방의 네 모서리를 클릭하세요
            </div>
          )}
        </div>

        {/* 데스크톱에서 안내 메시지 */}
        <div className="hidden sm:block">
          {currentStep === 'processing' && (
            <div className="text-xs text-text-secondary text-center mt-1">
              AI가 이미지를 분석하고 있습니다... (약 30초 소요)
            </div>
          )}
          {currentStep === 'clicking' && (
            <div className="text-xs text-text-secondary text-center mt-1">
              방의 네 모서리를 순서대로 클릭해주세요
            </div>
          )}
          {currentStep === 'measuring' && (
            <div className="text-xs text-text-secondary text-center mt-1">
              선택된 포인트를 기반으로 방 크기를 계산하고 있습니다...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickyProgressBar;