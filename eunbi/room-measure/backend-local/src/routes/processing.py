# 이미지 처리 관련 라우터

from fastapi import APIRouter, UploadFile, File, Query
from fastapi.responses import JSONResponse, FileResponse
import cv2
import numpy as np
import os
import logging
import tempfile

from ..models.schemas import DepthDistanceRequest
from ..processing.depth_processing import (
    generate_depth_map, generate_depth_map_legacy, get_depth_image_path, get_depth_at_point,
    get_depth_map_meta, compute_3d_distance
)
from ..processing.simple_distortion_correction import apply_simple_correction

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/processing", tags=["processing"])

# 파일 경로 설정
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")

@router.post("/undistort")
async def undistort_image(file: UploadFile = File(...)):
    """이미지 왜곡 보정"""
    try:
        if not file.content_type.startswith('image/'):
            return JSONResponse(
                status_code=400, 
                content={"error": "이미지 파일만 업로드 가능합니다"}
            )

        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return JSONResponse(
                status_code=400,
                content={"error": "이미지를 읽을 수 없습니다"}
            )

        # 이미지 분석 기반 적응적 광각 보정
        undistorted, correction_info = apply_simple_correction(img)
        
        logger.info(f"감지된 왜곡 레벨: {correction_info.get('correction_level', 'unknown')}")
        if correction_info.get('focal_factor'):
            logger.info(f"초점거리 계수: {correction_info['focal_factor']:.2f}")
        if correction_info.get('additional_correction_applied'):
            logger.info(f"추가 보정 적용됨")
        
        # 보정된 이미지 저장
        output_path = os.path.join(OUTPUTS_DIR, "undistorted_image.jpg")
        cv2.imwrite(output_path, undistorted)
        
        # 보정 정보 저장 (측정시 활용)
        import json
        correction_file = os.path.join(OUTPUTS_DIR, "correction_info.json")
        try:
            with open(correction_file, 'w') as f:
                json.dump(correction_info, f)
            logger.info(f"보정 정보 저장됨: {correction_file}")
        except Exception as e:
            logger.warning(f"보정 정보 저장 실패: {e}")
        
        logger.info(f"이미지 왜곡 보정 완료: {output_path}")
        
        # 보정 정보와 함께 응답 반환
        return JSONResponse(content={
            "success": True,
            "message": "이미지 왜곡 보정이 완료되었습니다",
            "correction_info": {
                "correction_level": correction_info.get('correction_level', 'moderate'),
                "focal_factor": correction_info.get('focal_factor', 0.8),
                "distortion_strength": correction_info.get('distortion_strength', 0.2),
                "additional_correction_applied": correction_info.get('additional_correction_applied', False),
                "fallback": correction_info.get('fallback', False)
            },
            "output_path": "undistorted_image.jpg"
        })
        
    except Exception as e:
        logger.error(f"이미지 왜곡 보정 실패: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"이미지 처리 중 오류가 발생했습니다: {str(e)}"}
        )

@router.get("/undistorted-image")
async def get_undistorted_image():
    """보정된 이미지 파일 다운로드"""
    try:
        output_path = os.path.join(OUTPUTS_DIR, "undistorted_image.jpg")
        
        if os.path.exists(output_path):
            return FileResponse(
                path=output_path,
                media_type="image/jpeg",
                filename="undistorted_image.jpg"
            )
        else:
            return JSONResponse(
                status_code=404,
                content={"error": "보정된 이미지를 찾을 수 없습니다. 먼저 이미지 보정을 수행해주세요."}
            )
    except Exception as e:
        logger.error(f"보정된 이미지 조회 실패: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"이미지 조회 중 오류가 발생했습니다: {str(e)}"}
        )

@router.post("/depth-map")
async def create_depth_map():
    """깊이 맵 생성"""
    try:
        undistorted_path = os.path.join(OUTPUTS_DIR, "undistorted_image.jpg")
        
        if not os.path.exists(undistorted_path):
            return JSONResponse(
                status_code=404,
                content={"error": "왜곡 보정된 이미지를 찾을 수 없습니다. 먼저 이미지를 업로드하고 왜곡 보정을 수행해주세요."}
            )
        
        success = await generate_depth_map_legacy(undistorted_path)
        
        if success:
            logger.info("깊이 맵 생성 완료")
            return {"success": True, "message": "깊이 맵이 생성되었습니다"}
        else:
            return JSONResponse(
                status_code=500,
                content={"error": "깊이 맵 생성에 실패했습니다"}
            )
            
    except Exception as e:
        logger.error(f"깊이 맵 생성 실패: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"깊이 맵 생성 중 오류가 발생했습니다: {str(e)}"}
        )

@router.get("/depth-map-image")
async def get_depth_map_image():
    """깊이 맵 이미지 조회"""
    try:
        depth_image_path = get_depth_image_path()
        
        if depth_image_path and os.path.exists(depth_image_path):
            return FileResponse(
                path=depth_image_path,
                media_type="image/png",
                filename="depth_map_output.png"
            )
        else:
            return JSONResponse(
                status_code=404,
                content={"error": "깊이 맵 이미지를 찾을 수 없습니다. 먼저 깊이 맵을 생성해주세요."}
            )
            
    except Exception as e:
        logger.error(f"깊이 맵 이미지 조회 실패: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"깊이 맵 조회 중 오류가 발생했습니다: {str(e)}"}
        )

@router.get("/depth-at-point")
async def get_depth_at_point_endpoint(x: int = Query(...), y: int = Query(...)):
    """특정 좌표의 깊이 값 조회"""
    try:
        result = get_depth_at_point(x, y)
        
        if isinstance(result, dict) and result.get("success"):
            return {"x": x, "y": y, "depth": result["depth"]}
        else:
            error_msg = result.get("error", "해당 좌표의 깊이 값을 조회할 수 없습니다") if isinstance(result, dict) else "깊이 값 조회 실패"
            return JSONResponse(
                status_code=400,
                content={"error": error_msg}
            )
            
    except Exception as e:
        logger.error(f"깊이 값 조회 실패: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"깊이 값 조회 중 오류가 발생했습니다: {str(e)}"}
        )

@router.get("/depth-meta")
async def get_depth_meta():
    """깊이 맵 메타 정보 조회"""
    try:
        meta_info = get_depth_map_meta()
        
        if meta_info:
            return meta_info
        else:
            return JSONResponse(
                status_code=404,
                content={"error": "깊이 맵 메타 정보를 찾을 수 없습니다"}
            )
            
    except Exception as e:
        logger.error(f"깊이 맵 메타 정보 조회 실패: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"메타 정보 조회 중 오류가 발생했습니다: {str(e)}"}
        )

@router.post("/depth-distance")
async def calculate_depth_distance(request: DepthDistanceRequest):
    """깊이 맵을 이용한 3D 거리 계산"""
    try:
        distance = compute_3d_distance(request.point1, request.point2)
        
        if distance is not None:
            return {
                "point1": request.point1.dict(),
                "point2": request.point2.dict(),
                "distance": float(distance),
                "unit": "cm"
            }
        else:
            return JSONResponse(
                status_code=400,
                content={"error": "거리 계산에 실패했습니다"}
            )
            
    except Exception as e:
        logger.error(f"거리 계산 실패: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"거리 계산 중 오류가 발생했습니다: {str(e)}"}
        )