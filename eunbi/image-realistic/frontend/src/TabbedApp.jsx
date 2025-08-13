import React, { useState } from 'react';
import OriginalApp from './App.jsx';
import SimpleTestApp from './SimpleTest.jsx';

function TabbedApp() {
  const [activeTab, setActiveTab] = useState('original');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 탭 네비게이션 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('original')}
              className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'original'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🏠 원래 App (ImageRealisticGenerator)
            </button>
            <button
              onClick={() => setActiveTab('simple')}
              className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'simple'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ✨ 간단한 테스트 (AI 인테리어 생성기)
            </button>
          </div>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="w-full">
        {activeTab === 'original' && <OriginalApp />}
        {activeTab === 'simple' && <SimpleTestApp />}
      </div>
    </div>
  );
}

export default TabbedApp;