import React from 'react'

// --- 스타일 탭 컴포넌트 ---
const StyleTab = ({ styles, activeStyle, onStyleChange, styleLabels }) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
      {styles.map((style) => (
        <button
          key={style}
          onClick={() => onStyleChange(style)}
          className={`px-4 py-2 sm:px-6 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff7e97] ${
            activeStyle === style
              ? 'bg-[#ff7e97] text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 hover:border-gray-400'
          }`}
        >
          {styleLabels[style]}
        </button>
      ))}
    </div>
  );
};

export default StyleTab