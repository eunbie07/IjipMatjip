import React, { useState } from "react";
import { fetchImageFromUrl, isValidImageUrl } from "../utils/imageUtils";

const ImageUrlInput = ({ onUpload, isProcessing }) => {
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    
    if (!imageUrl.trim()) {
      setError("이미지 URL을 입력해주세요.");
      return;
    }

    if (!isValidImageUrl(imageUrl)) {
      setError("유효한 이미지 URL이 아닙니다.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const file = await fetchImageFromUrl(imageUrl);
      onUpload(file);
      setImageUrl(""); // 성공 시 입력 필드 초기화
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlChange = (e) => {
    setImageUrl(e.target.value);
    if (error) setError(""); // 입력 시 에러 메시지 초기화
  };

  return (
    <div className="w-full">
      <form onSubmit={handleUrlSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={imageUrl}
            onChange={handleUrlChange}
            placeholder="이미지 URL을 입력하세요 (예: https://example.com/image.jpg)"
            className="flex-1 border border-border rounded-lg px-4 py-3 focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-50 text-sm"
            disabled={isLoading || isProcessing}
          />
          <button
            type="submit"
            disabled={isLoading || isProcessing || !imageUrl.trim()}
            className="bg-primary text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
          >
            {isLoading ? "가져오는 중..." : "URL에서 가져오기"}
          </button>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}
        
        <div className="text-xs text-text-secondary">
          지원 형식: JPG, PNG, GIF, WebP, BMP
        </div>
      </form>
    </div>
  );
};

export default ImageUrlInput;
