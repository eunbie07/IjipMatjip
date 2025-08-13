// components/categories/LazyImage.jsx

import React, { useState, useEffect } from 'react';

const LazyImage = ({ src, alt, className }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    // src는 동적 import 함수.
    src().then(module => {
      if (isMounted) {
        setImageSrc(module.default);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [src]);
  return (
    <div className={`relative w-full h-full ${className}`}>
    {/* 로딩 중일 때 보여줄 UI (스켈레톤 UI) */}
    {isLoading && (
        <div className='absolute inset-0 bg-gray-200 animate-pulse rounded-lg'/>
    )}
    <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover rounded-lg transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
    />
    </div>
  )
};

export default LazyImage;