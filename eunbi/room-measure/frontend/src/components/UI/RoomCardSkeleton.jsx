import React from 'react';

const RoomCardSkeleton = () => {
  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden animate-pulse">
      {/* 이미지 영역 스켈레톤 */}
      <div className="relative h-48 bg-gray-200">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"></div>
      </div>
      
      {/* 콘텐츠 영역 스켈레톤 */}
      <div className="p-4">
        {/* 방 이름 */}
        <div className="h-6 bg-gray-200 rounded-lg mb-3 w-3/4"></div>
        
        {/* 생성 날짜 */}
        <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
        
        {/* AI 이미지 태그들 */}
        <div className="flex gap-2 mb-4">
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>
        
        {/* 버튼 영역 */}
        <div className="flex gap-2 pt-2">
          <div className="flex-1 h-9 bg-gray-200 rounded-lg"></div>
          <div className="h-9 w-9 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default RoomCardSkeleton;