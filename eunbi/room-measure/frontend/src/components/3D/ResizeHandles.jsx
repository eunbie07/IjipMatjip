import React, { useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import CollisionDetector from '../../utils/CollisionDetector';

export const ResizeHandles = ({ 
  position, 
  size, 
  rotation, 
  visible, 
  onResize,
  onResizeStart,
  onResizeEnd,
  // 충돌 감지를 위한 추가 props
  furniture = [],
  furniturePresets = {},
  roomSize = [400, 250, 400],
  furnitureId
}) => {
  const { camera, gl, raycaster } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState(null);
  const dragStartRef = useRef(null);
  const initialSizeRef = useRef(null);

  // 크기 조절 시 충돌 감지 함수
  const checkResizeCollisions = (furniturePosition, newSize, furnitureRotation) => {
    // 방 경계 체크
    const boundaryCheck = CollisionDetector.adjustToValidPosition(
      furniturePosition,
      newSize,
      roomSize,
      furniture,
      furnitureId,
      furniturePresets,
      furnitureRotation
    );
    
    // 만약 위치가 조정되었다면 크기가 방 경계를 벗어남 (허용 오차 5cm)
    const [originalX, originalY, originalZ] = furniturePosition;
    const [adjustedX, adjustedY, adjustedZ] = boundaryCheck;
    const tolerance = 5; // 5cm 허용 오차
    const positionChanged = Math.abs(originalX - adjustedX) > tolerance || 
                           Math.abs(originalZ - adjustedZ) > tolerance;
    
    if (positionChanged) {
      return false; // 방 경계를 벗어남
    }

    // 다른 가구와의 충돌 체크
    const furnitureCollisions = CollisionDetector.checkFurnitureCollisions(
      furniture.map(f => 
        f.id === furnitureId 
          ? { ...f, position: furniturePosition, size: newSize, rotation: furnitureRotation }
          : f
      ),
      furnitureId,
      furniturePosition,
      furniturePresets
    );

    return furnitureCollisions.length === 0;
  };

  if (!visible) return null;

  const [width, height, depth] = size;
  const [x, y, z] = position;

  // 핸들 위치 계산 (가구의 모서리)
  const handles = [
    // 가로 조절 핸들 (좌우) - X축
    { 
      id: 'width-left', 
      position: [x - width/2, y, z], 
      direction: 'width', 
      axis: [-1, 0, 0],
      color: '#ef4444', // 빨간색
      size: 8
    },
    { 
      id: 'width-right', 
      position: [x + width/2, y, z], 
      direction: 'width', 
      axis: [1, 0, 0],
      color: '#ef4444', // 빨간색
      size: 8
    },
    // 세로 조절 핸들 (앞뒤) - Z축
    { 
      id: 'depth-front', 
      position: [x, y, z + depth/2], 
      direction: 'depth', 
      axis: [0, 0, 1],
      color: '#3b82f6', // 파란색
      size: 8
    },
    { 
      id: 'depth-back', 
      position: [x, y, z - depth/2], 
      direction: 'depth', 
      axis: [0, 0, -1],
      color: '#3b82f6', // 파란색
      size: 8
    },
    // 높이 조절 핸들 (위쪽만) - Y축
    { 
      id: 'height-top', 
      position: [x, y + height/2, z], 
      direction: 'height', 
      axis: [0, 1, 0],
      color: '#10b981', // 초록색
      size: 10 // 위쪽 핸들만 사용
    }
  ];

  const handlePointerDown = (e, handle) => {
    e.stopPropagation();
    
    console.log('🎯 Resize handle clicked:', handle.direction, handle.id);
    console.log('🎯 Initial size:', size);
    
    const rect = gl.domElement.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    dragStartRef.current = { x: clientX, y: clientY };
    initialSizeRef.current = [...size];
    setIsDragging(true);
    setDragDirection(handle.direction);
    
    onResizeStart?.();
    // 방향에 따른 커서 설정
    if (handle.direction === 'width') {
      gl.domElement.style.cursor = 'ew-resize';
    } else if (handle.direction === 'depth') {
      gl.domElement.style.cursor = 'ns-resize';
    } else if (handle.direction === 'height') {
      gl.domElement.style.cursor = 'row-resize';
    }

    const handleMouseMove = (moveEvent) => {
      if (!dragStartRef.current) return;

      const deltaX = moveEvent.clientX - dragStartRef.current.x;
      const deltaY = moveEvent.clientY - dragStartRef.current.y;
      
      // 픽셀 이동을 3D 단위로 변환 (대략적인 변환)
      const scale = camera.position.distanceTo(new THREE.Vector3(...position)) / 500;
      const delta3DX = deltaX * scale;
      const delta3DZ = -deltaY * scale; // Y축 반전

      let newSize = [...initialSizeRef.current];
      
      if (handle.direction === 'width') {
        // 가로 크기 조절 (X축)
        const sizeChange = delta3DX * handle.axis[0];
        newSize[0] = Math.max(50, initialSizeRef.current[0] + sizeChange * 2); // 최소 50cm
      } else if (handle.direction === 'depth') {
        // 세로 크기 조절 (Z축)
        const sizeChange = delta3DZ * handle.axis[2];
        newSize[2] = Math.max(50, initialSizeRef.current[2] + sizeChange * 2); // 최소 50cm
      } else if (handle.direction === 'height') {
        // 높이 크기 조절 (Y축) - 위쪽으로만 늘어남, 아래쪽 고정
        const sizeChange = -deltaY * scale * handle.axis[1]; // Y축은 화면에서 반전
        newSize[1] = Math.max(30, initialSizeRef.current[1] + sizeChange); // 위쪽으로만 증가, 최소 30cm
      }

      console.log('🔄 Size change:', {
        direction: handle.direction,
        oldSize: initialSizeRef.current,
        newSize: newSize,
        deltaX: deltaX,
        deltaY: deltaY,
        delta3DX: delta3DX,
        delta3DZ: delta3DZ
      });

      // 크기 변경 전후 비교 로그
      const sizeChanged = newSize.some((val, idx) => Math.abs(val - initialSizeRef.current[idx]) > 1);
      console.log('🔄 Size comparison:', {
        original: initialSizeRef.current,
        new: newSize,
        changed: sizeChanged,
        onResizeExists: !!onResize
      });
      
      if (sizeChanged && onResize) {
        // 충돌 감지 활성화 (성능을 위해 더 큰 변화만 체크)
        const significantChange = newSize.some((val, idx) => Math.abs(val - initialSizeRef.current[idx]) > 5);
        
        if (significantChange) {
          const isValidSize = checkResizeCollisions(position, newSize, rotation);
          console.log('🔍 Collision check:', {
            newSize,
            valid: isValidSize,
            position: position
          });
          
          if (isValidSize) {
            console.log('✅ Calling onResize with:', newSize);
            onResize(newSize);
          } else {
            console.log('❌ Resize blocked by collision - trying smaller size');
            // 약간 작은 크기로 재시도
            const reducedSize = newSize.map((size, idx) => {
              const reduction = (size - initialSizeRef.current[idx]) * 0.8;
              return Math.max(idx === 1 ? 30 : 50, initialSizeRef.current[idx] + reduction);
            });
            
            const isReducedValid = checkResizeCollisions(position, reducedSize, rotation);
            if (isReducedValid) {
              console.log('✅ Using reduced size:', reducedSize);
              onResize(reducedSize);
            }
          }
        } else {
          // 작은 변화는 충돌 검사 없이 바로 적용
          console.log('✅ Small change, applying directly:', newSize);
          onResize(newSize);
        }
      } else if (!onResize) {
        console.log('❌ onResize callback is not defined!');
      } else if (!sizeChanged) {
        console.log('⚠️ Size change too small to trigger update');
      }
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      initialSizeRef.current = null;
      setIsDragging(false);
      setDragDirection(null);
      gl.domElement.style.cursor = 'auto';
      onResizeEnd?.();
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <group>
      {handles.map(handle => (
        <group key={handle.id} position={handle.position}>
          {/* 핸들 구체 */}
          <mesh
            onPointerDown={(e) => handlePointerDown(e, handle)}
            onPointerOver={(e) => {
              e.stopPropagation();
              if (!isDragging) {
                if (handle.direction === 'width') {
                  gl.domElement.style.cursor = 'ew-resize';
                } else if (handle.direction === 'depth') {
                  gl.domElement.style.cursor = 'ns-resize';
                } else if (handle.direction === 'height') {
                  gl.domElement.style.cursor = 'row-resize';
                }
              }
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              if (!isDragging) {
                gl.domElement.style.cursor = 'auto';
              }
            }}
          >
            <sphereGeometry args={[handle.size, 16, 16]} />
            <meshStandardMaterial 
              color={dragDirection === handle.direction ? '#fbbf24' : handle.color}
              transparent
              opacity={isDragging && dragDirection === handle.direction ? 1.0 : 0.8}
              roughness={0.3}
              metalness={0.7}
              emissive={dragDirection === handle.direction ? '#fbbf24' : handle.color}
              emissiveIntensity={dragDirection === handle.direction ? 0.3 : 0.1}
            />
          </mesh>

          {/* 방향 표시 화살표 */}
          <mesh 
            position={[handle.axis[0] * 15, handle.axis[1] * 15, handle.axis[2] * 15]}
            rotation={handle.direction === 'height' ? [0, 0, 0] : handle.axis[2] !== 0 ? [Math.PI/2, 0, 0] : [0, 0, Math.PI/2]}
          >
            <coneGeometry args={[3, 10, 8]} />
            <meshStandardMaterial 
              color={dragDirection === handle.direction ? '#fbbf24' : handle.color}
              transparent
              opacity={dragDirection === handle.direction ? 0.9 : 0.6}
              emissive={dragDirection === handle.direction ? '#fbbf24' : handle.color}
              emissiveIntensity={dragDirection === handle.direction ? 0.2 : 0.05}
            />
          </mesh>
          
          {/* 반대 방향 화살표 */}
          <mesh 
            position={[-handle.axis[0] * 15, -handle.axis[1] * 15, -handle.axis[2] * 15]}
            rotation={handle.direction === 'height' ? [Math.PI, 0, 0] : handle.axis[2] !== 0 ? [-Math.PI/2, 0, 0] : [0, 0, -Math.PI/2]}
          >
            <coneGeometry args={[3, 10, 8]} />
            <meshStandardMaterial 
              color={dragDirection === handle.direction ? '#fbbf24' : handle.color}
              transparent
              opacity={dragDirection === handle.direction ? 0.9 : 0.6}
              emissive={dragDirection === handle.direction ? '#fbbf24' : handle.color}
              emissiveIntensity={dragDirection === handle.direction ? 0.2 : 0.05}
            />
          </mesh>
        </group>
      ))}
      
      {/* 크기 조절 안내선 */}
      {isDragging && (
        <group>
          {/* 가로 안내선 (Width) */}
          {dragDirection === 'width' && (
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  array={new Float32Array([
                    x - width/2, y + height/2 + 20, z,
                    x + width/2, y + height/2 + 20, z
                  ])}
                  count={2}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#ef4444" linewidth={3} />
            </line>
          )}
          
          {/* 세로 안내선 (Depth) */}
          {dragDirection === 'depth' && (
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  array={new Float32Array([
                    x, y + height/2 + 20, z - depth/2,
                    x, y + height/2 + 20, z + depth/2
                  ])}
                  count={2}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#3b82f6" linewidth={3} />
            </line>
          )}
          
          {/* 높이 안내선 (Height) - 바닥에서 시작 */}
          {dragDirection === 'height' && (
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  array={new Float32Array([
                    x + width/2 + 20, y - height/2, z,  // 바닥에서 시작 (고정)
                    x + width/2 + 20, y + height/2, z   // 위쪽까지 (가변)
                  ])}
                  count={2}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#10b981" linewidth={3} />
            </line>
          )}
        </group>
      )}
    </group>
  );
};