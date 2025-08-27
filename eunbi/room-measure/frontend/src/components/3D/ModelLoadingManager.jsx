import React, { useState, useEffect, createContext, useContext } from 'react';
import { Html } from '@react-three/drei';
import { Loading3DProgress } from '../UI/Loading3D';

// 전역 로딩 상태 관리를 위한 Context
const LoadingContext = createContext();

export const useLoadingManager = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingManager must be used within LoadingProvider');
  }
  return context;
};

/**
 * 3D 모델 로딩 상태를 전역으로 관리하는 Provider
 */
export const LoadingProvider = ({ children }) => {
  const [loadingModels, setLoadingModels] = useState(new Map());
  const [totalProgress, setTotalProgress] = useState(100);

  // 새로운 모델 로딩 시작
  const startLoading = (modelId, modelPath) => {
    setLoadingModels(prev => new Map(prev.set(modelId, {
      path: modelPath,
      progress: 0,
      status: 'loading'
    })));
  };

  // 모델 로딩 진행률 업데이트
  const updateProgress = (modelId, progress) => {
    setLoadingModels(prev => {
      const newMap = new Map(prev);
      const model = newMap.get(modelId);
      if (model) {
        newMap.set(modelId, { ...model, progress });
      }
      return newMap;
    });
  };

  // 모델 로딩 완료
  const finishLoading = (modelId) => {
    setLoadingModels(prev => {
      const newMap = new Map(prev);
      newMap.delete(modelId);
      return newMap;
    });
  };

  // 모델 로딩 에러
  const errorLoading = (modelId, error) => {
    setLoadingModels(prev => {
      const newMap = new Map(prev);
      const model = newMap.get(modelId);
      if (model) {
        newMap.set(modelId, { ...model, status: 'error', error });
      }
      return newMap;
    });
  };

  // 전체 진행률 계산
  useEffect(() => {
    if (loadingModels.size === 0) {
      setTotalProgress(100);
      return;
    }

    const totalProgress = Array.from(loadingModels.values())
      .reduce((sum, model) => sum + model.progress, 0) / loadingModels.size;
    
    setTotalProgress(totalProgress);
  }, [loadingModels]);

  const value = {
    loadingModels,
    totalProgress,
    isLoading: loadingModels.size > 0,
    startLoading,
    updateProgress,
    finishLoading,
    errorLoading
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

/**
 * 3D 씬 전체의 로딩 상태를 표시하는 컴포넌트
 */
export const SceneLoadingIndicator = ({ position = [0, 3, 0], showWhenLoading = true }) => {
  const { isLoading, totalProgress, loadingModels } = useLoadingManager();

  if (!showWhenLoading || !isLoading) {
    return null;
  }

  const loadingList = Array.from(loadingModels.entries());

  return (
    <group position={position}>
      {/* 전체 진행률 바 */}
      <Loading3DProgress 
        progress={totalProgress} 
        position={[0, 0, 0]}
        showText={true}
      />
      
      {/* 현재 로딩 중인 모델들 목록 */}
      <Html
        position={[0, -1, 0]}
        center
        distanceFactor={10}
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '250px',
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            모델 로딩 중... ({loadingList.length}개)
          </div>
          {loadingList.slice(0, 3).map(([id, model]) => (
            <div key={id} style={{ fontSize: '10px', opacity: 0.8 }}>
              {model.path.split('/').pop()} - {Math.round(model.progress)}%
            </div>
          ))}
          {loadingList.length > 3 && (
            <div style={{ fontSize: '10px', opacity: 0.6 }}>
              +{loadingList.length - 3}개 더...
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};

/**
 * 개별 모델의 로딩 상태를 관리하는 훅
 */
export const useModelLoader = (modelId, modelPath) => {
  const { startLoading, updateProgress, finishLoading, errorLoading } = useLoadingManager();

  const handleLoadStart = () => {
    startLoading(modelId, modelPath);
  };

  const handleProgress = (progress) => {
    updateProgress(modelId, progress);
  };

  const handleLoadComplete = () => {
    finishLoading(modelId);
  };

  const handleError = (error) => {
    errorLoading(modelId, error);
  };

  return {
    onLoadStart: handleLoadStart,
    onProgress: handleProgress,
    onLoadComplete: handleLoadComplete,
    onError: handleError
  };
};

export default LoadingProvider;