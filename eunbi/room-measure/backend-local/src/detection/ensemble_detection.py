# ensemble_detection.py
# 다중 알고리즘 앙상블 방 감지 시스템

import cv2
import numpy as np
import logging
from typing import Dict, List, Tuple
from .improved_ai_detection import detect_room_corners_improved
from .corner_intersection_detection import detect_three_line_intersections

logger = logging.getLogger(__name__)

class EnsembleRoomDetector:
    """다중 알고리즘 앙상블 방 감지 시스템"""
    
    def __init__(self):
        self.algorithm_weights = {
            'improved_ai': 0.4,        # 기존 개선된 AI
            'canny_hough': 0.3,        # Canny + Hough Lines
            'harris_corner': 0.3       # Harris Corner Detection
        }
    
    def detect_room_ensemble(self, image_path: str, adaptive_params: Dict = None) -> Dict:
        """앙상블 방 감지 수행"""
        try:
            image = cv2.imread(image_path)
            if image is None:
                return {"success": False, "error": "이미지를 로드할 수 없습니다"}
            
            h, w = image.shape[:2]
            logger.info(f"앙상블 방 감지 시작 - 이미지 크기: {w}x{h}")
            
            results = []
            total_weight = 0
            
            # 1. 기존 개선된 AI 알고리즘
            try:
                improved_result = detect_room_corners_improved(image_path)
                if improved_result.get('success') and improved_result.get('confidence', 0) > 0.3:
                    results.append({
                        'method': 'improved_ai',
                        'result': improved_result,
                        'weight': self.algorithm_weights['improved_ai']
                    })
                    total_weight += self.algorithm_weights['improved_ai']
                    logger.info(f"Improved AI: 신뢰도 {improved_result.get('confidence', 0):.3f}")
                else:
                    logger.warning("Improved AI 감지 실패")
            except Exception as e:
                logger.warning(f"Improved AI 오류: {str(e)}")
            
            # 2. Canny + Hough Lines 알고리즘
            try:
                canny_result = self._canny_hough_detection(image, adaptive_params)
                if canny_result.get('success') and canny_result.get('confidence', 0) > 0.3:
                    results.append({
                        'method': 'canny_hough',
                        'result': canny_result,
                        'weight': self.algorithm_weights['canny_hough']
                    })
                    total_weight += self.algorithm_weights['canny_hough']
                    logger.info(f"Canny+Hough: 신뢰도 {canny_result.get('confidence', 0):.3f}")
                else:
                    logger.warning("Canny+Hough 감지 실패")
            except Exception as e:
                logger.warning(f"Canny+Hough 오류: {str(e)}")
            
            # 3. Harris Corner Detection
            try:
                harris_result = self._harris_corner_detection(image)
                if harris_result.get('success') and harris_result.get('confidence', 0) > 0.3:
                    results.append({
                        'method': 'harris_corner',
                        'result': harris_result,
                        'weight': self.algorithm_weights['harris_corner']
                    })
                    total_weight += self.algorithm_weights['harris_corner']
                    logger.info(f"Harris Corner: 신뢰도 {harris_result.get('confidence', 0):.3f}")
                else:
                    logger.warning("Harris Corner 감지 실패")
            except Exception as e:
                logger.warning(f"Harris Corner 오류: {str(e)}")
            
            # 결과 앙상블
            if not results:
                return {"success": False, "error": "모든 알고리즘이 실패했습니다", "confidence": 0.0}
            
            ensemble_result = self._combine_results(results, total_weight, w, h)
            logger.info(f"앙상블 최종 신뢰도: {ensemble_result.get('confidence', 0):.3f}")
            
            return ensemble_result
            
        except Exception as e:
            logger.error(f"앙상블 감지 실패: {str(e)}")
            return {"success": False, "error": str(e), "confidence": 0.0}
    
    def _canny_hough_detection(self, image: np.ndarray, adaptive_params: Dict = None) -> Dict:
        """Canny + Hough Lines 기반 방 감지"""
        try:
            h, w = image.shape[:2]
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
            
            # 적응적 파라미터 사용 또는 기본값
            if adaptive_params:
                canny_low = adaptive_params.get('canny_low', 50)
                canny_high = adaptive_params.get('canny_high', 150)
                hough_threshold = adaptive_params.get('hough_threshold', 50)
            else:
                canny_low, canny_high, hough_threshold = 50, 150, 50
            
            # Canny 엣지 감지
            edges = cv2.Canny(gray, canny_low, canny_high)
            
            # 형태학적 연산
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
            
            # Hough Lines
            lines = cv2.HoughLinesP(
                edges, 1, np.pi/180, hough_threshold,
                minLineLength=int(min(w, h) * 0.1),
                maxLineGap=int(min(w, h) * 0.02)
            )
            
            if lines is None or len(lines) < 4:
                return {"success": False, "error": "직선 부족", "confidence": 0.0}
            
            # 코너 추출
            corners = self._extract_corners_from_lines(lines, w, h)
            
            if len(corners) >= 4:
                confidence = self._calculate_canny_confidence(lines, corners, w, h)
                return {
                    "success": True,
                    "corners": corners[:4],
                    "confidence": confidence,
                    "method": "canny_hough",
                    "lines_found": len(lines)
                }
            else:
                return {"success": False, "error": "코너 부족", "confidence": 0.0}
                
        except Exception as e:
            return {"success": False, "error": str(e), "confidence": 0.0}
    
    def _harris_corner_detection(self, image: np.ndarray) -> Dict:
        """Harris Corner Detection 기반 방 감지"""
        try:
            h, w = image.shape[:2]
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
            
            # Harris Corner Detection
            harris = cv2.cornerHarris(gray, 2, 3, 0.04)
            harris = cv2.dilate(harris, None)
            
            # 임계값 이상의 코너들 찾기
            threshold = 0.01 * harris.max()
            corner_coords = np.where(harris > threshold)
            
            if len(corner_coords[0]) < 4:
                return {"success": False, "error": "Harris 코너 부족", "confidence": 0.0}
            
            # 좌표를 (x, y) 형태로 변환
            corners = []
            for i in range(min(len(corner_coords[0]), 50)):  # 최대 50개까지만
                y, x = corner_coords[0][i], corner_coords[1][i]
                corners.append({'x': int(x), 'y': int(y), 'strength': float(harris[y, x])})
            
            # 강도순으로 정렬
            corners.sort(key=lambda c: c['strength'], reverse=True)
            
            # 방 모서리 후보 선택
            room_corners = self._select_room_corners_harris(corners, w, h)
            
            if len(room_corners) >= 4:
                confidence = self._calculate_harris_confidence(room_corners, harris, w, h)
                return {
                    "success": True,
                    "corners": room_corners[:4],
                    "confidence": confidence,
                    "method": "harris_corner",
                    "total_corners_found": len(corners)
                }
            else:
                return {"success": False, "error": "적절한 방 코너 부족", "confidence": 0.0}
                
        except Exception as e:
            return {"success": False, "error": str(e), "confidence": 0.0}
    
    def _extract_corners_from_lines(self, lines: np.ndarray, w: int, h: int) -> List[Dict]:
        """직선들로부터 교차점(코너) 추출"""
        corners = []
        
        for i, line1 in enumerate(lines):
            for j, line2 in enumerate(lines[i+1:], i+1):
                x1, y1, x2, y2 = line1[0]
                x3, y3, x4, y4 = line2[0]
                
                # 교차점 계산
                intersection = self._line_intersection((x1, y1, x2, y2), (x3, y3, x4, y4))
                
                if intersection and 0 <= intersection[0] < w and 0 <= intersection[1] < h:
                    corners.append({
                        'x': int(intersection[0]),
                        'y': int(intersection[1]),
                        'strength': 1.0
                    })
        
        # 중복 제거 (가까운 점들 합치기)
        return self._remove_duplicate_corners(corners, threshold=20)
    
    def _line_intersection(self, line1: Tuple, line2: Tuple) -> Tuple:
        """두 직선의 교차점 계산"""
        x1, y1, x2, y2 = line1
        x3, y3, x4, y4 = line2
        
        denom = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4)
        if abs(denom) < 1e-10:  # 평행선
            return None
            
        t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / denom
        
        intersection_x = x1 + t*(x2-x1)
        intersection_y = y1 + t*(y2-y1)
        
        return (intersection_x, intersection_y)
    
    def _remove_duplicate_corners(self, corners: List[Dict], threshold: int = 20) -> List[Dict]:
        """중복된 코너 제거"""
        if not corners:
            return corners
            
        unique_corners = []
        
        for corner in corners:
            is_duplicate = False
            for unique_corner in unique_corners:
                distance = np.sqrt((corner['x'] - unique_corner['x'])**2 + 
                                 (corner['y'] - unique_corner['y'])**2)
                if distance < threshold:
                    # 더 강한 코너로 대체
                    if corner['strength'] > unique_corner['strength']:
                        unique_corners.remove(unique_corner)
                        unique_corners.append(corner)
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_corners.append(corner)
        
        return unique_corners
    
    def _select_room_corners_harris(self, corners: List[Dict], w: int, h: int) -> List[Dict]:
        """Harris 코너들 중 방 모서리 선택"""
        if len(corners) < 4:
            return corners
        
        # 이미지 경계 근처의 코너들을 우선 선택
        boundary_corners = []
        center_corners = []
        
        boundary_threshold = min(w, h) * 0.2
        
        for corner in corners:
            x, y = corner['x'], corner['y']
            near_boundary = (x < boundary_threshold or x > w - boundary_threshold or
                           y < boundary_threshold or y > h - boundary_threshold)
            
            if near_boundary:
                boundary_corners.append(corner)
            else:
                center_corners.append(corner)
        
        # 경계 근처 코너를 우선하되, 부족하면 중앙 코너도 포함
        selected = boundary_corners[:4]
        if len(selected) < 4:
            selected.extend(center_corners[:4-len(selected)])
        
        return selected
    
    def _calculate_canny_confidence(self, lines: np.ndarray, corners: List[Dict], w: int, h: int) -> float:
        """Canny+Hough 결과 신뢰도 계산"""
        confidence = 0.5  # 기본 점수
        
        # 1. 직선 개수 보너스
        line_bonus = min(len(lines) / 20, 0.2)
        confidence += line_bonus
        
        # 2. 코너 분포 보너스
        if len(corners) >= 4:
            distribution_score = self._calculate_corner_distribution(corners, w, h)
            confidence += distribution_score * 0.2
        
        # 3. 방 형태 적합성
        if len(corners) >= 4:
            geometry_score = self._calculate_geometry_score(corners[:4])
            confidence += geometry_score * 0.1
        
        return min(confidence, 0.95)
    
    def _calculate_harris_confidence(self, corners: List[Dict], harris_response: np.ndarray, w: int, h: int) -> float:
        """Harris Corner 결과 신뢰도 계산"""
        if not corners:
            return 0.0
            
        confidence = 0.4  # 기본 점수
        
        # 1. 코너 강도 평균
        avg_strength = np.mean([c['strength'] for c in corners[:4]])
        strength_score = min(avg_strength / harris_response.max(), 0.3)
        confidence += strength_score
        
        # 2. 코너 분포
        distribution_score = self._calculate_corner_distribution(corners[:4], w, h)
        confidence += distribution_score * 0.2
        
        # 3. 기하학적 일관성
        geometry_score = self._calculate_geometry_score(corners[:4])
        confidence += geometry_score * 0.1
        
        return min(confidence, 0.9)
    
    def _calculate_corner_distribution(self, corners: List[Dict], w: int, h: int) -> float:
        """코너 분포의 균등성 계산"""
        if len(corners) < 4:
            return 0.0
        
        x_coords = [c['x'] for c in corners[:4]]
        y_coords = [c['y'] for c in corners[:4]]
        
        x_spread = (max(x_coords) - min(x_coords)) / w
        y_spread = (max(y_coords) - min(y_coords)) / h
        
        return min(x_spread * y_spread * 4, 1.0)
    
    def _calculate_geometry_score(self, corners: List[Dict]) -> float:
        """기하학적 일관성 점수 계산"""
        if len(corners) < 4:
            return 0.0
        
        # 간단한 직사각형 형태 점수
        # 실제로는 더 복잡한 기하학적 분석이 필요
        return 0.5
    
    def _combine_results(self, results: List[Dict], total_weight: float, w: int, h: int) -> Dict:
        """다중 알고리즘 결과 결합"""
        if not results:
            return {"success": False, "error": "결합할 결과 없음", "confidence": 0.0}
        
        # 가중평균으로 신뢰도 계산
        weighted_confidence = sum(
            r['result']['confidence'] * r['weight'] for r in results
        ) / total_weight
        
        # 최고 신뢰도 결과를 기본으로 사용
        best_result = max(results, key=lambda r: r['result']['confidence'])
        
        # 앙상블 보너스 추가 (여러 알고리즘이 동의할 때)
        ensemble_bonus = len(results) * 0.05  # 알고리즘 수에 비례한 보너스
        final_confidence = min(weighted_confidence + ensemble_bonus, 0.95)
        
        return {
            "success": True,
            "corners": best_result['result']['corners'],
            "confidence": final_confidence,
            "method": "ensemble",
            "ensemble_info": {
                "algorithms_used": [r['method'] for r in results],
                "individual_confidences": {r['method']: r['result']['confidence'] for r in results},
                "weighted_confidence": weighted_confidence,
                "ensemble_bonus": ensemble_bonus
            }
        }

# 전역 인스턴스
ensemble_detector = EnsembleRoomDetector()