/**
 * Input sanitization utilities to prevent XSS attacks
 * @author AI Security Assistant
 * @version 1.0
 */

/**
 * HTML 태그와 특수문자를 이스케이프하여 XSS 공격을 방지
 * @param {string} str - 입력 문자열
 * @returns {string} 안전하게 이스케이프된 문자열
 */
export const escapeHtml = (str) => {
  if (typeof str !== 'string') return '';
  
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return str.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
};

/**
 * 자바스크립트 코드 삽입을 방지하는 URL sanitizer
 * @param {string} url - 검증할 URL
 * @returns {string|null} 안전한 URL 또는 null
 */
export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return null;
  
  // javascript:, data:, vbscript: 등 위험한 프로토콜 차단
  const dangerousProtocols = /^(javascript|data|vbscript|file|ftp):/i;
  
  if (dangerousProtocols.test(url.trim())) {
    return null;
  }
  
  // 상대 경로나 http/https 프로토콜만 허용
  const safeUrlPattern = /^(https?:\/\/|\/|\.\/|#)/i;
  
  return safeUrlPattern.test(url.trim()) ? url : null;
};

/**
 * CSS 입력값 sanitization (특정 속성만 허용)
 * @param {string} css - CSS 문자열
 * @returns {string} 안전한 CSS 문자열
 */
export const sanitizeCss = (css) => {
  if (typeof css !== 'string') return '';
  
  // 위험한 CSS 함수들 제거
  const dangerousPatterns = [
    /expression\s*\(/gi,
    /javascript\s*:/gi,
    /vbscript\s*:/gi,
    /data\s*:/gi,
    /import\s+/gi,
    /@import/gi,
    /binding\s*:/gi
  ];
  
  let safeCss = css;
  dangerousPatterns.forEach(pattern => {
    safeCss = safeCss.replace(pattern, '');
  });
  
  return safeCss;
};

/**
 * 사용자 입력 텍스트에서 HTML 태그 완전 제거
 * @param {string} str - 입력 문자열
 * @returns {string} HTML 태그가 제거된 순수 텍스트
 */
export const stripHtml = (str) => {
  if (typeof str !== 'string') return '';
  
  return str.replace(/<[^>]*>/g, '');
};

/**
 * 파일명에서 위험한 문자 제거
 * @param {string} filename - 파일명
 * @returns {string} 안전한 파일명
 */
export const sanitizeFilename = (filename) => {
  if (typeof filename !== 'string') return '';
  
  // 경로 순회 공격 방지 및 특수문자 제거
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
    .substring(0, 255);
};

/**
 * JSON 데이터 안전성 검증
 * @param {any} data - 검증할 데이터
 * @returns {boolean} 안전한 데이터인지 여부
 */
export const isJsonSafe = (data) => {
  try {
    if (typeof data === 'string') {
      // 문자열에 스크립트 코드가 포함되어 있는지 검사
      const scriptPattern = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
      const jsPattern = /javascript\s*:/gi;
      const onPattern = /\bon\w+\s*=/gi;
      
      return !scriptPattern.test(data) && !jsPattern.test(data) && !onPattern.test(data);
    }
    
    if (typeof data === 'object' && data !== null) {
      // 재귀적으로 객체의 모든 속성 검사
      return Object.values(data).every(value => isJsonSafe(value));
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 개발 환경에서만 콘솔 로깅 허용
 * @param {...any} args - 로그 인수들
 */
export const safeLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

/**
 * 프로덕션 환경에서 민감한 정보 마스킹
 * @param {string} str - 마스킹할 문자열
 * @param {number} visibleChars - 보이는 문자 수 (기본: 4)
 * @returns {string} 마스킹된 문자열
 */
export const maskSensitiveData = (str, visibleChars = 4) => {
  if (typeof str !== 'string' || str.length <= visibleChars) {
    return str;
  }
  
  if (process.env.NODE_ENV === 'production') {
    const visible = str.substring(0, visibleChars);
    const masked = '*'.repeat(str.length - visibleChars);
    return visible + masked;
  }
  
  return str;
};

/**
 * 보안 헤더 검증
 * @param {Object} headers - HTTP 헤더
 * @returns {Object} 검증된 헤더
 */
export const validateHeaders = (headers) => {
  const safeHeaders = {};
  
  Object.keys(headers).forEach(key => {
    const value = headers[key];
    
    // 헤더 값에서 개행 문자 제거 (헤더 인젝션 방지)
    if (typeof value === 'string') {
      safeHeaders[key] = value.replace(/[\r\n]/g, '');
    } else {
      safeHeaders[key] = value;
    }
  });
  
  return safeHeaders;
};

/**
 * API 응답 데이터 검증
 * @param {any} response - API 응답 데이터
 * @returns {any} 검증된 응답 데이터
 */
export const validateApiResponse = (response) => {
  if (!response || typeof response !== 'object') {
    return response;
  }
  
  // 재귀적으로 문자열 속성들을 이스케이프
  const sanitizeObject = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }
    
    if (typeof obj === 'string') {
      return escapeHtml(obj);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      Object.keys(obj).forEach(key => {
        sanitized[key] = sanitizeObject(obj[key]);
      });
      return sanitized;
    }
    
    return obj;
  };
  
  return sanitizeObject(response);
};

// 기본 설정
export const XSS_CONFIG = {
  maxStringLength: 10000,
  allowedTags: [], // HTML 태그 허용 안 함
  allowedAttributes: [], // HTML 속성 허용 안 함
  allowedProtocols: ['http', 'https', 'mailto', 'tel'],
  logSecurityEvents: process.env.NODE_ENV === 'development'
};

export default {
  escapeHtml,
  sanitizeUrl,
  sanitizeCss,
  stripHtml,
  sanitizeFilename,
  isJsonSafe,
  safeLog,
  maskSensitiveData,
  validateHeaders,
  validateApiResponse,
  XSS_CONFIG
};