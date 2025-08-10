"""
에러 핸들링 유틸리티
"""
import functools
import httpx
from fastapi import HTTPException


def handle_api_errors(provider_name: str):
    """API 호출 에러를 처리하는 데코레이터"""
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except httpx.TimeoutException:
                print(f"[{provider_name}] 타임아웃 발생")
                raise HTTPException(408, f"{provider_name} 요청 시간이 초과되었습니다.")
            except httpx.HTTPStatusError as e:
                print(f"[{provider_name}] HTTP 에러: {e.response.status_code} - {e.response.text}")
                raise HTTPException(e.response.status_code, f"{provider_name} API 오류: {e.response.text}")
            except HTTPException:
                # 이미 HTTPException인 경우 그대로 재발생
                raise
            except Exception as e:
                print(f"[{provider_name}] 예외 발생: {str(e)}")
                raise HTTPException(500, f"{provider_name} 호출 중 예외 발생: {str(e)}")
        return wrapper
    return decorator


def handle_replicate_errors(func):
    """Replicate API 전용 에러 핸들러"""
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except httpx.TimeoutException:
            print("[Replicate] 타임아웃 발생")
            raise HTTPException(408, "Replicate 요청 시간이 초과되었습니다.")
        except Exception as e:
            print(f"[Replicate] 예외 발생: {str(e)}")
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(500, f"Replicate API 오류: {str(e)}")
    return wrapper


def handle_stability_errors(func):
    """Stability AI API 전용 에러 핸들러"""
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except httpx.TimeoutException:
            print("[Stability] 타임아웃 발생")
            raise HTTPException(408, "Stability AI 요청 시간이 초과되었습니다.")
        except Exception as e:
            print(f"[Stability] 예외 발생: {str(e)}")
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(500, f"Stability AI API 오류: {str(e)}")
    return wrapper


def validate_api_key(key_name: str, key_value: str):
    """API 키 유효성 검사"""
    if not key_value:
        raise HTTPException(500, f"{key_name} API key missing.")


def handle_image_processing_errors(func):
    """이미지 처리 에러 핸들러"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            print(f"[Image Processing] 이미지 처리 실패: {str(e)}")
            raise HTTPException(500, f"이미지 처리 중 오류 발생: {str(e)}")
    return wrapper