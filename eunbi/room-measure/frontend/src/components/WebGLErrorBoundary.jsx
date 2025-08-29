import React from 'react';
import { isWebGLSupported, testWebGLContext } from '../utils/webglDetection';

/**
 * WebGL 에러 바운더리 컴포넌트
 * WebGL 관련 에러를 캐치하고 폴백 UI를 제공
 */
class WebGLErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      webglTest: null
    };
  }

  static getDerivedStateFromError(error) {
    // 에러가 발생하면 상태를 업데이트하여 폴백 UI를 렌더링
    return {
      hasError: true
    };
  }

  componentDidCatch(error, errorInfo) {
    // WebGL 컨텍스트 테스트 실행
    const webglTest = testWebGLContext();
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
      webglTest: webglTest
    });

    console.error('WebGL Error caught by boundary:', error, errorInfo);
    console.error('WebGL Test Result:', webglTest);
  }

  render() {
    if (this.state.hasError) {
      return <WebGLFallback 
        error={this.state.error}
        webglTest={this.state.webglTest}
        onRetry={() => this.setState({ hasError: false, error: null, errorInfo: null })}
      />;
    }

    return this.props.children;
  }
}

/**
 * WebGL 폴백 UI 컴포넌트
 */
const WebGLFallback = ({ error, webglTest, onRetry }) => {
  const webglSupported = isWebGLSupported();
  
  return (
    <div className="flex items-center justify-center min-h-[400px] bg-background border border-border rounded-lg">
      <div className="text-center p-8 max-w-lg">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            3D 뷰어 로딩 실패
          </h3>
          <p className="text-text-secondary mb-4">
            {!webglSupported 
              ? "3D 기능을 지원하지 않는 브라우저입니다."
              : "3D 그래픽 처리 중 오류가 발생했습니다."}
          </p>
        </div>

        {/* 에러 상세 정보 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-medium text-red-800 mb-2">기술적 정보</h4>
          <div className="text-sm text-red-700 space-y-1">
            <div>3D 기능 지원: {webglSupported ? '✅ 지원됨' : '❌ 지원안됨'}</div>
            {webglTest && (
              <>
                <div>고급 3D 기능: {webglTest.webgl2 ? '✅ 지원됨' : '❌ 지원안됨'}</div>
                {webglTest.renderer && <div>렌더러: {webglTest.renderer}</div>}
                {webglTest.error && <div>오류: {webglTest.error}</div>}
              </>
            )}
          </div>
        </div>

        {/* 해결방법 제안 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-medium text-blue-800 mb-2">해결방법</h4>
          <div className="text-sm text-blue-700 space-y-2">
            <div className="font-medium text-blue-800">🚀 가장 일반적인 해결방법 (Chrome):</div>
            <div className="bg-blue-100 p-3 rounded border-l-4 border-blue-400">
              <div className="font-medium mb-1">하드웨어 가속 활성화:</div>
              <div>1. Chrome 설정 → 고급 → 시스템</div>
              <div>2. "가능한 경우 하드웨어 가속 사용" 체크</div>
              <div>3. Chrome 재시작</div>
              <div className="text-xs mt-1">또는 <code className="bg-blue-200 px-1 rounded">chrome://settings/system</code>에서 직접 설정</div>
            </div>
            
            <div className="pt-2">기타 해결방법:</div>
            <ul className="space-y-1">
              <li>• 그래픽 카드 프로그램을 최신 버전으로 업데이트</li>
              <li>• <code className="bg-blue-200 px-1 rounded">chrome://flags/#ignore-gpu-blocklist</code>에서 GPU 블록리스트 무시 활성화</li>
              <li>• 다른 브라우저 (Firefox, Safari, Edge) 사용해보기</li>
              <li>• 시크릿/프라이빗 모드에서 실행해보기</li>
              {!webglSupported && <li>• 그래픽 카드가 3D 기능을 지원하는지 확인</li>}
            </ul>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            다시 시도
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            페이지 새로고침
          </button>
        </div>

        {/* 대안 제안 */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-text-secondary">
            3D 뷰어 대신 <strong>2D Floor Plan</strong> 탭을 사용하여 방 평면도를 확인하실 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebGLErrorBoundary;