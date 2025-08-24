/**
 * URL에서 이미지를 가져와서 File 객체로 변환하는 함수
 * @param {string} imageUrl - 이미지 URL
 * @returns {Promise<File>} - File 객체
 */
import client from "../api/client";

export const fetchImageFromUrl = async (imageUrl) => {
  try {
    // URL 유효성 검사
    const originalUrl = new URL(imageUrl);

    const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
    const viteProxyUrl = `/imgp${originalUrl.pathname}${originalUrl.search}`;

    const apiBase = (client && client.defaults && client.defaults.baseURL) ? client.defaults.baseURL : '';
    const explicitProxyBase = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PROXY_BASE;

    // 가능한 프록시 후보들을 우선순위에 따라 정렬
    const proxyBases = [
      apiBase && `${apiBase}/api`,
      apiBase && `${apiBase}`,
      explicitProxyBase && `${explicitProxyBase}`,
      'http://13.55.21.100:3000'
    ].filter(Boolean);

    const candidateUrls = [
      // 개발 환경에서는 Vite 프록시 우선
      ...(isDev ? [viteProxyUrl] : []),
      // 프로덕션 환경: 백엔드 프록시 API 우선 사용
      ...(!isDev ? [`${import.meta.env.VITE_CLOUD_API_BASE}/proxy/image?url=${encodeURIComponent(imageUrl)}`] : []),
      // 원본 직접 접근 (CORS 허용 시)
      imageUrl,
      // 기타 백엔드 프록시 후보들
      ...proxyBases.map(base => `${base}/proxy/image?url=${encodeURIComponent(imageUrl)}`)
    ];

    let lastError;
    for (const candidate of candidateUrls) {
      try {
        const resp = await fetch(candidate, { method: 'GET' });
        if (!resp || !resp.ok) {
          lastError = new Error(`HTTP ${resp?.status}`);
          continue;
        }
        const blob = await resp.blob();

        // 1) 정상 이미지 타입이면 그대로 사용
        if (blob.type && blob.type.startsWith('image/')) {
          const urlParts = originalUrl.pathname.split('/');
          const fileName = urlParts[urlParts.length - 1] || 'image.jpg';
          return new File([blob], fileName, { type: blob.type });
        }

        // 2) 서버가 Content-Type을 잘못 주는 경우: 확장자로 보완 판정
        const pathnameLower = originalUrl.pathname.toLowerCase();
        const extToMime = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.bmp': 'image/bmp'
        };
        const matchedExt = Object.keys(extToMime).find(ext => pathnameLower.endsWith(ext));
        if (matchedExt) {
          const guessedType = extToMime[matchedExt];
          const urlParts = originalUrl.pathname.split('/');
          const fileName = urlParts[urlParts.length - 1] || `image${matchedExt}`;
          return new File([blob], fileName, { type: guessedType });
        }

        lastError = new Error('콘텐츠 타입/확장자 모두 이미지 아님');
        continue;
      } catch (e) {
        lastError = e;
        continue;
      }
    }

    throw lastError || new Error('모든 소스 시도 실패');
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
