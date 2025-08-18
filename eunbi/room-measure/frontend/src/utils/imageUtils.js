/**
 * URL에서 이미지를 가져와서 File 객체로 변환하는 함수
 * @param {string} imageUrl - 이미지 URL
 * @returns {Promise<File>} - File 객체
 */
import client from "../api/client";

export const fetchImageFromUrl = async (imageUrl) => {
  try {
    // URL 유효성 검사
    const url = new URL(imageUrl);

    // 개발 환경에서는 Vite 프록시를 경유하도록 경로 변환
    const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
    const shouldUseViteProxy = isDev && url.host === 'img.peterpanz.com';
    const fetchUrl = shouldUseViteProxy
      ? `/imgp${url.pathname}${url.search}`
      : imageUrl;

    // CORS 이슈를 피하기 위해 (개발 시) 프록시 경유 요청
    let response = await fetch(fetchUrl, {
      method: 'GET',
      // 동일 오리진(프록시)일 때는 기본 모드로 충분
    });

    // 프로덕션 등에서 원본으로 직접 접근 시 CORS가 막힐 수 있으므로 백엔드 프록시로 재시도
    if (!response.ok || (response.type === 'opaque' && !isDev)) {
      const apiBase = (client && client.defaults && client.defaults.baseURL) ? client.defaults.baseURL : '';
      if (!apiBase) {
        throw new Error(`프록시 재시도 실패: API base URL 없음`);
      }
      const proxyUrl = `${apiBase}/proxy/image?url=${encodeURIComponent(imageUrl)}`;
      response = await fetch(proxyUrl, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`HTTP error via proxy! status: ${response.status}`);
      }
    }

    // 이미지 데이터를 Blob으로 가져오기
    const blob = await response.blob();
    
    // Content-Type 확인
    if (!blob.type.startsWith('image/')) {
      throw new Error('URL이 이미지 파일이 아닙니다.');
    }

    // 파일명 추출 (URL에서 파일명이 없으면 기본값 사용)
    const urlParts = url.pathname.split('/');
    const fileName = urlParts[urlParts.length - 1] || 'image.jpg';
    
    // Blob을 File 객체로 변환
    const file = new File([blob], fileName, { type: blob.type });
    
    return file;
  } catch (error) {
    console.error('이미지 URL에서 파일 가져오기 실패:', error);
    throw new Error(`이미지를 가져올 수 없습니다: ${error.message}`);
  }
};

/**
 * URL이 유효한 이미지 URL인지 확인하는 함수
 * @param {string} url - 확인할 URL
 * @returns {boolean} - 유효한 이미지 URL인지 여부
 */
export const isValidImageUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const pathname = urlObj.pathname.toLowerCase();
    
    // 파일 확장자 확인
    const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));
    
    // 또는 이미지 관련 경로 패턴 확인
    const hasImagePattern = /\/photo\/|\/image\/|\/img\//.test(pathname);
    
    return hasImageExtension || hasImagePattern;
  } catch {
    return false;
  }
};
