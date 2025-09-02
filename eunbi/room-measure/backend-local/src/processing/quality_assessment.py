# quality_assessment.py - 하이브리드 품질 평가 시스템

import logging
import numpy as np
from typing import Dict, Any, Tuple

logger = logging.getLogger(__name__)

def calculate_hybrid_quality_score(
    measurement_result: Dict[str, Any],
    depth_method: str = "unknown",
    correction_level: str = "none"
) -> Dict[str, Any]:
    """하이브리드 깊이 추정 기반 품질 평가"""
    
    try:
        # 기본 점수
        base_score = 60
        
        # 1. 깊이 추정 방법별 가중치 (25점)
        method_score = calculate_method_quality_score(depth_method)
        
        # 2. 측정값의 물리적 타당성 (30점)
        validity_score = calculate_measurement_validity_score(measurement_result)
        
        # 3. 일관성 및 안정성 (25점)
        consistency_score = calculate_consistency_score(measurement_result)
        
        # 4. 왜곡 보정 품질 (10점)
        correction_score = calculate_correction_quality_score(correction_level)
        
        # 5. 추가 보너스 (10점)
        bonus_score = calculate_bonus_score(measurement_result, depth_method)
        
        # 총 점수 계산
        total_score = min(100, base_score + method_score + validity_score + 
                         consistency_score + correction_score + bonus_score)
        
        # 등급 결정
        grade, color, reliability = determine_quality_grade(total_score)
        
        logger.info(f"품질 점수 계산: {total_score}점 ({grade})")
        logger.info(f"  방법: {method_score}점, 타당성: {validity_score}점, 일관성: {consistency_score}점")
        logger.info(f"  보정: {correction_score}점, 보너스: {bonus_score}점")
        
        return {
            "quality_score": total_score,
            "grade": grade,
            "color": color,
            "reliability": reliability,
            "breakdown": {
                "method_quality": method_score,
                "validity": validity_score,
                "consistency": consistency_score,
                "correction_bonus": correction_score,
                "bonus": bonus_score
            },
            "basis": f"하이브리드 {depth_method} 방식 품질 평가",
            "validation": validate_quality_assessment(measurement_result, total_score),
            "suggestions": generate_improvement_suggestions(
                measurement_result, total_score, depth_method
            )
        }
        
    except Exception as e:
        logger.error(f"품질 점수 계산 실패: {e}")
        return get_default_quality_score()

def calculate_method_quality_score(method: str) -> int:
    """깊이 추정 방법별 품질 점수 (25점 만점)"""
    
    method_scores = {
        "hybrid_opencv_midas": 25,      # OpenCV + MiDaS 하이브리드 (최고)
        "opencv_only": 20,              # OpenCV 단독 (안정적)
        "midas_only": 15,               # MiDaS 단독 (불안정할 수 있음)
        "opencv_fallback": 18,          # 향상된 OpenCV 폴백
        "opencv_primary": 22,           # OpenCV 기본 (개선됨)
        "computer_vision_detection": 16, # 기본 CV
        "simple_stable_v2": 14,         # 간단한 안정 방식
        "unknown": 10                   # 알 수 없음
    }
    
    score = method_scores.get(method, 10)
    logger.debug(f"방법별 점수: {method} = {score}점")
    return score

def calculate_measurement_validity_score(result: Dict[str, Any]) -> int:
    """측정값의 물리적 타당성 점수 (30점 만점)"""
    
    dimensions = result.get("dimensions", {})
    width_m = dimensions.get("width_m", 0)
    depth_m = dimensions.get("depth_m", 0) 
    height_m = dimensions.get("height_m", 0)
    area_sqm = result.get("calculated_values", {}).get("area_sqm", 0)
    
    score = 0
    
    # 1. 개별 치수 타당성 (15점)
    if 1.5 <= width_m <= 6.0:  # 일반적인 방 너비
        score += 5
    elif 1.0 <= width_m <= 8.0:
        score += 3
    
    if 1.5 <= depth_m <= 6.0:  # 일반적인 방 깊이
        score += 5
    elif 1.0 <= depth_m <= 8.0:
        score += 3
        
    if 2.0 <= height_m <= 3.5:  # 일반적인 천장 높이
        score += 5
    elif 1.8 <= height_m <= 4.0:
        score += 3
    
    # 2. 면적 타당성 (10점)
    if 4 <= area_sqm <= 25:     # 일반 방 면적
        score += 10
    elif 2 <= area_sqm <= 40:   # 허용 범위
        score += 6
    elif area_sqm <= 50:        # 큰 방
        score += 4
    
    # 3. 비율 일관성 (5점)
    if width_m > 0 and depth_m > 0:
        ratio = max(width_m, depth_m) / min(width_m, depth_m)
        if ratio <= 2.0:  # 합리적인 비율
            score += 5
        elif ratio <= 3.0:
            score += 3
        elif ratio <= 4.0:
            score += 1
    
    logger.debug(f"타당성 점수: {score}/30점 (크기: {width_m:.1f}x{depth_m:.1f}x{height_m:.1f}m)")
    return min(score, 30)

def calculate_consistency_score(result: Dict[str, Any]) -> int:
    """일관성 및 안정성 점수 (25점 만점)"""
    
    score = 0
    
    # 1. 픽셀-미터 변환 일관성 (10점)
    pixels_per_meter = result.get("calculated_values", {}).get("pixels_per_meter", 0)
    if 15 <= pixels_per_meter <= 40:  # 일반적인 범위
        score += 10
    elif 10 <= pixels_per_meter <= 50:
        score += 6
    elif pixels_per_meter > 0:
        score += 3
    
    # 2. 측정점 간격 일관성 (10점)
    pixel_distances = result.get("pixel_distances", {})
    height_px = pixel_distances.get("height_pixels", 0)
    width_px = pixel_distances.get("width_pixels", 0)
    depth_px = pixel_distances.get("depth_pixels", 0)
    
    if height_px > 0 and width_px > 0 and depth_px > 0:
        distances = [height_px, width_px, depth_px]
        if max(distances) / min(distances) <= 5:  # 합리적인 비율
            score += 10
        elif max(distances) / min(distances) <= 10:
            score += 6
        else:
            score += 3
    
    # 3. 신뢰도 일관성 (5점)
    confidence = result.get("confidence", 0)
    if confidence >= 0.9:
        score += 5
    elif confidence >= 0.7:
        score += 3
    elif confidence >= 0.5:
        score += 1
    
    logger.debug(f"일관성 점수: {score}/25점")
    return min(score, 25)

def calculate_correction_quality_score(correction_level: str) -> int:
    """왜곡 보정 품질 점수 (10점 만점)"""
    
    correction_scores = {
        "strong": 10,    # 강한 보정 적용
        "moderate": 8,   # 보통 보정 적용
        "minimal": 6,    # 최소 보정 적용
        "none": 3        # 보정 없음
    }
    
    score = correction_scores.get(correction_level, 3)
    logger.debug(f"보정 점수: {correction_level} = {score}점")
    return score

def calculate_bonus_score(result: Dict[str, Any], method: str) -> int:
    """추가 보너스 점수 (10점 만점)"""
    
    bonus = 0
    
    # 1. 하이브리드 방식 보너스 (3점)
    if "hybrid" in method:
        bonus += 3
    elif "opencv" in method and "primary" in method:
        bonus += 2
    
    # 2. 안정성 보너스 (3점)
    confidence = result.get("confidence", 0)
    if confidence >= 0.95:
        bonus += 3
    elif confidence >= 0.8:
        bonus += 2
    elif confidence >= 0.7:
        bonus += 1
    
    # 3. 현실성 보너스 (2점)
    area_sqm = result.get("calculated_values", {}).get("area_sqm", 0)
    if 8 <= area_sqm <= 20:  # 가장 일반적인 방 크기
        bonus += 2
    elif 6 <= area_sqm <= 30:
        bonus += 1
    
    # 4. 정밀도 보너스 (2점)
    pixel_distances = result.get("pixel_distances", {})
    if all(px > 20 for px in pixel_distances.values()):  # 충분한 픽셀 거리
        bonus += 2
    elif all(px > 10 for px in pixel_distances.values()):
        bonus += 1
    
    logger.debug(f"보너스 점수: {bonus}/10점")
    return min(bonus, 10)

def determine_quality_grade(score: int) -> Tuple[str, str, str]:
    """품질 등급 결정"""
    
    if score >= 90:
        return ("최고", "gold", "매우 신뢰할 만함")
    elif score >= 80:
        return ("높음", "green", "신뢰할 만함")
    elif score >= 70:
        return ("보통", "yellow", "적당히 신뢰할 만함")
    elif score >= 60:
        return ("낮음", "orange", "주의 필요")
    else:
        return ("매우낮음", "red", "신뢰도 낮음")

def validate_quality_assessment(result: Dict[str, Any], score: int) -> Dict[str, Any]:
    """품질 평가 검증"""
    
    validation = {
        "is_valid": True,
        "issues": [],
        "warnings": []
    }
    
    dimensions = result.get("dimensions", {})
    area_sqm = result.get("calculated_values", {}).get("area_sqm", 0)
    
    # 심각한 문제 검사
    if area_sqm > 50:
        validation["issues"].append("과대한 면적 측정")
        validation["is_valid"] = False
    
    if dimensions.get("height_m", 0) > 4.0:
        validation["issues"].append("비현실적인 천장 높이")
        validation["is_valid"] = False
    
    # 경고 검사
    if area_sqm < 4:
        validation["warnings"].append("매우 작은 방 크기")
    
    if score < 70:
        validation["warnings"].append("낮은 품질 점수")
    
    return validation

def generate_improvement_suggestions(
    result: Dict[str, Any], 
    score: int, 
    method: str
) -> list:
    """개선 제안 생성"""
    
    suggestions = []
    
    if score < 80:
        if "fallback" in method:
            suggestions.append("더 나은 조명에서 다시 촬영해보세요")
        
        if result.get("calculated_values", {}).get("area_sqm", 0) > 30:
            suggestions.append("측정점 위치를 더 정확히 지정해보세요")
        
        if result.get("confidence", 0) < 0.8:
            suggestions.append("이미지 화질을 개선하거나 각도를 조정해보세요")
    
    if score < 70:
        suggestions.append("실제 줄자로 한 변을 측정하여 보정하는 것을 권장합니다")
    
    return suggestions

def get_default_quality_score() -> Dict[str, Any]:
    """기본 품질 점수 반환"""
    
    return {
        "quality_score": 60,
        "grade": "보통",
        "color": "yellow",
        "reliability": "기본 신뢰도",
        "breakdown": {
            "method_quality": 15,
            "validity": 20,
            "consistency": 15,
            "correction_bonus": 5,
            "bonus": 5
        },
        "basis": "기본 품질 평가",
        "validation": {
            "is_valid": True,
            "issues": [],
            "warnings": ["품질 평가 실패로 기본값 사용"]
        },
        "suggestions": ["더 나은 조건에서 다시 측정해보세요"]
    }