/**
 * 이미지 압축 유틸리티
 * Base64 이미지를 압축하여 localStorage 용량 문제 해결
 */

/**
 * Base64 이미지를 압축하는 함수
 * @param {string} base64Image - data:image/... 형태의 base64 이미지
 * @param {number} maxWidth - 최대 너비 (기본 1024px)
 * @param {number} maxHeight - 최대 높이 (기본 1024px) 
 * @param {number} quality - JPEG 품질 (0.1~1.0, 기본 0.8)
 * @returns {Promise<string>} 압축된 base64 이미지
 */
export const compressBase64Image = async (base64Image, maxWidth = 1024, maxHeight = 1024, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        // Canvas 생성
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 원본 크기
        const { width: originalWidth, height: originalHeight } = img;
        
        // 비율 유지하면서 리사이즈 계산
        let { width, height } = calculateResizedDimensions(
          originalWidth, 
          originalHeight, 
          maxWidth, 
          maxHeight
        );
        
        // Canvas 크기 설정
        canvas.width = width;
        canvas.height = height;
        
        // 고품질 렌더링 설정
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);
        
        // 압축된 이미지를 JPEG로 변환 (더 작은 용량)
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        resolve(compressedBase64);
      };
      
      img.onerror = () => {
        reject(new Error('이미지 로드 실패'));
      };
      
      img.src = base64Image;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 리사이즈 치수 계산 (비율 유지)
 */
const calculateResizedDimensions = (originalWidth, originalHeight, maxWidth, maxHeight) => {
  let width = originalWidth;
  let height = originalHeight;
  
  // 가로가 더 긴 경우
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  
  // 세로가 더 긴 경우  
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
};

/**
 * Base64 이미지 크기 계산 (대략적)
 * @param {string} base64String - base64 문자열
 * @returns {number} 바이트 크기
 */
export const getBase64Size = (base64String) => {
  if (!base64String) return 0;
  
  // data:image/jpeg;base64, 부분 제거
  const base64Data = base64String.split(',')[1] || base64String;
  
  // Base64는 실제 데이터보다 약 33% 크므로
  return Math.round(base64Data.length * 0.75);
};

/**
 * 크기를 사람이 읽기 쉬운 형태로 변환
 * @param {number} bytes - 바이트 크기
 * @returns {string} 포맷된 크기 (예: "2.3MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * localStorage 안전 저장 (압축 포함)
 * @param {string} key - 저장할 키
 * @param {string} base64Image - 저장할 이미지
 * @param {boolean} compress - 압축 여부 (기본 true)
 */
export const safeLocalStorageSetItem = async (key, base64Image, compress = true) => {
  try {
    let imageToStore = base64Image;
    
    if (compress) {
      const originalSize = getBase64Size(base64Image);
      
      // 1MB 이상인 경우만 압축
      if (originalSize > 1024 * 1024) {
        console.log(`이미지 압축 시작: ${formatFileSize(originalSize)}`);
        
        imageToStore = await compressBase64Image(base64Image, 1024, 1024, 0.8);
        const compressedSize = getBase64Size(imageToStore);
        
        console.log(`압축 완료: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (${Math.round((1 - compressedSize/originalSize) * 100)}% 절약)`);
      }
    }
    
    localStorage.setItem(key, imageToStore);
    return imageToStore;
    
  } catch (error) {
    console.warn(`localStorage 저장 실패 (${key}):`, error);
    
    // 압축을 더 강하게 시도
    if (compress) {
      try {
        const stronglyCompressed = await compressBase64Image(base64Image, 800, 800, 0.6);
        localStorage.setItem(key, stronglyCompressed);
        console.log('강력 압축으로 저장 성공');
        return stronglyCompressed;
      } catch (secondError) {
        console.error('강력 압축도 실패:', secondError);
        throw secondError;
      }
    } else {
      throw error;
    }
  }
};