import React, { useEffect, useState } from 'react';
import { testWebGLContext, getWebGLCapabilities, isWebGLSupported } from '../utils/webglDetection';

/**
 * WebGL 디버깅 정보를 표시하는 컴포넌트
 */
const WebGLDebugger = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        const supported = isWebGLSupported();
        const testResult = testWebGLContext();
        const caps = getWebGLCapabilities();

        setDebugInfo({
          supported,
          testResult,
          browserInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            vendor: navigator.vendor,
            hardwareConcurrency: navigator.hardwareConcurrency
          }
        });
        
        setCapabilities(caps);
      } catch (error) {
        setDebugInfo({
          error: error.message,
          supported: false
        });
      } finally {
        setLoading(false);
      }
    };

    runDiagnostics();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        <p className="text-center mt-2">3D 기능 확인 중...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg space-y-4">
      <h3 className="font-bold text-lg">3D 기능 진단 정보</h3>
      
      {/* 기본 지원 여부 */}
      <div className="bg-white p-3 rounded border">
        <h4 className="font-semibold mb-2">기본 지원 상태</h4>
        <div className="text-sm space-y-1">
          <div>3D 기능 지원: {debugInfo?.supported ? '✅ 지원됨' : '❌ 지원안됨'}</div>
          {debugInfo?.error && (
            <div className="text-red-600">오류: {debugInfo.error}</div>
          )}
        </div>
      </div>

      {/* 상세 테스트 결과 */}
      {debugInfo?.testResult && (
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold mb-2">상세 테스트 결과</h4>
          <div className="text-sm space-y-1">
            <div>3D 기능 지원: {debugInfo.testResult.supported ? '✅' : '❌'}</div>
            <div>고급 3D 기능: {debugInfo.testResult.webgl2 ? '✅' : '❌'}</div>
            {debugInfo.testResult.renderer && (
              <div>렌더러: {debugInfo.testResult.renderer}</div>
            )}
            {debugInfo.testResult.vendor && (
              <div>벤더: {debugInfo.testResult.vendor}</div>
            )}
            {debugInfo.testResult.version && (
              <div>버전: {debugInfo.testResult.version}</div>
            )}
            {debugInfo.testResult.platform && (
              <div>플랫폼: {debugInfo.testResult.platform}</div>
            )}
            {debugInfo.testResult.error && (
              <div className="text-red-600">오류: {debugInfo.testResult.error}</div>
            )}
          </div>
        </div>
      )}

      {/* 브라우저 정보 */}
      {debugInfo?.browserInfo && (
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold mb-2">브라우저 정보</h4>
          <div className="text-sm space-y-1">
            <div>플랫폼: {debugInfo.browserInfo.platform}</div>
            <div>브라우저: {debugInfo.browserInfo.vendor}</div>
            <div>CPU 코어: {debugInfo.browserInfo.hardwareConcurrency}</div>
            <div className="break-all">User Agent: {debugInfo.browserInfo.userAgent}</div>
          </div>
        </div>
      )}

      {/* WebGL 능력 */}
      {capabilities?.supported && (
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold mb-2">WebGL 능력</h4>
          <div className="text-sm space-y-1">
            <div>최대 텍스처 크기: {capabilities.maxTextureSize}px</div>
            <div>최대 버텍스 텍스처: {capabilities.maxVertexTextures}</div>
            <div>최대 프래그먼트 텍스처: {capabilities.maxFragmentTextures}</div>
            <div>확장 기능 수: {capabilities.extensions?.length || 0}개</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebGLDebugger;