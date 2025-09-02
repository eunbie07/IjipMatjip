import React, { useState, useEffect } from 'react';

const ProcessingSteps = ({ message }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { id: 0, text: "이미지를 분석하고 있습니다...", keywords: ["분석", "업로드", "처리"] },
    { id: 1, text: "방의 깊이를 측정하고 있습니다...", keywords: ["깊이", "depth", "측정"] },
    { id: 2, text: "방 크기를 계산하고 있습니다...", keywords: ["크기", "계산", "size"] },
    { id: 3, text: "3D 모델을 생성하고 있습니다...", keywords: ["3D", "모델", "생성"] },
    { id: 4, text: "결과를 준비하고 있습니다...", keywords: ["완료", "결과", "준비"] }
  ];

  useEffect(() => {
    // 메시지 내용에 따라 현재 단계 추정
    const lowerMessage = message.toLowerCase();
    const matchedStep = steps.find(step => 
      step.keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()))
    );
    
    if (matchedStep) {
      setCurrentStep(matchedStep.id);
    }
  }, [message]);

  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm p-4 max-w-sm mx-auto scale-75 transform">
      <div className="mb-6">
        {/* 회전하는 3D 아이콘 */}
        <div className="relative mx-auto w-16 h-16 mb-4">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-text-primary text-center mb-2">
          방 측정 중...
        </h3>
        <p className="text-text-secondary text-center text-sm">
          {steps[currentStep]?.text || message}
        </p>
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

      {/* 진행률 바 */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
      
      <p className="text-center text-xs text-text-secondary mt-2">
        {currentStep + 1} / {steps.length} 단계
      </p>
    </div>
  );
};

export default ProcessingSteps;