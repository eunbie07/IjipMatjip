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

    // 개발 환경에서는 Vite 프록시를, 운영 환경에서는 백엔드 프록시를 우선 사용
    const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
    const isTargetHost = url.host === 'img.peterpanz.com';

    const viteProxyUrl = `/imgp${url.pathname}${url.search}`;
    const apiBase = (client && client.defaults && client.defaults.baseURL) ? client.defaults.baseURL : '';
    const backendProxyUrl = apiBase ? `${apiBase}/proxy/image?url=${encodeURIComponent(imageUrl)}` : '';

    let response;

    if (isDev && isTargetHost) {
      // 개발: Vite 프록시 사용
      response = await fetch(viteProxyUrl, { method: 'GET' });
    } else if (!isDev && isTargetHost && backendProxyUrl) {
      // 운영: 대상 호스트는 항상 백엔드 프록시 사용 (CORS 회피)
      response = await fetch(backendProxyUrl, { method: 'GET' });
    } else {
      // 그 외: 원본 시도 후 실패/차단 시 백엔드 프록시 폴백
      try {
        response = await fetch(imageUrl, { method: 'GET' });
      } catch (e) {
        response = undefined;
      }
      if (!response || !response.ok || (response.type === 'opaque' && !isDev)) {
        if (!backendProxyUrl) {
          throw new Error(`프록시 재시도 실패: API base URL 없음`);
        }
        response = await fetch(backendProxyUrl, { method: 'GET' });
        if (!response.ok) {
          throw new Error(`HTTP error via proxy! status: ${response.status}`);
        }
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
