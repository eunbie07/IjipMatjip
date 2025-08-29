# enhanced_image_processing.py
# 강화된 이미지 전처리 및 품질 분석 시스템

import cv2
import numpy as np
import logging
from typing import Tuple, Dict

logger = logging.getLogger(__name__)

class EnhancedImageProcessor:
    """강화된 이미지 전처리 및 품질 분석 클래스"""
    
    def __init__(self):
        self.quality_thresholds = {
            'sharpness_min': 100,      # 라플라시안 분산 최소값
            'sharpness_good': 500,     # 좋은 선명도 기준
            'brightness_min': 60,      # 최소 밝기
            'brightness_max': 200,     # 최대 밝기
            'brightness_optimal_min': 80,  # 최적 밝기 범위 시작
            'brightness_optimal_max': 180, # 최적 밝기 범위 끝
            'contrast_min': 800        # 최소 대비
        }
    
    def enhance_image_quality(self, image: np.ndarray) -> Tuple[np.ndarray, Dict]:
        """이미지 품질 향상 및 분석"""
        try:
            original_image = image.copy()
            h, w = image.shape[:2]
            
            # 그레이스케일 변환
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image
            
            logger.info(f"이미지 크기: {w}x{h}")
            
            # 1. 기본 품질 분석
            quality_analysis = self._analyze_image_quality(gray)
            logger.info(f"초기 품질 분석: {quality_analysis}")
            
            # 2. 적응적 노이즈 제거
            denoised = self._adaptive_denoising(gray, quality_analysis)
            
            # 3. 강화된 적응적 히스토그램 평활화
            enhanced = self._enhanced_clahe(denoised, quality_analysis)
            
            # 4. 선명도 개선
            sharpened = self._adaptive_sharpening(enhanced, quality_analysis)
            
            # 5. 최종 품질 분석
            final_quality = self._analyze_image_quality(sharpened)
            logger.info(f"최종 품질 분석: {final_quality}")
            
            return sharpened, {
                'original_quality': quality_analysis,
                'final_quality': final_quality,
                'improvement_score': final_quality['total_score'] - quality_analysis['total_score']
            }
            
        except Exception as e:
            logger.error(f"이미지 품질 향상 실패: {str(e)}")
            return image, {'error': str(e)}
    
    def _analyze_image_quality(self, image: np.ndarray) -> Dict:
        """이미지 품질 종합 분석"""
        quality_score = 0
        analysis = {}
        
        # 1. 선명도 분석 (라플라시안 분산)
        laplacian_var = cv2.Laplacian(image, cv2.CV_64F).var()
        analysis['sharpness'] = laplacian_var
        
        if laplacian_var >= self.quality_thresholds['sharpness_good']:
            quality_score += 8
            analysis['sharpness_grade'] = 'excellent'
        elif laplacian_var >= self.quality_thresholds['sharpness_min']:
            quality_score += 4
            analysis['sharpness_grade'] = 'good'
        else:
            analysis['sharpness_grade'] = 'poor'
        
        # 2. 밝기 분석
        brightness = np.mean(image)
        analysis['brightness'] = brightness
        
        if (self.quality_thresholds['brightness_optimal_min'] <= brightness <= 
            self.quality_thresholds['brightness_optimal_max']):
            quality_score += 6
            analysis['brightness_grade'] = 'optimal'
        elif (self.quality_thresholds['brightness_min'] <= brightness <= 
              self.quality_thresholds['brightness_max']):
            quality_score += 3
            analysis['brightness_grade'] = 'acceptable'
        else:
            analysis['brightness_grade'] = 'poor'
        
        # 3. 대비 분석 (히스토그램 분산)
        hist = cv2.calcHist([image], [0], None, [256], [0, 256])
        contrast_var = np.var(hist)
        analysis['contrast'] = contrast_var
        
        if contrast_var >= self.quality_thresholds['contrast_min']:
            quality_score += 6
            analysis['contrast_grade'] = 'good'
        else:
            quality_score += 2
            analysis['contrast_grade'] = 'poor'
        
        analysis['total_score'] = quality_score
        return analysis
    
    def _adaptive_denoising(self, image: np.ndarray, quality_analysis: Dict) -> np.ndarray:
        """적응적 노이즈 제거"""
        # 품질에 따른 적응적 파라미터
        if quality_analysis['total_score'] < 10:  # 품질이 낮으면 강한 노이즈 제거
            return cv2.bilateralFilter(image, 15, 100, 100)
        else:  # 품질이 좋으면 약한 노이즈 제거
            return cv2.bilateralFilter(image, 9, 50, 50)
    
    def _enhanced_clahe(self, image: np.ndarray, quality_analysis: Dict) -> np.ndarray:
        """강화된 CLAHE 적용"""
        brightness = quality_analysis['brightness']
        
        # 밝기에 따른 적응적 CLAHE 설정
        if brightness < 80:  # 어두운 이미지
            clip_limit = 4.0
            tile_size = (12, 12)
        elif brightness > 160:  # 밝은 이미지
            clip_limit = 2.0
            tile_size = (8, 8)
        else:  # 보통 이미지
            clip_limit = 3.0
            tile_size = (10, 10)
        
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_size)
        return clahe.apply(image)
    
    def _adaptive_sharpening(self, image: np.ndarray, quality_analysis: Dict) -> np.ndarray:
        """적응적 선명도 개선"""
        sharpness = quality_analysis['sharpness']
        
        if sharpness < 100:  # 매우 흐림 - 강한 선명화
            kernel = np.array([[-1, -1, -1, -1, -1],
                              [-1,  2,  2,  2, -1],
                              [-1,  2, 16,  2, -1],
                              [-1,  2,  2,  2, -1],
                              [-1, -1, -1, -1, -1]]) / 16
        elif sharpness < 300:  # 약간 흐림 - 중간 선명화
            kernel = np.array([[-1, -1, -1],
                              [-1,  9, -1],
                              [-1, -1, -1]])
        else:  # 이미 선명함 - 약한 선명화만
            kernel = np.array([[0, -1, 0],
                              [-1, 5, -1],
                              [0, -1, 0]])
        
        return cv2.filter2D(image, -1, kernel)
    
    def get_adaptive_detection_params(self, image: np.ndarray, quality_analysis: Dict) -> Dict:
        """이미지 품질에 따른 적응적 감지 파라미터"""
        brightness = quality_analysis['brightness']
        sharpness = quality_analysis['sharpness']
        
        params = {}
        
        # Canny 엣지 감지 파라미터
        if brightness < 80:  # 어두운 이미지
            params['canny_low'] = 30
            params['canny_high'] = 100
        elif brightness > 160:  # 밝은 이미지
            params['canny_low'] = 80
            params['canny_high'] = 200
        else:  # 보통 이미지
            params['canny_low'] = 50
            params['canny_high'] = 150
            
        # Hough Line Transform 파라미터
        if sharpness < 200:  # 흐린 이미지
            params['hough_threshold'] = 30
            params['min_line_length_ratio'] = 0.08
            params['max_line_gap_ratio'] = 0.03
        else:  # 선명한 이미지
            params['hough_threshold'] = 60
            params['min_line_length_ratio'] = 0.12
            params['max_line_gap_ratio'] = 0.02
            
        return params

# 전역 인스턴스
enhanced_processor = EnhancedImageProcessor()