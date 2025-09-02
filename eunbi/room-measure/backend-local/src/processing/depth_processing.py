# room-measure/backend/depth_processing.py

import torch
import cv2
import numpy as np
import os
import ssl
import logging
from math import sqrt
from fastapi import UploadFile
from ..models.schemas import DepthDistanceRequest

# SSL 설정 (MiDaS 다운로드용) - 보안을 위해 조건부 적용
try:
    # 먼저 기본 SSL 컨텍스트로 시도
    import ssl
    _original_context = ssl._create_default_https_context
except ImportError:
    _original_context = None

logger = logging.getLogger(__name__)

# 파일 경로 설정
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # backend-local 폴더
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
DEPTH_MAP_PATH = os.path.join(OUTPUTS_DIR, "depth_map.npy")
DEPTH_IMAGE_PATH = os.path.join(OUTPUTS_DIR, "depth_map_output.png")
DEPTH_META_PATH = os.path.join(OUTPUTS_DIR, "depth_meta.txt")

async def generate_depth_map(file) -> dict:
    """하이브리드 깊이 맵 생성: OpenCV 기본 + MiDaS 보조"""
    try:
        logger.info("하이브리드 깊이 맵 생성 시작...")
        
        # 1단계: OpenCV 기본 깊이 맵 생성 (안정적)
        logger.info("단계 1: OpenCV 기본 깊이 맵 생성...")
        opencv_result = await generate_depth_map_opencv_primary(file)
        
        if not opencv_result["success"]:
            logger.error("OpenCV 기본 깊이 맵 생성 실패")
            return opencv_result
            
        # 2단계: MiDaS 보조 정보 생성 시도 (선택적)
        logger.info("단계 2: MiDaS 보조 정보 생성 시도...")
        midas_result = await generate_depth_map_midas_auxiliary(file)
        
        # 3단계: 결과 조합 및 품질 개선
        logger.info("단계 3: 결과 조합 및 품질 개선...")
        final_result = await combine_depth_results(opencv_result, midas_result)
        
        return final_result
        
    except Exception as e:
        logger.error(f"하이브리드 깊이 맵 생성 실패: {str(e)}")
        # 완전 폴백: 기존 OpenCV 방식
        logger.info("완전 폴백: 기존 OpenCV 방식...")
        return await generate_depth_map_fallback(file)

async def generate_depth_map_opencv_primary(file) -> dict:
    """OpenCV 기반 기본 깊이 맵 생성 (실내 최적화)"""
    try:
        logger.info("OpenCV 기본 깊이 추정 시작...")
        
        # 이미지 디코딩
        if isinstance(file, str):
            img = cv2.imread(file, cv2.COLOR_BGR2RGB)
        else:
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
        if img is None:
            raise ValueError("이미지를 디코딩할 수 없습니다")
            
        h, w = img.shape[:2]
        
        # 향상된 깊이 추정 알고리즘
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # 원근법 기반 (실내 최적화)
        y_indices, x_indices = np.meshgrid(np.arange(h), np.arange(w), indexing='ij')
        perspective_depth = (y_indices / h) * 200 + 150  # 150-350 범위
        
        # 밝기 기반 (향상됨)
        brightness_depth = (1 - blurred / 255.0) * 150 + 200  # 200-350 범위
        
        # 에지 기반
        edges = cv2.Canny(blurred, 30, 100)
        edge_depth = (edges / 255.0) * (-50) + 250  # 에지: 200, 평평한 곳: 250
        
        # 텍스처 기반 (새로 추가)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        texture_variance = cv2.GaussianBlur(np.abs(laplacian), (5, 5), 0)
        texture_depth = (texture_variance / texture_variance.max()) * 100 + 200
        
        # 가중 조합 (실내 환경 최적화)
        depth_map = (perspective_depth * 0.4 +   # 원근법 40%
                    brightness_depth * 0.3 +    # 밝기 30% 
                    edge_depth * 0.2 +          # 에지 20%
                    texture_depth * 0.1)        # 텍스처 10%
        
        # 실내 현실적 범위 제한
        depth_map = np.clip(depth_map, 120, 400)
        
        # 표준 크기로 리사이즈
        target_h, target_w = 192, 256
        depth_map_resized = cv2.resize(depth_map.astype(np.float32), (target_w, target_h))
        
        logger.info(f"OpenCV 기본 깊이 맵 생성 완료 - 크기: {target_w}x{target_h}, 범위: {depth_map_resized.min():.1f}-{depth_map_resized.max():.1f}")
        
        return {
            "success": True,
            "depth_map": depth_map_resized,
            "method": "opencv_primary",
            "quality_score": 85,  # 기본 품질 점수
            "range": {
                "min": float(depth_map_resized.min()),
                "max": float(depth_map_resized.max()),
                "mean": float(depth_map_resized.mean())
            }
        }
        
    except Exception as e:
        logger.error(f"OpenCV 기본 깊이 맵 생성 실패: {e}")
        return {"success": False, "error": str(e)}

async def generate_depth_map_midas_auxiliary(file) -> dict:
    """MiDaS 보조 정보 생성 (품질 개선용)"""
    try:
        # MiDaS 모델 로딩
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = None
        transform = None
        
        try:
            logger.info("MiDaS 보조 모델 로딩...")
            model_type = "MiDaS_small"
            
            try:
                model = torch.hub.load("intel-isl/MiDaS", model_type, trust_repo=True)
                transform = torch.hub.load("intel-isl/MiDaS", "transforms").small_transform
            except Exception as ssl_error:
                if "certificate" in str(ssl_error).lower() or "ssl" in str(ssl_error).lower():
                    ssl._create_default_https_context = ssl._create_unverified_context
                    model = torch.hub.load("intel-isl/MiDaS", model_type, trust_repo=True)
                    transform = torch.hub.load("intel-isl/MiDaS", "transforms").small_transform
                    if _original_context:
                        ssl._create_default_https_context = _original_context
                else:
                    raise ssl_error
                    
            model.to(device)
            model.eval()
            
        except Exception as e:
            logger.warning(f"MiDaS 보조 모델 로딩 실패, 스킵: {e}")
            return {"success": False, "error": "MiDaS unavailable", "skip": True}
        
        # 이미지 처리
        if isinstance(file, str):
            img = cv2.imread(file, cv2.IMREAD_COLOR)
        else:
            # 파일을 다시 읽어야 함 (이미 읽혔으므로)
            if hasattr(file, 'seek'):
                file.seek(0)
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
        if img is None:
            raise ValueError("이미지 디코딩 실패")
            
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # MiDaS 추론
        input_tensor = transform(img_rgb).to(device)
        with torch.no_grad():
            prediction = model(input_tensor)
        
        midas_depth = prediction.squeeze().cpu().numpy()
        
        # MiDaS 결과를 실내 환경에 맞게 조정
        midas_depth = np.clip(midas_depth, midas_depth.min(), midas_depth.max())
        midas_normalized = ((midas_depth - midas_depth.min()) / 
                           (midas_depth.max() - midas_depth.min()) * 280 + 120)  # 120-400 범위
        
        logger.info(f"MiDaS 보조 정보 생성 완료 - 범위: {midas_normalized.min():.1f}-{midas_normalized.max():.1f}")
        
        return {
            "success": True,
            "depth_map": midas_normalized,
            "method": "midas_auxiliary",
            "quality_score": 92,  # MiDaS 품질 점수
            "range": {
                "min": float(midas_normalized.min()),
                "max": float(midas_normalized.max()),
                "mean": float(midas_normalized.mean())
            }
        }
        
    except Exception as e:
        logger.warning(f"MiDaS 보조 정보 생성 실패, 스킵: {e}")
        return {"success": False, "error": str(e), "skip": True}

async def combine_depth_results(opencv_result: dict, midas_result: dict) -> dict:
    """OpenCV와 MiDaS 결과를 스마트하게 조합"""
    try:
        opencv_depth = opencv_result["depth_map"]
        
        # MiDaS 실패 시 OpenCV만 사용
        if not midas_result.get("success", False):
            logger.info("OpenCV 단독 사용 (MiDaS 비가용)")
            final_depth = opencv_depth
            quality_score = opencv_result["quality_score"]
            method = "opencv_only"
        else:
            # 하이브리드 조합
            logger.info("OpenCV + MiDaS 하이브리드 조합")
            midas_depth = midas_result["depth_map"]
            
            # 크기 맞춤
            if opencv_depth.shape != midas_depth.shape:
                midas_depth = cv2.resize(midas_depth, 
                                       (opencv_depth.shape[1], opencv_depth.shape[0]))
            
            # 스마트 블렌딩: OpenCV 5% + MiDaS 95% (MiDaS 주도)
            alpha = 0.05  # OpenCV 가중치
            midas_weight = 1 - alpha
            logger.info(f"하이브리드 블렌딩 비율: OpenCV {alpha*100:.0f}% + MiDaS {midas_weight*100:.0f}%")
            final_depth = alpha * opencv_depth + midas_weight * midas_depth
            
            # 품질 점수 조합
            opencv_quality = opencv_result["quality_score"]
            midas_quality = midas_result["quality_score"]
            quality_score = int(alpha * opencv_quality + (1 - alpha) * midas_quality)
            logger.info(f"품질 점수 조합: OpenCV {opencv_quality}점 × {alpha:.1f} + MiDaS {midas_quality}점 × {midas_weight:.1f} = {quality_score}점")
            method = "hybrid_opencv_midas"
        
        # 최종 저장
        os.makedirs(OUTPUTS_DIR, exist_ok=True)
        np.save(DEPTH_MAP_PATH, final_depth)
        
        # 시각화
        h, w = final_depth.shape
        depth_vis = cv2.normalize(final_depth, None, 0, 255, cv2.NORM_MINMAX)
        depth_vis = depth_vis.astype(np.uint8)
        depth_vis_colored = cv2.applyColorMap(depth_vis, cv2.COLORMAP_VIRIDIS)
        cv2.imwrite(DEPTH_IMAGE_PATH, depth_vis_colored)
        
        # 메타데이터
        with open(DEPTH_META_PATH, 'w') as f:
            f.write(f"{w},{h}")
        
        logger.info(f"하이브리드 깊이 맵 완성!")
        logger.info(f"  - 크기: {w} x {h}")
        logger.info(f"  - 방법: {method}")
        logger.info(f"  - 품질: {quality_score}점")
        
        return {
            "success": True,
            "depth_image_url": DEPTH_IMAGE_PATH,
            "depth_width": w,
            "depth_height": h,
            "method": method,
            "quality_score": quality_score,
            "message": f"하이브리드 깊이 맵 생성 완료 ({method})"
        }
        
    except Exception as e:
        logger.error(f"결과 조합 실패: {e}")
        return {"success": False, "error": str(e)}

# 기존 함수는 그대로 유지하되 이름 변경
async def generate_depth_map_legacy(file) -> dict:
    """기존 방식 (순수 MiDaS)"""
    try:
        # MiDaS 모델 로딩
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info("MiDaS 모델 로딩 중...")
        
        try:
            model_type = "MiDaS_small"
            model = torch.hub.load("intel-isl/MiDaS", model_type, trust_repo=True)
            transform = torch.hub.load("intel-isl/MiDaS", "transforms").small_transform
        except Exception as ssl_error:
            if "certificate" in str(ssl_error).lower() or "ssl" in str(ssl_error).lower():
                ssl._create_default_https_context = ssl._create_unverified_context
                model = torch.hub.load("intel-isl/MiDaS", model_type, trust_repo=True)
                transform = torch.hub.load("intel-isl/MiDaS", "transforms").small_transform
                if _original_context:
                    ssl._create_default_https_context = _original_context
            else:
                raise ssl_error
        
        model.to(device)
        model.eval()
        logger.info(f"MiDaS 모델 로딩 완료 ({device})")
        
        # 이미지 디코딩 (파일 경로 또는 UploadFile 처리)
        if isinstance(file, str):
            # 파일 경로인 경우
            img = cv2.imread(file, cv2.IMREAD_COLOR)
        else:
            # UploadFile인 경우
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("이미지를 디코딩할 수 없습니다")
            
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # 추론
        input_tensor = transform(img_rgb).to(device)
        with torch.no_grad():
            prediction = model(input_tensor)

        depth = prediction.squeeze().cpu().numpy()
        h, w = depth.shape
        
        # 깊이 범위 로그 추가
        depth_min, depth_max = depth.min(), depth.max()
        logger.info(f"순수 MiDaS 깊이 맵 생성 완료 - 크기: {w}x{h}, 범위: {depth_min:.1f}-{depth_max:.1f}")

        # 메타데이터 저장
        with open(DEPTH_META_PATH, "w") as f:
            f.write(f"{w},{h}")

        # depth map 저장
        np.save(DEPTH_MAP_PATH, depth)

        # 시각화 이미지 생성 및 저장 (MAGMA 컬러맵)
        depth_vis = cv2.normalize(depth, None, 0, 255, cv2.NORM_MINMAX)
        depth_vis = depth_vis.astype(np.uint8)
        depth_vis = cv2.applyColorMap(depth_vis, cv2.COLORMAP_MAGMA)
        cv2.imwrite(DEPTH_IMAGE_PATH, depth_vis)

        logger.info(f"순수 MiDaS Depth map 완료!")
        logger.info(f"  - 방법: MiDaS_small (순수)")
        logger.info(f"  - 크기: {w} x {h}")
        logger.info(f"  - 컬러맵: MAGMA")

        return {
            "success": True,
            "depth_image_url": DEPTH_IMAGE_PATH,
            "depth_width": w,
            "depth_height": h,
            "message": "depth map 생성 완료"
        }

    except Exception as e:
        logger.error(f"Depth map 생성 실패: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

def get_depth_image_path() -> str:
    """깊이 이미지 파일 경로 반환"""
    return DEPTH_IMAGE_PATH if os.path.exists(DEPTH_IMAGE_PATH) else None

def get_depth_at_point(x: int, y: int) -> dict:
    """특정 좌표의 깊이 값 조회"""
    try:
        logger.info(f"깊이 값 요청: ({x}, {y})")
        
        if not os.path.exists(DEPTH_MAP_PATH):
            return {
                "success": False,
                "error": "Depth map not found. 먼저 이미지를 업로드하고 depth-map을 생성해주세요."
            }

        depth_map = np.load(DEPTH_MAP_PATH)
        h, w = depth_map.shape
        
        logger.info(f"Depth map 정보: {w} × {h}")

        # 좌표 스케일링 및 안전한 클램핑
        original_x, original_y = x, y
        
        # 좌표가 깊이 맵 범위를 벗어나면 스케일링 적용
        if x >= w or y >= h:
            # 비율 기반 스케일링
            scale_x = (w - 1) / max(x, w - 1) if x >= w else 1.0
            scale_y = (h - 1) / max(y, h - 1) if y >= h else 1.0
            scale_factor = min(scale_x, scale_y)
            
            x = int(x * scale_factor)
            y = int(y * scale_factor)
            logger.info(f"좌표 스케일링: ({original_x}, {original_y}) → ({x}, {y}), 스케일: {scale_factor:.3f}")
        
        # 최종 안전 클램핑
        safe_x = max(0, min(x, w-1))
        safe_y = max(0, min(y, h-1))
        
        if safe_x != x or safe_y != y:
            logger.info(f"좌표 보정: ({x}, {y}) → ({safe_x}, {safe_y})")

        depth_value = float(depth_map[safe_y, safe_x])
        logger.info(f"  깊이 값: {depth_value:.6f}")

        if np.isnan(depth_value) or np.isinf(depth_value):
            logger.warning(f"유효하지 않은 깊이 값: {depth_value}")
            return {
                "success": False,
                "error": "해당 위치의 깊이 정보가 유효하지 않습니다.",
                "depth_value": str(depth_value),
                "suggestion": "다른 지점을 클릭해보세요."
            }

        return {
            "success": True,
            "depth": depth_value,
            "coordinates": {"x": safe_x, "y": safe_y},
            "original_request": {"x": x, "y": y},
            "depth_map_size": {"width": w, "height": h}
        }
        
    except Exception as e:
        logger.error(f"깊이 값 조회 실패: {str(e)}")
        return {
            "success": False,
            "error": "서버 내부 오류가 발생했습니다.",
            "details": str(e)
        }

def get_depth_map_meta() -> dict:
    """깊이 맵 메타데이터 조회"""
    try:
        if not os.path.exists(DEPTH_META_PATH):
            return {
                "success": False,
                "error": "meta 파일 없음"
            }

        with open(DEPTH_META_PATH, "r") as f:
            meta_content = f.read().strip()
            logger.info(f"Meta 파일 내용: '{meta_content}'")
            
            # 쉼표로 분리 시도
            parts = meta_content.split(",")
            if len(parts) == 2:
                w, h = parts
            else:
                # 쉼표가 없으면 공백으로 분리 시도
                parts = meta_content.split()
                if len(parts) == 2:
                    w, h = parts
                else:
                    # 기본값 사용 (256x192는 폴백 깊이 맵 크기)
                    logger.warning(f"Meta 파일 형식 불일치, 기본값 사용: {meta_content}")
                    w, h = "256", "192"
            
            return {
                "success": True,
                "width": int(w), 
                "height": int(h)
            }
    except Exception as e:
        logger.error(f"Meta 정보 조회 실패: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

def compute_3d_distance(req: DepthDistanceRequest) -> dict:
    """두 점 사이의 3D 거리 계산"""
    try:
        if not os.path.exists(DEPTH_MAP_PATH):
            return {
                "success": False,
                "error": "Depth map not found"
            }

        depth_map = np.load(DEPTH_MAP_PATH)
        h, w = depth_map.shape
        x1, y1 = req.point1.x, req.point1.y
        x2, y2 = req.point2.x, req.point2.y

        for x, y in [(x1, y1), (x2, y2)]:
            if not (0 <= x < w and 0 <= y < h):
                return {
                    "success": False,
                    "error": f"Point ({x},{y}) out of bounds"
                }

        d1 = float(depth_map[y1, x1])
        d2 = float(depth_map[y2, x2])

        if np.isnan(d1) or np.isnan(d2):
            return {
                "success": False,
                "error": "Invalid depth value"
            }

        dist_pixel = sqrt((x2 - x1)**2 + (y2 - y1)**2 + (d2 - d1)**2)
        distance_cm = dist_pixel * 1

        return {
            "success": True,
            "3d_distance_cm": round(distance_cm, 2),
            "depth1": round(d1, 3),
            "depth2": round(d2, 3),
            "pixel_distance": round(dist_pixel, 3)
        }
    except Exception as e:
        logger.error(f"거리 계산 실패: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

def check_depth_files_exist() -> dict:
    """깊이 관련 파일들의 존재 여부 확인"""
    return {
        "depth_map": os.path.exists(DEPTH_MAP_PATH),
        "depth_image": os.path.exists(DEPTH_IMAGE_PATH),
        "depth_meta": os.path.exists(DEPTH_META_PATH)
    }

async def generate_depth_map_fallback(file) -> dict:
    """MiDaS 실패 시 OpenCV 기반 간단한 깊이 추정 폴백"""
    try:
        logger.info("OpenCV 기반 깊이 추정 시작...")
        
        # 이미지 디코딩
        if isinstance(file, str):
            img = cv2.imread(file, cv2.COLOR_BGR2RGB)
        else:
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
        if img is None:
            raise ValueError("이미지를 디코딩할 수 없습니다")
            
        h, w = img.shape[:2]
        
        # 간단한 깊이 추정 (원근법과 밝기 기반)
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        
        # 1. 가우시안 블러로 노이즈 제거
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # 2. 원근법 기반 깊이: 위쪽은 멀고, 아래쪽은 가까움
        y_indices, x_indices = np.meshgrid(np.arange(h), np.arange(w), indexing='ij')
        perspective_depth = (y_indices / h) * 300 + 100  # 100-400 범위
        
        # 3. 밝기 기반 깊이: 어두운 영역은 더 멀다고 가정
        brightness_depth = (1 - blurred / 255.0) * 200 + 200  # 200-400 범위
        
        # 4. 에지 기반 깊이: 에지가 강한 곳은 구조물이므로 가까움
        edges = cv2.Canny(blurred, 50, 150)
        edge_depth = (edges / 255.0) * (-100) + 300  # 에지: 200, 평평한 곳: 300
        
        # 5. 가중 조합 (원근법 50%, 밝기 30%, 에지 20%)
        depth_map = (perspective_depth * 0.5 + 
                    brightness_depth * 0.3 + 
                    edge_depth * 0.2)
        
        # 6. 현실적인 범위로 제한 (100-500)
        depth_map = np.clip(depth_map, 100, 500)
        
        # 깊이 맵을 256x192로 리사이즈 (MiDaS와 같은 크기)
        target_h, target_w = 192, 256
        depth_map_resized = cv2.resize(depth_map.astype(np.float32), (target_w, target_h))
        
        # 저장
        os.makedirs(OUTPUTS_DIR, exist_ok=True)
        np.save(DEPTH_MAP_PATH, depth_map_resized)
        
        # 시각화용 이미지 생성
        depth_vis = (depth_map_resized - depth_map_resized.min()) / (depth_map_resized.max() - depth_map_resized.min())
        depth_vis = (depth_vis * 255).astype(np.uint8)
        depth_vis_colored = cv2.applyColorMap(depth_vis, cv2.COLORMAP_PLASMA)
        cv2.imwrite(DEPTH_IMAGE_PATH, depth_vis_colored)
        
        # 메타데이터 저장
        with open(DEPTH_META_PATH, 'w') as f:
            f.write(f"폴백 깊이 추정\\n")
            f.write(f"크기: {target_w} x {target_h}\\n")
            f.write(f"최소값: {depth_map_resized.min():.3f}\\n")
            f.write(f"최대값: {depth_map_resized.max():.3f}\\n")
            f.write(f"평균값: {depth_map_resized.mean():.3f}\\n")
        
        logger.info(f"폴백 깊이 추정 완료 - 크기: {target_w}x{target_h}, 범위: {depth_map_resized.min():.1f}-{depth_map_resized.max():.1f}")
        
        return {
            "success": True,
            "message": "OpenCV 기반 깊이 추정 완료",
            "method": "opencv_fallback",
            "depth_map_shape": [target_h, target_w],
            "depth_range": {
                "min": float(depth_map_resized.min()),
                "max": float(depth_map_resized.max()),
                "mean": float(depth_map_resized.mean())
            }
        }
        
    except Exception as e:
        logger.error(f"폴백 깊이 추정 실패: {e}")
        return {
            "success": False,
            "error": f"깊이 추정 실패: {str(e)}",
            "method": "fallback_failed"
        }