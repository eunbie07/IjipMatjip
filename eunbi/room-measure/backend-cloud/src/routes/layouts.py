from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from datetime import datetime
import json
import logging

from src.models.schemas import (
    RoomLayoutData, 
    FurnitureCoordinateConversionRequest, 
    FurnitureCoordinateConversionResponse,
    FurniturePosition3D,
    Point3D
)
from src.auth.service import verify_token
from src.database.connections import DatabaseService, MongoDBService, SimpleStorageService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/layouts", tags=["Room Layouts"])

# 서비스 초기화
db_service = DatabaseService()
mongodb_service = MongoDBService()
storage_service = SimpleStorageService()


@router.post("/convert-furniture-coordinates", response_model=FurnitureCoordinateConversionResponse)
async def convert_furniture_coordinates(request: FurnitureCoordinateConversionRequest):
    """2D 가구 좌표를 3D 좌표로 변환"""
    try:
        furniture_3d = []
        room_width = request.room_size.get('width', 400)
        room_depth = request.room_size.get('depth', 400)
        
        for furniture_2d in request.furniture_2d:
            # 2D 좌표를 3D 좌표로 변환
            # x: 2D x 좌표를 3D x 좌표로 직접 매핑
            # y: 가구 높이의 절반 (바닥에서 중심까지)
            # z: 2D y 좌표를 3D z 좌표로 매핑
            
            furniture_3d_pos = FurniturePosition3D(
                id=furniture_2d.id,
                type=furniture_2d.type,
                position=Point3D(
                    x=furniture_2d.x,
                    y=furniture_2d.size[1] / 2,  # 높이의 절반
                    z=furniture_2d.y
                ),
                rotation=[0, furniture_2d.rotation, 0],
                size=furniture_2d.size
            )
            furniture_3d.append(furniture_3d_pos)
        
        return FurnitureCoordinateConversionResponse(furniture_3d=furniture_3d)
        
    except Exception as e:
        logger.error(f"좌표 변환 오류: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "좌표 변환 중 오류가 발생했습니다"}
        )


@router.post("/save")
async def save_room_layout(
    layout_data: RoomLayoutData, 
    current_user_id: int = Depends(verify_token)
):
    """방 레이아웃 저장 (로그인 사용자)"""
    try:
        layout_dict = layout_data.dict()
        layout_dict['user_id'] = current_user_id
        
        # datetime 객체를 문자열로 변환
        if layout_dict.get('created_at'):
            layout_dict['created_at'] = layout_dict['created_at'].isoformat()
        if layout_dict.get('updated_at'):
            layout_dict['updated_at'] = layout_dict['updated_at'].isoformat()
        
        # MongoDB 우선 저장 시도
        mongodb_success, mongodb_result = mongodb_service.save_room_layout(layout_dict.copy())
        
        # JSON 파일에도 백업 저장
        json_success = storage_service.save_room_layout(layout_dict)
        
        if mongodb_success:
            logger.info(f"방 레이아웃 저장 완료 (로그인 - MongoDB): 사용자 {current_user_id}")
            return {"success": True, "message": "방 레이아웃이 MongoDB에 저장되었습니다", "layout_id": mongodb_result}
        elif json_success:
            logger.info(f"방 레이아웃 저장 완료 (로그인 - JSON 백업): 사용자 {current_user_id}")
            return {"success": True, "message": "방 레이아웃이 JSON 파일에 저장되었습니다", "layout_id": None}
        else:
            return JSONResponse(
                status_code=500,
                content={"success": False, "error": "레이아웃 저장에 실패했습니다"}
            )
        
    except Exception as e:
        logger.error(f"레이아웃 저장 오류: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "레이아웃 저장 중 오류가 발생했습니다"}
        )


@router.post("/save-guest")
async def save_room_layout_guest(layout_data: RoomLayoutData):
    """방 레이아웃 저장 (게스트 사용자)"""
    try:
        layout_dict = layout_data.dict()
        layout_dict['user_id'] = None  # 게스트 사용자
        
        # datetime 객체를 문자열로 변환
        if layout_dict.get('created_at'):
            layout_dict['created_at'] = layout_dict['created_at'].isoformat()
        if layout_dict.get('updated_at'):
            layout_dict['updated_at'] = layout_dict['updated_at'].isoformat()
        
        # MongoDB 우선 저장 시도
        mongodb_success, mongodb_result = mongodb_service.save_room_layout(layout_dict.copy())
        
        # JSON 파일에도 백업 저장
        json_success = storage_service.save_room_layout(layout_dict)
        
        if mongodb_success:
            logger.info("방 레이아웃 저장 완료 (게스트 - MongoDB)")
            return {"success": True, "message": "방 레이아웃이 MongoDB에 저장되었습니다", "layout_id": mongodb_result}
        elif json_success:
            logger.info("방 레이아웃 저장 완료 (게스트 - JSON 백업)")
            return {"success": True, "message": "방 레이아웃이 JSON 파일에 저장되었습니다", "layout_id": None}
        else:
            return JSONResponse(
                status_code=500,
                content={"success": False, "error": "레이아웃 저장에 실패했습니다"}
            )
            
    except Exception as e:
        logger.error(f"레이아웃 저장 오류: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "레이아웃 저장 중 오류가 발생했습니다"}
        )


@router.get("/")
async def get_user_room_layouts(current_user_id: int = Depends(verify_token)):
    """사용자별 방 레이아웃 조회"""
    try:
        conn = db_service.get_connection()
        if not conn:
            # 데이터베이스 연결 실패시 JSON 파일에서 조회
            layouts = storage_service.get_all_layouts()
            user_layouts = [layout for layout in layouts if layout.get('user_id') == current_user_id]
            return {"success": True, "layouts": user_layouts}
        
        # MySQL에서 조회
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM room_layouts WHERE user_id = %s ORDER BY created_at DESC",
                (current_user_id,)
            )
            layouts = cursor.fetchall()
            
            # JSON 데이터 파싱
            for layout in layouts:
                if isinstance(layout['layout_data'], str):
                    layout['layout_data'] = json.loads(layout['layout_data'])
            
        return {"success": True, "layouts": layouts}
        
    except Exception as e:
        logger.error(f"레이아웃 조회 오류: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "레이아웃 조회 중 오류가 발생했습니다"}
        )


@router.get("/guest")
async def get_guest_room_layouts():
    """게스트 사용자 방 레이아웃 조회"""
    try:
        layouts = storage_service.get_all_layouts()
        guest_layouts = [layout for layout in layouts if layout.get('user_id') is None]
        return {"success": True, "layouts": guest_layouts}
        
    except Exception as e:
        logger.error(f"레이아웃 조회 오류: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "레이아웃 조회 중 오류가 발생했습니다"}
        )


@router.get("/{layout_id}")
async def get_room_layout(layout_id: str):
    """특정 방 레이아웃 조회"""
    try:
        layout = storage_service.get_layout_by_id(layout_id)
        
        if layout:
            return {"success": True, "layout": layout}
        else:
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": "레이아웃을 찾을 수 없습니다"}
            )
            
    except Exception as e:
        logger.error(f"레이아웃 조회 오류: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "레이아웃 조회 중 오류가 발생했습니다"}
        )


@router.delete("/{layout_id}")
async def delete_room_layout(layout_id: str, current_user_id: int = Depends(verify_token)):
    """방 레이아웃 삭제 (로그인 사용자)"""
    try:
        # MongoDB에서 삭제 시도
        mongodb_success = mongodb_service.delete_room_layout(layout_id, current_user_id)
        
        # MySQL에서도 삭제 시도 (있다면)
        mysql_success = False
        conn = db_service.get_connection()
        if conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM room_layouts WHERE id = %s AND user_id = %s",
                    (layout_id, current_user_id)
                )
                mysql_success = cursor.rowcount > 0
                conn.commit()
        
        # JSON 파일에서도 삭제 (백업)
        json_success = storage_service.delete_room_layout(layout_id)
        
        if mongodb_success or mysql_success or json_success:
            logger.info(f"방 레이아웃 삭제 완료: 레이아웃 ID {layout_id}, 사용자 {current_user_id}")
            return {"success": True, "message": "방 레이아웃이 삭제되었습니다"}
        else:
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": "삭제할 레이아웃을 찾을 수 없습니다"}
            )
            
    except Exception as e:
        logger.error(f"레이아웃 삭제 오류: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "레이아웃 삭제 중 오류가 발생했습니다"}
        )


@router.delete("/guest/{layout_id}")
async def delete_room_layout_guest(layout_id: str):
    """방 레이아웃 삭제 (게스트 사용자)"""
    try:
        # MongoDB에서 삭제 시도 (게스트)
        mongodb_success = mongodb_service.delete_room_layout_guest(layout_id)
        
        # JSON 파일에서도 삭제
        json_success = storage_service.delete_room_layout(layout_id)
        
        if mongodb_success or json_success:
            logger.info(f"방 레이아웃 삭제 완료 (게스트): 레이아웃 ID {layout_id}")
            return {"success": True, "message": "방 레이아웃이 삭제되었습니다"}
        else:
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": "삭제할 레이아웃을 찾을 수 없습니다"}
            )
            
    except Exception as e:
        logger.error(f"레이아웃 삭제 오류 (게스트): {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "레이아웃 삭제 중 오류가 발생했습니다"}
        )