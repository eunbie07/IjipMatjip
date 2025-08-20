from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from datetime import datetime
import base64
import uuid
import boto3
from botocore.exceptions import BotoCoreError, ClientError

from config.settings import (
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
    S3_BUCKET,
    S3_PUBLIC_BASE_URL,
    S3_OBJECT_ACL,
)
from src.auth.service import verify_token


router = APIRouter(prefix="/images", tags=["Images"])


class UploadImageRequest(BaseModel):
    image_data_url: str
    variant: str | None = None  # "design" | "realistic" 등
    room_id: str | None = None


def _parse_data_url(data_url: str) -> tuple[str, bytes]:
    """data:[mime];base64,<data> 형식을 파싱하고 (mime, bytes)를 반환"""
    if not data_url.startswith("data:"):
        raise ValueError("지원하지 않는 이미지 형식입니다 (data URL 필요)")
    try:
        header, b64data = data_url.split(",", 1)
        # 예: data:image/png;base64
        mime_part = header.split(";")[0]
        mime_type = mime_part.replace("data:", "")
        raw = base64.b64decode(b64data)
        return mime_type, raw
    except Exception as exc:
        raise ValueError(f"data URL 파싱 실패: {exc}")


def _build_s3_key(user_id: int, variant: str | None, extension: str) -> str:
    now = datetime.utcnow()
    date_prefix = now.strftime("%Y/%m/%d")
    variant_part = variant or "design"
    unique = uuid.uuid4().hex
    return f"users/{user_id}/ai-interior/{date_prefix}/{variant_part}_{unique}.{extension}"


@router.post("/upload")
async def upload_generated_image(payload: UploadImageRequest, user_id: int = Depends(verify_token)):
    if not S3_BUCKET or not AWS_REGION:
        raise HTTPException(status_code=500, detail="S3 설정이 누락되었습니다")

    try:
        mime_type, image_bytes = _parse_data_url(payload.image_data_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    extension = "png" if mime_type == "image/png" else "jpg" if mime_type in ("image/jpeg", "image/jpg") else None
    if not extension:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 MIME 타입: {mime_type}")

    s3_key = _build_s3_key(user_id=user_id, variant=payload.variant, extension=extension)

    try:
        s3_client = boto3.client(
            "s3",
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID or None,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY or None,
        )

        put_kwargs = {
            "Bucket": S3_BUCKET,
            "Key": s3_key,
            "Body": image_bytes,
            "ContentType": mime_type,
            "Metadata": {
                "user_id": str(user_id),
                "variant": (payload.variant or "design"),
                **({"room_id": payload.room_id} if payload.room_id else {}),
            },
        }
        # ACL을 사용하는 버킷만 설정 (ACL 미지원 버킷은 생략)
        if S3_OBJECT_ACL:
            put_kwargs["ACL"] = S3_OBJECT_ACL

        s3_client.put_object(**put_kwargs)

        if S3_PUBLIC_BASE_URL:
            # CloudFront 또는 정적 도메인 사용 시
            public_url = f"{S3_PUBLIC_BASE_URL.rstrip('/')}/{s3_key}"
        else:
            public_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"

        return {
            "success": True,
            "key": s3_key,
            "url": public_url,
        }
    except (BotoCoreError, ClientError) as e:
        raise HTTPException(status_code=502, detail=f"S3 업로드 실패: {e}")


@router.get("/list")
async def list_generated_images(
    limit: int = Query(20, ge=1, le=100),
    continuation_token: str | None = Query(None),
    user_id: int = Depends(verify_token),
):
    if not S3_BUCKET or not AWS_REGION:
        raise HTTPException(status_code=500, detail="S3 설정이 누락되었습니다")

    prefix = f"users/{user_id}/ai-interior/"
    try:
        s3_client = boto3.client(
            "s3",
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID or None,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY or None,
        )

        kwargs = {
            "Bucket": S3_BUCKET,
            "Prefix": prefix,
            "MaxKeys": limit,
        }
        if continuation_token:
            kwargs["ContinuationToken"] = continuation_token

        resp = s3_client.list_objects_v2(**kwargs)

        contents = resp.get("Contents", [])
        items = []
        for obj in contents:
            key = obj["Key"]
            if not key.lower().endswith((".png", ".jpg", ".jpeg")):
                continue
            if S3_PUBLIC_BASE_URL:
                url = f"{S3_PUBLIC_BASE_URL.rstrip('/')}/{key}"
            else:
                url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"
            items.append({
                "key": key,
                "url": url,
                "size": obj.get("Size"),
                "last_modified": obj.get("LastModified").isoformat() if obj.get("LastModified") else None,
            })

        next_token = resp.get("NextContinuationToken") if resp.get("IsTruncated") else None

        return {
            "success": True,
            "items": items,
            "next_continuation_token": next_token,
        }
    except (BotoCoreError, ClientError) as e:
        raise HTTPException(status_code=502, detail=f"S3 목록 조회 실패: {e}")


