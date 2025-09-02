"""
단순하고 효과적인 광각 왜곡 보정 시스템
복잡한 카메라 프로파일 대신 이미지 분석 기반 적응적 보정
"""

import cv2
import numpy as np
import logging
from typing import Tuple, Dict, Any

logger = logging.getLogger(__name__)

class SimpleDistortionCorrector:
    """단순하고 효과적인 왜곡 보정기"""
    
    def __init__(self):
        # 기본 보정 강도 레벨
        self.correction_levels = {
            "minimal": {
                "k1": 0.05, "k2": -0.1, "strength": 0.1, "edge_factor": 1.05
            },
            "moderate": {
                "k1": 0.1, "k2": -0.2, "strength": 0.2, "edge_factor": 1.1
            },
            "strong": {
                "k1": 0.15, "k2": -0.3, "strength": 0.3, "edge_factor": 1.2
            },
            "ultra": {
                "k1": 0.2, "k2": -0.4, "strength": 0.4, "edge_factor": 1.3
            }
        }
    
    def analyze_distortion_level(self, image: np.ndarray) -> str:
        """이미지 분석으로 왜곡 정도 자동 감지"""
        try:
            h, w = image.shape[:2]
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # 1. 가장자리 곡선 검출
            edge_curvature = self._detect_edge_curvature(gray)
            
            # 2. 중심부와 가장자리 밝기 차이 (비네팅 효과)
            vignetting_ratio = self._measure_vignetting(gray)
            
            # 3. 화면 종횡비 분석
            aspect_ratio = w / h
            
            # 종합 점수 계산 (0.0 ~ 1.0)
            distortion_score = (
                edge_curvature * 0.5 +      # 가장자리 곡선 (50%)
                vignetting_ratio * 0.3 +    # 비네팅 효과 (30%)
                self._aspect_score(aspect_ratio) * 0.2  # 종횡비 (20%)
            )
            
            logger.info(f"왜곡 분석: 곡선={edge_curvature:.3f}, 비네팅={vignetting_ratio:.3f}, 종합점수={distortion_score:.3f}")
            
            # 보정 레벨 결정
            if distortion_score < 0.2:
                return "minimal"
            elif distortion_score < 0.4:
                return "moderate"
            elif distortion_score < 0.7:
                return "strong"
            else:
                return "ultra"
                
        except Exception as e:
            logger.warning(f"왜곡 분석 실패: {e}, 기본 보정 적용")
            return "moderate"
    
    def _detect_edge_curvature(self, gray: np.ndarray) -> float:
        """가장자리 곡선 정도 감지"""
        h, w = gray.shape
        
        # 엣지 검출
        edges = cv2.Canny(gray, 50, 150)
        
        # 가장자리 영역만 분석 (테두리 1/6 영역)
        margin = min(w, h) // 6
        edge_regions = [
            edges[margin:h-margin, :margin],           # 좌측
            edges[margin:h-margin, w-margin:],         # 우측
            edges[:margin, margin:w-margin],           # 상단
            edges[h-margin:, margin:w-margin]          # 하단
        ]
        
        total_curvature = 0
        for region in edge_regions:
            if region.size > 0:
                # 직선 검출
                lines = cv2.HoughLinesP(region, 1, np.pi/180, threshold=20, 
                                       minLineLength=30, maxLineGap=10)
                
                if lines is not None and len(lines) > 0:
                    # 직선들의 굽음 정도 계산
                    curvature = self._calculate_line_deviation(lines, region.shape)
                    total_curvature += curvature
        
        return min(total_curvature / 4, 1.0)  # 0~1 범위로 정규화
    
    def _calculate_line_deviation(self, lines: np.ndarray, shape: Tuple[int, int]) -> float:
        """직선들의 평균 굽음 정도 계산"""
        if lines is None or len(lines) == 0:
            return 0.0
        
        deviations = []
        for line in lines:
            x1, y1, x2, y2 = line[0]
            
            # 직선의 길이
            length = np.sqrt((x2-x1)**2 + (y2-y1)**2)
            if length < 20:  # 너무 짧은 선분은 무시
                continue
                
            # 이상적인 직선과의 편차
            angle = abs(np.arctan2(y2-y1, x2-x1))
            # 0도, 90도에서 멀어질수록 곡선 가능성 증가
            deviation = min(angle, np.pi/2 - angle) / (np.pi/4)
            deviations.append(deviation)
        
        return np.mean(deviations) if deviations else 0.0
    
    def _measure_vignetting(self, gray: np.ndarray) -> float:
        """비네팅 효과 측정 (광각 렌즈 특성)"""
        h, w = gray.shape
        center_x, center_y = w//2, h//2
        
        # 중심부 영역 (1/4 크기)
        center_region = gray[center_y-h//8:center_y+h//8, center_x-w//8:center_x+w//8]
        center_brightness = np.mean(center_region) if center_region.size > 0 else 128
        
        # 코너 영역들
        corner_size = min(w, h) // 8
        corners = [
            gray[:corner_size, :corner_size],                    # 좌상
            gray[:corner_size, -corner_size:],                   # 우상
            gray[-corner_size:, :corner_size],                   # 좌하
            gray[-corner_size:, -corner_size:]                   # 우하
        ]
        
        corner_brightness = np.mean([np.mean(corner) for corner in corners if corner.size > 0])
        
        # 비네팅 비율 (중심이 밝을수록, 코너가 어두울수록 높음)
        if center_brightness > 0:
            vignetting = max(0, (center_brightness - corner_brightness) / center_brightness)
            return min(vignetting * 2, 1.0)  # 증폭 후 정규화
        
        return 0.0
    
    def _aspect_score(self, aspect_ratio: float) -> float:
        """종횡비 기반 광각 가능성"""
        # 광각은 보통 더 넓은 화각을 가짐 (16:9, 18:9 등)
        if aspect_ratio > 1.6:  # 와이드 화면
            return 0.3
        elif aspect_ratio > 1.4:  # 표준보다 약간 넓음
            return 0.2
        else:
            return 0.1
    
    def correct_distortion(self, image: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
        """적응적 왜곡 보정 수행"""
        try:
            # 왜곡 정도 자동 분석
            correction_level = self.analyze_distortion_level(image)
            level_params = self.correction_levels[correction_level]
            
            h, w = image.shape[:2]
            
            # 동적 카메라 매트릭스 생성
            # 왜곡이 클수록 초점거리를 더 짧게 설정
            focal_factor = 1.0 - (["minimal", "moderate", "strong", "ultra"].index(correction_level) * 0.1)
            focal_length = min(w, h) * focal_factor
            
            camera_matrix = np.array([
                [focal_length, 0, w/2],
                [0, focal_length, h/2], 
                [0, 0, 1]
            ], dtype=np.float32)
            
            # 동적 왜곡 계수
            dist_coeffs = np.array([
                level_params["k1"],
                level_params["k2"], 
                0, 0, 0
            ], dtype=np.float32)
            
            # 1단계: OpenCV 표준 보정
            undistorted = cv2.undistort(image, camera_matrix, dist_coeffs)
            
            # 2단계: 추가 광각 보정 (강한 왜곡일 때만)
            if correction_level in ["strong", "ultra"]:
                undistorted = self._apply_additional_correction(
                    undistorted, 
                    level_params["strength"],
                    level_params["edge_factor"]
                )
            
            # 보정 정보
            correction_info = {
                "correction_level": correction_level,
                "focal_factor": focal_factor,
                "distortion_strength": level_params["strength"],
                "edge_correction": level_params["edge_factor"],
                "additional_correction_applied": correction_level in ["strong", "ultra"]
            }
            
            logger.info(f"광각 보정 완료: {correction_level} 레벨 적용")
            return undistorted, correction_info
            
        except Exception as e:
            logger.error(f"광각 보정 실패: {e}")
            # 실패시 최소한의 기본 보정
            return self._apply_basic_correction(image), {"error": str(e), "fallback": True}
    
    def _apply_additional_correction(self, image: np.ndarray, strength: float, edge_factor: float) -> np.ndarray:
        """추가 광각 보정 (강한 왜곡용)"""
        h, w = image.shape[:2]
        
        # 중심 기준 방사형 보정
        center_x, center_y = w/2, h/2
        max_radius = min(center_x, center_y) * 0.9
        
        # 맵핑 배열
        map_x = np.zeros((h, w), dtype=np.float32)
        map_y = np.zeros((h, w), dtype=np.float32)
        
        for y in range(h):
            for x in range(w):
                dx = x - center_x
                dy = y - center_y
                distance = np.sqrt(dx*dx + dy*dy)
                
                if distance < max_radius and distance > 0:
                    # 거리 비율
                    r = distance / max_radius
                    
                    # 가장자리로 갈수록 강한 보정
                    correction = 1.0 + (r**2) * strength * edge_factor
                    
                    new_distance = distance / correction
                    ratio = new_distance / distance
                    
                    map_x[y, x] = center_x + dx * ratio
                    map_y[y, x] = center_y + dy * ratio
                else:
                    map_x[y, x] = x
                    map_y[y, x] = y
        
        # 경계값 클리핑
        map_x = np.clip(map_x, 0, w-1)
        map_y = np.clip(map_y, 0, h-1)
        
        return cv2.remap(image, map_x, map_y, cv2.INTER_LINEAR)
    
    def _apply_basic_correction(self, image: np.ndarray) -> np.ndarray:
        """기본 보정 (실패시 폴백)"""
        h, w = image.shape[:2]
        camera_matrix = np.array([[w*0.8, 0, w/2], [0, w*0.8, h/2], [0, 0, 1]], dtype=np.float32)
        dist_coeffs = np.array([0.1, -0.2, 0, 0, 0], dtype=np.float32)
        return cv2.undistort(image, camera_matrix, dist_coeffs)

# 전역 인스턴스
simple_corrector = SimpleDistortionCorrector()

def apply_simple_correction(image: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
    """단순 적응적 광각 보정 적용"""
    return simple_corrector.correct_distortion(image)

def get_measurement_correction_factor(correction_info: Dict[str, Any]) -> float:
    """측정값 보정 계수 계산 (원근법 보정과 연계)"""
    """
    광각 왜곡이 클수록 실제 크기가 더 크게 보이므로 
    측정값을 더 많이 축소해야 함
    """
    correction_level = correction_info.get('correction_level', 'moderate')
    
    # 왜곡 레벨별 측정 보정 계수
    correction_factors = {
        'minimal': 1.0,    # 왜곡 거의 없음 - 보정 불필요
        'moderate': 0.95,  # 일반 왜곡 - 5% 축소
        'strong': 0.90,    # 광각 왜곡 - 10% 축소  
        'ultra': 0.85      # 초광각 왜곡 - 15% 축소
    }
    
    base_factor = correction_factors.get(correction_level, 0.95)
    
    # 추가 보정이 적용된 경우 더 강한 축소
    if correction_info.get('additional_correction_applied', False):
        base_factor *= 0.95  # 추가 5% 축소
        
    return base_factor