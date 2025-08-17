# 로컬용 이미지/AI 처리 백엔드 (포트 3010)
# 무거운 이미지 처리 및 AI 분석 담당

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# 라우터 import
from src.routes.processing import router as processing_router
from src.routes.detection import router as detection_router

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Room Measure Local API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(processing_router)
app.include_router(detection_router)

# 기본 엔드포인트
@app.get("/")
async def root():
    return {"message": "Room Measure Local API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "local"}

# 레거시 호환성을 위한 기존 엔드포인트들 (간단한 프록시)
from src.routes.processing import (
    undistort_image, create_depth_map, get_depth_map_image, 
    get_depth_at_point_endpoint, get_depth_meta, calculate_depth_distance
)
from src.routes.detection import (
    auto_detect_room, estimate_room_size, detect_windows
)

# 기존 경로 유지 (레거시 호환성)
app.post("/undistort")(undistort_image)
app.post("/depth-map")(create_depth_map)
app.get("/depth-map-image")(get_depth_map_image)
app.get("/get-depth-at-point")(get_depth_at_point_endpoint)
app.get("/depth-meta")(get_depth_meta)
app.post("/depth-distance")(calculate_depth_distance)
app.post("/auto-detect-room")(auto_detect_room)
app.post("/estimate-room-size")(estimate_room_size)
app.post("/detect-windows")(detect_windows)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3010)