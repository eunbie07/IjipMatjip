# accuracy_validator.py
# 실제 정확도 검증 및 개선 시스템

import logging
from typing import Dict, List, Tuple

logger = logging.getLogger(__name__)

class AccuracyValidator:
    """측정 정확도 검증 및 개선 클래스"""
    
    def __init__(self):
        # 한국 주거 환경 기준 (단위: 미터)
        self.room_constraints = {
            'min_width': 1.8,      # 최소 방 너비
            'max_width': 15.0,     # 최대 방 너비  
            'min_depth': 1.8,      # 최소 방 깊이
            'max_depth': 15.0,     # 최대 방 깊이
            'min_height': 2.0,     # 최소 천장 높이
            'max_height': 4.0,     # 최대 천장 높이
            'max_ratio': 4.0,      # 최대 가로세로 비율
            'min_ratio': 0.25      # 최소 가로세로 비율
        }
    
    def validate_physical_constraints(self, width: float, depth: float, height: float) -> Dict:
        """물리적 제약 조건 검증"""
        issues = []
        warnings = []
        estimated_accuracy = 100
        
        # 1. 크기 범위 검증
        if width < self.room_constraints['min_width']:
            issues.append(f"방 너비가 너무 작습니다 ({width:.1f}m < {self.room_constraints['min_width']}m)")
            estimated_accuracy -= 30
        elif width > self.room_constraints['max_width']:
            issues.append(f"방 너비가 너무 큽니다 ({width:.1f}m > {self.room_constraints['max_width']}m)")
            estimated_accuracy -= 30
            
        if depth < self.room_constraints['min_depth']:
            issues.append(f"방 깊이가 너무 작습니다 ({depth:.1f}m < {self.room_constraints['min_depth']}m)")
            estimated_accuracy -= 30
        elif depth > self.room_constraints['max_depth']:
            issues.append(f"방 깊이가 너무 큽니다 ({depth:.1f}m > {self.room_constraints['max_depth']}m)")
            estimated_accuracy -= 30
            
        # 2. 비율 검증
        ratio = width / depth if depth > 0 else 0
        if ratio > self.room_constraints['max_ratio']:
            warnings.append(f"방이 너무 긴 직사각형입니다 (비율: {ratio:.1f}:1)")
            estimated_accuracy -= 20
        elif ratio < self.room_constraints['min_ratio']:
            warnings.append(f"방이 너무 좁은 직사각형입니다 (비율: {ratio:.1f}:1)")
            estimated_accuracy -= 20
            
        # 3. 높이 검증 (선택적)
        if height:
            if height < self.room_constraints['min_height']:
                warnings.append(f"천장이 너무 낮습니다 ({height:.1f}m)")
                estimated_accuracy -= 10
            elif height > self.room_constraints['max_height']:
                warnings.append(f"천장이 너무 높습니다 ({height:.1f}m)")
                estimated_accuracy -= 10
        
        return {
            'is_valid': len(issues) == 0,
            'issues': issues,
            'warnings': warnings,
            'estimated_accuracy': max(estimated_accuracy, 10)  # 최소 10%
        }
    
    def suggest_improvements(self, validation_result: Dict) -> List[str]:
        """개선 제안"""
        suggestions = []
        
        if not validation_result['is_valid']:
            suggestions.extend([
                "다른 각도에서 촬영해보세요",
                "더 밝은 조명에서 촬영하세요", 
                "방의 모서리가 명확히 보이도록 촬영하세요",
                "카메라를 안정적으로 고정하여 촬영하세요"
            ])
        
        if validation_result['warnings']:
            suggestions.append("측정값이 일반적인 방 크기와 다릅니다. 실측으로 확인해보세요.")
            
        return suggestions
    
    def estimate_measurement_quality(self, ai_confidence: float, validation_result: Dict, image_quality: Dict = None, correction_info: Dict = None) -> Dict:
        """측정 품질 점수 계산 (AI 신뢰도 + 물리적 타당성만)"""
        
        # 1. AI 신뢰도 점수 (0-1 → 0-40점)
        confidence_score = ai_confidence * 40
        
        # 2. 물리적 타당성 점수 (0-100 → 0-40점)  
        physical_score = (validation_result['estimated_accuracy'] / 100) * 40
        
        # 3. 이미지 품질 점수 (0-15점)
        image_quality_score = 0
        if image_quality:
            # 이미지 품질이 있으면 추가 점수 (15점 최대로 축소)
            image_quality_score = min(image_quality.get('total_score', 0), 15)
        
        # 4. 광각 보정 품질 보너스 (0-5점)
        correction_bonus = 0
        if correction_info:
            correction_level = correction_info.get('correction_level', 'moderate')
            # 왜곡 보정이 적용될수록 측정 정확도 향상
            correction_bonuses = {
                'minimal': 1,    # 왜곡 거의 없음 - 소폭 보너스
                'moderate': 2,   # 일반 왜곡 보정 - 중간 보너스  
                'strong': 4,     # 광각 왜곡 보정 - 높은 보너스
                'ultra': 5       # 초광각 왜곡 보정 - 최대 보너스
            }
            correction_bonus = correction_bonuses.get(correction_level, 0)
            if correction_info.get('fallback', False):
                correction_bonus = 0  # 폴백시 보너스 없음
        
        final_quality_score = confidence_score + physical_score + image_quality_score + correction_bonus
        
        # 품질 등급과 예상 신뢰성 구간
        if final_quality_score >= 80:
            grade = "높음"
            color = "green"
            reliability = "신뢰할 만함"
        elif final_quality_score >= 60:
            grade = "보통"  
            color = "blue"
            reliability = "참고용으로 사용"
        elif final_quality_score >= 40:
            grade = "낮음"
            color = "orange"
            reliability = "오차 가능성 높음"
        else:
            grade = "매우 낮음"
            color = "red"
            reliability = "재촬영 권장"
            
        return {
            'quality_score': round(final_quality_score, 1),
            'grade': grade,
            'color': color,
            'reliability': reliability,
            'breakdown': {
                'ai_confidence': round(confidence_score, 1),
                'physical_validity': round(physical_score, 1),
                'image_quality': round(image_quality_score, 1),
                'correction_bonus': round(correction_bonus, 1)
            },
            'basis': "AI 알고리즘 확신도, 물리적 타당성 및 광각 보정 품질 검증"
        }

# 전역 인스턴스
accuracy_validator = AccuracyValidator()