from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import logging

from src.models.schemas import UserSignup, UserLogin, Token, UserResponse
from src.auth.service import hash_password, verify_password, create_access_token, verify_token
from src.database.connections import DatabaseService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

# 데이터베이스 서비스 초기화
db_service = DatabaseService()


@router.post(
    "/signup", 
    response_model=dict,
    summary="사용자 회원가입",
    description="새 사용자 계정을 생성합니다",
    responses={
        200: {"description": "회원가입 성공"},
        400: {"description": "이미 가입된 이메일"},
        422: {"description": "입력 데이터 검증 실패"},
        500: {"description": "서버 오류"}
    }
)
async def signup(user_data: UserSignup):
    """
    새 사용자 계정을 생성합니다.
    
    - **email**: 유효한 이메일 주소
    - **password**: 6자 이상의 비밀번호
    """
    try:
        conn = db_service.get_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="데이터베이스 연결 실패")
        
        with conn.cursor() as cursor:
            # 이메일 중복 확인
            cursor.execute("SELECT id FROM users WHERE email = %s", (user_data.email,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="이미 가입된 이메일입니다")
            
            # 비밀번호 해싱
            hashed_password = hash_password(user_data.password)
            
            # 사용자 생성
            cursor.execute(
                "INSERT INTO users (email, password, created_at) VALUES (%s, %s, %s)",
                (user_data.email, hashed_password, datetime.now())
            )
            
        return {"message": "회원가입이 완료되었습니다"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"회원가입 오류: {e}")
        raise HTTPException(status_code=500, detail="서버 오류가 발생했습니다")


@router.post(
    "/login", 
    response_model=Token,
    summary="사용자 로그인",
    description="사용자 인증 후 JWT 토큰을 발급합니다",
    responses={
        200: {"description": "로그인 성공, JWT 토큰 반환"},
        401: {"description": "이메일 또는 비밀번호 불일치"},
        422: {"description": "입력 데이터 검증 실패"},
        500: {"description": "서버 오류"}
    }
)
async def login(user_data: UserLogin):
    """
    사용자 로그인을 처리합니다.
    
    - **email**: 등록된 이메일 주소
    - **password**: 계정 비밀번호
    
    성공시 JWT 토큰과 사용자 정보를 반환합니다.
    """
    try:
        conn = db_service.get_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="데이터베이스 연결 실패")
        
        with conn.cursor() as cursor:
            # 사용자 조회
            cursor.execute("SELECT * FROM users WHERE email = %s", (user_data.email,))
            user = cursor.fetchone()
            
            if not user or not verify_password(user_data.password, user['password']):
                raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 일치하지 않습니다")
            
            # JWT 토큰 생성
            access_token = create_access_token({"user_id": user['id']})
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user['id'],
                    "email": user['email'],
                    "created_at": user['created_at']
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"로그인 오류: {e}")
        raise HTTPException(status_code=500, detail="서버 오류가 발생했습니다")


@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user_id: int = Depends(verify_token)):
    """현재 사용자 정보 조회"""
    try:
        conn = db_service.get_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="데이터베이스 연결 실패")
        
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE id = %s", (current_user_id,))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
            
            return {
                "id": user['id'],
                "email": user['email'],
                "created_at": user['created_at']
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"사용자 조회 오류: {e}")
        raise HTTPException(status_code=500, detail="서버 오류가 발생했습니다")