import { useState } from 'react';
import ImageRealisticGenerator from './components/ImageRealisticGenerator';

function App() {
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            AI 실사 인테리어 생성
          </h1>
          <p className="text-text-secondary">
            다양한 AI 모델로 방 스크린샷을 실사 인테리어로 변환합니다
          </p>
        </div>
        
        <ImageRealisticGenerator />
        
        {/* 사용 가이드 */}
        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 사용 가이드</h3>
          <div className="text-blue-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>JSON 파일과 스크린샷 이미지를 업로드하세요</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>원하는 인테리어 스타일을 선택하세요</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>AI Provider와 세부 설정을 조정하세요</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>생성 버튼을 클릭하여 실사 인테리어를 만들어보세요</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;