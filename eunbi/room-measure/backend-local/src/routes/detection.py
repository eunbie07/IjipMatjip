# AI 감지 관련 라우터

from fastapi import APIRouter, UploadFile, File, Query
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import os
import logging
import tempfile

from ..models.schemas import RoomPoints
from ..detection.window_detection import detect_windows_in_image
from ..detection.ai_room_detection import detect_room_with_ai
from ..processing.room_measurement import (
    simulate_roomnet_detection, improved_room_measurement
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/detection", tags=["detection"])

@router.post("/auto-detect-room")
async def auto_detect_room(file: UploadFile = File(...), confidence_threshold: float = Query(0.7)):
    """AI를 이용한 자동 방 경계 감지"""
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

        # 임시 이미지 파일 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            cv2.imwrite(temp_file.name, img)
            temp_image_path = temp_file.name
        
        try:
            # 새로운 AI 기반 방 감지 수행 (더 낮은 임계값으로)
            logger.info("🤖 개선된 AI 기반 방 모서리 감지 시작...")
            # 개선된 AI는 더 낮은 임계값을 사용 (원래 요청된 임계값의 70%)
            adjusted_threshold = max(confidence_threshold * 0.7, 0.4)
            result = detect_room_with_ai(temp_image_path, adjusted_threshold)
            
            if result and result.get("success"):
                logger.info(f"AI 감지 완료: {len(result.get('detected_points', []))}개 포인트, 방법: {result.get('method')}")
                return result
            else:
                # AI 감지 실패시 기존 방법으로 폴백
                logger.info("AI 감지 실패, 기존 방법으로 폴백...")
                fallback_result = simulate_roomnet_detection(temp_image_path, confidence_threshold)
                
                if fallback_result and fallback_result.get("success"):
                    return fallback_result
                else:
                    return JSONResponse(
                        status_code=422,
                        content={
                            "success": False,
                            "error": "이미지에서 방 경계를 자동으로 감지할 수 없습니다"
                        }
                    )
        finally:
            # 임시 파일 삭제
            if os.path.exists(temp_image_path):
                os.unlink(temp_image_path)
            
    except Exception as e:
        logger.error(f"자동 감지 실패: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"자동 감지 중 오류가 발생했습니다: {str(e)}"
            }
        )

@router.post("/estimate-room-size")
async def estimate_room_size(room_points: RoomPoints):
    """방 크기 측정"""
    try:
        logger.info(f"방 크기 측정 요청: {len(room_points.points)}개 포인트")
        logger.info(f"목표 높이: {room_points.target_height}m (타입: {type(room_points.target_height)})")
        
        # target_height 유효성 검사
        if room_points.target_height is None or room_points.target_height <= 0:
            logger.warning(f"유효하지 않은 target_height: {room_points.target_height}, 기본값 2.3m 사용")
            room_points.target_height = 2.3
        
        # 보정 정보 로드 (광각 왜곡 보정에서 저장된 정보)
        correction_info = None
        try:
            import json
            correction_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
                                         "outputs", "correction_info.json")
            if os.path.exists(correction_file):
                with open(correction_file, 'r') as f:
                    correction_info = json.load(f)
                    logger.info(f"광각 보정 정보 로드됨: {correction_info.get('correction_level', 'unknown')}")
        except Exception as e:
            logger.warning(f"보정 정보 로드 실패: {e}, 기본값 사용")
        
        # 개선된 방 측정 알고리즘 사용 (target_height + correction_info 전달)
        result = improved_room_measurement(room_points.points, room_points.target_height, correction_info)
        
        if result and result.get('success'):
            logger.info(f"방 크기 측정 완료: {result}")
            return result
        else:
            return JSONResponse(
                status_code=422,
                content={"error": "방 크기를 측정할 수 없습니다. 포인트를 다시 확인해주세요."}
            )
            
    except Exception as e:
        logger.error(f"방 크기 측정 실패: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"방 크기 측정 중 오류가 발생했습니다: {str(e)}"}
        )

@router.post("/detect-windows")
async def detect_windows(file: UploadFile = File(...)):
    """창문 감지"""
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

        # 창문 감지 수행
        windows = detect_windows_in_image(img)
        
        logger.info(f"창문 감지 완료: {len(windows)}개 창문")
        
        return {
            "success": True,
            "windows": [window.dict() for window in windows],
            "total_windows": len(windows)
        }
        
    except Exception as e:
        logger.error(f"창문 감지 실패: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"창문 감지 중 오류가 발생했습니다: {str(e)}"}
        )