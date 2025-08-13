/**
 * WebGL 지원 감지 및 컨텍스트 생성 유틸리티
 */

/**
 * WebGL 지원 여부 확인 (강화된 버전)
 * @returns {boolean} WebGL 지원 여부
 */
export function isWebGLSupported() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    // Chrome/Safari macOS를 위한 강제 활성화 옵션들
    const aggressiveOptions = [
      // 기본적이고 안전한 설정
      { 
        alpha: false, 
        antialias: false, 
        depth: false, 
        stencil: false, 
        preserveDrawingBuffer: false,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false
      },
      // 소프트웨어 렌더링 허용
      { 
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'low-power'
      },
      // 최소 기능 설정
      {
        alpha: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: 'default'
      },
      // 강제 시도 (모든 제약 무시)
      {}
    ];
    
    let gl = null;
    
    // WebGL 컨텍스트 타입들을 순서대로 시도
    const contextTypes = ['webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl'];
    
    for (const options of aggressiveOptions) {
      for (const contextType of contextTypes) {
        try {
          gl = canvas.getContext(contextType, options);
          if (gl && typeof gl.getExtension === 'function') {
            // 기본 WebGL 기능 테스트
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            console.log(`WebGL context created with ${contextType}:`, options);
            break;
          }
        } catch (contextError) {
          continue;
        }
      }
      if (gl) break;
    }
    
    const supported = !!(gl && typeof gl.getExtension === 'function');
    
    // 메모리 정리
    if (gl) {
      try {
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
          loseContext.loseContext();
        }
      } catch (cleanupError) {
        // 정리 실패는 무시
      }
    }
    canvas.remove();
    
    return supported;
  } catch (e) {
    console.warn('WebGL detection failed:', e);
    return false;
  }
}

/**
 * WebGL 2.0 지원 여부 확인
 * @returns {boolean} WebGL 2.0 지원 여부
 */
export function isWebGL2Supported() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    const supported = !!gl;
    
    // 메모리 정리
    if (gl) {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    canvas.remove();
    
    return supported;
  } catch (e) {
    return false;
  }
}

/**
 * WebGL 컨텍스트 생성 테스트
 * @returns {Object} 테스트 결과
 */
export function testWebGLContext() {
  const result = {
    supported: false,
    webgl2: false,
    error: null,
    renderer: null,
    vendor: null,
    version: null,
    platform: null
  };

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    // 맥OS를 위한 다양한 컨텍스트 옵션
    const contextOptions = [
      { alpha: false, antialias: false, depth: true, stencil: false, preserveDrawingBuffer: false, powerPreference: 'default' },
      { alpha: true, antialias: true, depth: true, stencil: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' },
      { powerPreference: 'low-power', failIfMajorPerformanceCaveat: false },
      {}  // 기본 옵션
    ];
    
    let gl = null;
    let optionsUsed = null;
    
    // 여러 옵션으로 컨텍스트 생성 시도
    for (const options of contextOptions) {
      try {
        gl = canvas.getContext('webgl2', options) || 
             canvas.getContext('webgl', options) || 
             canvas.getContext('experimental-webgl', options);
        
        if (gl) {
          optionsUsed = options;
          break;
        }
      } catch (contextError) {
        console.warn('Context creation attempt failed:', contextError);
        continue;
      }
    }

    if (gl) {
      result.supported = true;
      result.webgl2 = !!canvas.getContext('webgl2');
      
      try {
        result.renderer = gl.getParameter(gl.RENDERER) || 'Unknown';
        result.vendor = gl.getParameter(gl.VENDOR) || 'Unknown';
        result.version = gl.getParameter(gl.VERSION) || 'Unknown';
        result.platform = navigator.platform;
        result.optionsUsed = optionsUsed;
        
        // 간단한 렌더링 테스트
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
      } catch (infoError) {
        console.warn('Failed to get WebGL info:', infoError);
      }

      // 메모리 정리
      try {
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
          loseContext.loseContext();
        }
      } catch (cleanupError) {
        console.warn('Failed to cleanup WebGL context:', cleanupError);
      }
    } else {
      result.error = 'WebGL context creation failed with all options';
    }
    
    canvas.remove();
  } catch (e) {
    result.error = e.message;
    console.error('WebGL test failed:', e);
  }

  return result;
}

/**
 * 디바이스의 WebGL 능력 확인
 * @returns {Object} 디바이스 능력 정보
 */
export function getWebGLCapabilities() {
  const capabilities = {
    supported: false,
    maxTextureSize: 0,
    maxVertexTextures: 0,
    maxFragmentTextures: 0,
    extensions: []
  };

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (gl) {
      capabilities.supported = true;
      capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      capabilities.maxVertexTextures = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
      capabilities.maxFragmentTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
      capabilities.extensions = gl.getSupportedExtensions() || [];

      // 메모리 정리
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    
    canvas.remove();
  } catch (e) {
    console.warn('WebGL capabilities check failed:', e);
  }

  return capabilities;
}