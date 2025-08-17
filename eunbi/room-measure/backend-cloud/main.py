# EC2 배포용 경량 백엔드 (포트 3000)
# 데이터 저장/조회만 담당

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging
from datetime import datetime
import traceback

# 로깅 설정
from config.settings import LOG_LEVEL, LOG_FILE

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title="Room Measure Cloud API",
    version="1.0.0",
    description="""
    방 크기 측정 및 가구 배치 서비스의 클라우드 API

    ## 주요 기능
    - 사용자 인증 (회원가입/로그인)
    - 방 레이아웃 저장/조회
    - 가구 좌표 변환

    ## 포트 구분
    - **포트 3000**: 클라우드 데이터 저장/조회 (이 API)
    - **포트 3010**: 로컬 이미지/AI 처리
    """,
    contact={
        "name": "Room Measure Team",
        "email": "support@roommeasure.com"
    },
    license_info={
        "name": "MIT License"
    },
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 미들웨어
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 요청 로깅 미들웨어
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    request_id = id(request)
    
    logger.info(f"Request {request_id}: {request.method} {request.url}")
    
    response = await call_next(request)
    
    process_time = (datetime.now() - start_time).total_seconds()
    logger.info(f"Request {request_id} completed in {process_time:.3f}s - Status: {response.status_code}")
    
    return response

# 전역 예외 핸들러
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """입력 검증 오류 처리"""
    logger.error(f"Validation error: {exc}")
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": "입력 데이터가 올바르지 않습니다",
            "details": exc.errors()
        }
    )

@app.exception_handler(500)
async def internal_server_error_handler(request: Request, exc: Exception):
    """서버 내부 오류 처리"""
    logger.error(f"Internal server error: {str(exc)}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            "request_id": id(request)
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """일반 예외 처리"""
    logger.error(f"Unhandled exception: {str(exc)}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "예기치 않은 오류가 발생했습니다",
            "request_id": id(request)
        }
    )

# 라우터 등록
from src.routes.auth import router as auth_router
from src.routes.layouts import router as layouts_router

app.include_router(auth_router)
app.include_router(layouts_router)

# 기본 엔드포인트
@app.get("/")
async def root():
    return {"message": "Room Measure Cloud API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "cloud"}

# 레거시 엔드포인트 호환성 유지
from src.routes.layouts import (
    convert_furniture_coordinates, 
    save_room_layout, 
    save_room_layout_guest,
    get_user_room_layouts,
    get_guest_room_layouts,
    get_room_layout
)
from src.routes.auth import signup, login, get_current_user

# 레거시 URL 매핑
app.post("/convert-furniture-coordinates")(convert_furniture_coordinates)
app.post("/save-room-layout")(save_room_layout)
app.post("/save-room-layout-guest")(save_room_layout_guest)
app.get("/room-layouts")(get_user_room_layouts)
app.get("/room-layouts-guest")(get_guest_room_layouts)
app.get("/room-layout/{layout_id}")(get_room_layout)
app.post("/signup")(signup)
app.post("/login")(login)
app.get("/me")(get_current_user)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)