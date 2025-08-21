// components/categories/LazyImage.jsx

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

const LazyImage = ({ src, alt, className }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* 로딩 스피너 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm text-gray-500">이미지 로딩 중...</span>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 text-gray-400">📷</div>
            <span className="text-sm text-gray-500">이미지를 불러올 수 없습니다</span>
          </div>
        </div>
      )}

      {/* 실제 이미지 */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-contain rounded-lg transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};

export default LazyImage;
