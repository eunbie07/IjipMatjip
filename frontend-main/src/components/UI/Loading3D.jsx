import React from 'react';
import { Box, Plane, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

/**
 * 3D 공간에서 사용할 로딩 스켈레톤 컴포넌트
 */
const Loading3DSkeleton = ({ size = [1, 1, 1], position = [0, 0, 0] }) => {
  return (
    <group position={position}>
      <Box args={size}>
        <meshBasicMaterial 
          color="#e0e0e0" 
          opacity={0.6} 
          transparent 
        />
      </Box>
      
      {/* 로딩 애니메이션 효과 */}
      <Box args={[size[0] * 0.8, size[1] * 0.8, size[2] * 0.8]} position={[0, 0, 0]}>
        <meshBasicMaterial 
          color="#f0f0f0" 
          opacity={0.8} 
          transparent
        />
      </Box>
    </group>
  );
};

/**
 * 3D 모델 로딩 진행률 표시 컴포넌트
 */
const Loading3DProgress = ({ progress = 0, position = [0, 2, 0], showText = true }) => {
  return (
    <group position={position}>
      {/* 배경 바 */}
      <Plane args={[2, 0.2]}>
        <meshBasicMaterial color="#e0e0e0" transparent opacity={0.8} />
      </Plane>
      
      {/* 진행률 바 */}
      <Plane args={[2 * (progress / 100), 0.2]} position={[-1 + (progress / 100), 0, 0.01]}>
        <meshBasicMaterial color="#007bff" transparent opacity={0.9} />
      </Plane>
      
      {/* HTML 텍스트로 진행률 표시 */}
      {showText && (
        <Html
          position={[0, -0.5, 0]}
          center
          distanceFactor={10}
          style={{
            color: '#333',
            fontSize: '12px',
            fontWeight: 'bold',
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          {Math.round(progress)}%
        </Html>
      )}
    </group>
  );
};

/**
 * 3D 스피너 컴포넌트
 */
const Loading3DSpinner = ({ position = [0, 1, 0], size = 0.5 }) => {
  const meshRef = React.useRef();
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.05;
    }
  });

  return (
    <group position={position} ref={meshRef}>
      <Box args={[size, size * 0.1, size * 0.1]}>
        <meshBasicMaterial color="#007bff" />
      </Box>
      <Box args={[size * 0.1, size, size * 0.1]}>
        <meshBasicMaterial color="#007bff" />
      </Box>
    </group>
  );
};

/**
 * 가구 로딩 플레이스홀더 (가구 모양 스켈레톤)
 */
const FurnitureLoadingPlaceholder = ({ furnitureType, size = [1, 1, 1], position = [0, 0, 0] }) => {
  const getPlaceholderShape = () => {
    switch (furnitureType) {
      case 'bed':
        return (
          <group>
            {/* 침대 매트리스 */}
            <Box args={[size[0], size[1] * 0.3, size[2]]} position={[0, size[1] * 0.15, 0]}>
              <meshBasicMaterial color="#e8e8e8" opacity={0.7} transparent />
            </Box>
            {/* 침대 헤드보드 */}
            <Box args={[size[0], size[1] * 0.8, size[2] * 0.2]} position={[0, size[1] * 0.5, -size[2] * 0.4]}>
              <meshBasicMaterial color="#d8d8d8" opacity={0.7} transparent />
            </Box>
          </group>
        );
      
      case 'chair':
        return (
          <group>
            <Box args={[size[0], size[1] * 0.1, size[2]]} position={[0, size[1] * 0.3, 0]}>
              <meshBasicMaterial color="#e8e8e8" opacity={0.7} transparent />
            </Box>
            <Box args={[size[0] * 0.1, size[1] * 0.8, size[2] * 0.1]} position={[0, size[1] * 0.7, -size[2] * 0.4]}>
              <meshBasicMaterial color="#d8d8d8" opacity={0.7} transparent />
            </Box>
          </group>
        );
      
      case 'desk':
      case 'table':
        return (
          <group>
            <Box args={[size[0], size[1] * 0.1, size[2]]} position={[0, size[1] * 0.8, 0]}>
              <meshBasicMaterial color="#e8e8e8" opacity={0.7} transparent />
            </Box>
            <Box args={[size[0] * 0.1, size[1] * 0.7, size[2] * 0.1]} position={[-size[0] * 0.4, size[1] * 0.4, -size[2] * 0.4]}>
              <meshBasicMaterial color="#d8d8d8" opacity={0.7} transparent />
            </Box>
            <Box args={[size[0] * 0.1, size[1] * 0.7, size[2] * 0.1]} position={[size[0] * 0.4, size[1] * 0.4, -size[2] * 0.4]}>
              <meshBasicMaterial color="#d8d8d8" opacity={0.7} transparent />
            </Box>
          </group>
        );
      
      case 'sofa':
        return (
          <group>
            <Box args={[size[0], size[1] * 0.4, size[2]]} position={[0, size[1] * 0.2, 0]}>
              <meshBasicMaterial color="#e8e8e8" opacity={0.7} transparent />
            </Box>
            <Box args={[size[0], size[1] * 0.5, size[2] * 0.2]} position={[0, size[1] * 0.5, -size[2] * 0.4]}>
              <meshBasicMaterial color="#d8d8d8" opacity={0.7} transparent />
            </Box>
          </group>
        );
      
      default:
        return (
          <Box args={size}>
            <meshBasicMaterial color="#e8e8e8" opacity={0.7} transparent />
          </Box>
        );
    }
  };

  return (
    <group position={position}>
      {getPlaceholderShape()}
      
      {/* 펄스 애니메이션 효과 */}
      <Box args={[size[0] * 1.05, size[1] * 1.05, size[2] * 1.05]}>
        <meshBasicMaterial 
          color="#007bff" 
          opacity={0.1} 
          transparent
        />
      </Box>
    </group>
  );
};

export {
  Loading3DSkeleton,
  Loading3DProgress,
  Loading3DSpinner,
  FurnitureLoadingPlaceholder
};

export default Loading3DSkeleton;