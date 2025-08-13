import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import WebGLErrorBoundary from './WebGLErrorBoundary';
import { isWebGLSupported, testWebGLContext } from '../utils/webglDetection';

/**
 * WebGL 지원을 안전하게 처리하는 Canvas 래퍼 컴포넌트
 */
const SafeCanvas = ({ children, fallback, onWebGLError, ...canvasProps }) => {
  const [webglStatus, setWebglStatus] = useState('checking');
  const [webglError, setWebglError] = useState(null);

  useEffect(() => {
    // WebGL 지원 상태 확인
    const checkWebGL = async () => {
      try {
        const isSupported = isWebGLSupported();
        
        if (!isSupported) {
          setWebglError('WebGL이 지원되지 않습니다');
          setWebglStatus('unsupported');
          onWebGLError?.('WebGL not supported');
          return;
        }

        // 더 상세한 WebGL 테스트
        const testResult = testWebGLContext();
        
        if (!testResult.supported) {
          setWebglError(testResult.error || 'WebGL 컨텍스트 생성 실패');
          setWebglStatus('error');
          onWebGLError?.(testResult.error);
          return;
        }

        setWebglStatus('supported');
      } catch (error) {
        console.error('WebGL check failed:', error);
        setWebglError(error.message);
        setWebglStatus('error');
        onWebGLError?.(error.message);
      }
    };

    checkWebGL();
  }, [onWebGLError]);

  // WebGL 검사 중일 때 로딩 표시
  if (webglStatus === 'checking') {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-background border border-border rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">3D 뷰어 초기화 중...</p>
        </div>
      </div>
    );
  }

  // WebGL을 지원하지 않거나 에러가 발생한 경우 폴백 렌더링
  if (webglStatus === 'unsupported' || webglStatus === 'error') {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px] bg-background border border-border rounded-lg">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            3D 뷰어를 사용할 수 없습니다
          </h3>
          <p className="text-text-secondary text-sm mb-4">
            {webglError || 'WebGL을 지원하지 않는 환경입니다'}
          </p>
          <p className="text-text-secondary text-xs">
            2D Floor Plan 탭을 사용하여 방 평면도를 확인하세요
          </p>
        </div>
      </div>
    );
  }

  // WebGL이 지원되는 경우 Canvas 렌더링
  return (
    <WebGLErrorBoundary>
      <Canvas
        {...canvasProps}
        gl={{
          // 맥OS에서 WebGL 호환성을 위한 관대한 설정
          alpha: true,
          antialias: true,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: true,
          depth: true,
          stencil: true,
          premultipliedAlpha: true,
          ...canvasProps.gl
        }}
        onCreated={(state) => {
          // Canvas가 성공적으로 생성되었을 때의 추가 설정
          console.log('WebGL Canvas created successfully');
          try {
            // WebGL 컨텍스트 정보 출력 (안전하게)
            if (state.gl && typeof state.gl.getParameter === 'function') {
              console.log('WebGL info:', {
                renderer: state.gl.getParameter(state.gl.RENDERER),
                vendor: state.gl.getParameter(state.gl.VENDOR),
                version: state.gl.getParameter(state.gl.VERSION)
              });
            } else {
              console.log('WebGL context available:', !!state.gl);
            }
          } catch (infoError) {
            console.log('Could not get WebGL info:', infoError.message);
          }
          canvasProps.onCreated?.(state);
        }}
        onError={(error) => {
          console.error('Canvas error:', error);
          setWebglError(error.message);
          setWebglStatus('error');
          onWebGLError?.(error.message);
        }}
      >
        {children}
      </Canvas>
    </WebGLErrorBoundary>
  );
};

export default SafeCanvas;