import React from 'react';

const ProgressBar = ({ currentStep, progress, steps }) => {
  return (
    <div className="mb-6">
      {/* 단계별 이름 표시 */}
      <div className="flex justify-between mb-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center text-center flex-1">
            {/* 단계 아이콘 */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-all duration-300 ${
              progress >= step.progress ? 
                'bg-primary text-white' : 
                currentStep === step.id ? 
                  'bg-primary/20 text-primary border-2 border-primary' : 
                  'bg-gray-200 text-gray-400'
            }`}>
              {progress >= step.progress ? (
                // 완료된 단계는 체크 아이콘
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                // 진행 중이거나 대기 중인 단계는 번호
                <span className="text-xs font-bold">{index + 1}</span>
              )}
            </div>
            {/* 단계 이름 */}
            <div className={`text-xs font-medium transition-colors duration-300 ${
              currentStep === step.id ? 'text-primary' : 
              progress >= step.progress ? 'text-green-600' : 'text-gray-400'
            }`}>
              {step.name}
            </div>
          </div>
        ))}
      </div>
      
      {/* 진행률 바 */}
      <div className="relative mb-2">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* 진행률 퍼센트 표시 */}
        <div 
          className="absolute top-0 h-3 flex items-center transition-all duration-500"
          style={{ left: `${Math.max(0, Math.min(95, progress - 2.5))}%` }}
        >
          <div className="bg-primary text-white text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap">
            {progress}%
          </div>
        </div>
      </div>
      
      {/* 현재 단계 설명 */}
      <div className="text-center">
        <div className="text-sm text-text-primary font-medium">
          {steps.find(step => step.id === currentStep)?.name || '처리 중...'}
        </div>
        {currentStep === 'processing' && (
          <div className="text-xs text-text-secondary mt-1">
            AI가 이미지를 분석하고 있습니다... (약 30초 소요)
          </div>
        )}
        {currentStep === 'clicking' && (
          <div className="text-xs text-text-secondary mt-1">
            방의 네 모서리를 순서대로 클릭해주세요
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;