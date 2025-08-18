 from fastapi import APIRouter, HTTPException, Query
 from fastapi.responses import Response
 from urllib.parse import urlparse
 import httpx
 
 router = APIRouter(prefix="/proxy", tags=["proxy"])
 
 # 허용할 원격 이미지 호스트 화이트리스트
 ALLOWED_HOSTS = {
 	"img.peterpanz.com",
 }
 
 @router.get("/image")
 async def proxy_image(url: str = Query(..., description="원격 이미지 URL")):
 	parsed = urlparse(url)
 
 	# URL 및 호스트 검증
 	if parsed.scheme not in ("http", "https"):
 		raise HTTPException(status_code=400, detail="지원되지 않는 스킴")
 	if not parsed.hostname or parsed.hostname not in ALLOWED_HOSTS:
 		raise HTTPException(status_code=400, detail="허용되지 않은 호스트")
 
 	# 원본 이미지 요청
 	try:
 		async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
 			resp = await client.get(url)
 			if resp.status_code != 200:
 				raise HTTPException(status_code=resp.status_code, detail="원본 서버 요청 실패")
 			content_type = resp.headers.get("Content-Type", "image/jpeg")
 			return Response(content=resp.content, media_type=content_type)
 	except httpx.RequestError as exc:
 		raise HTTPException(status_code=502, detail=f"프록시 요청 실패: {str(exc)}")
 	except Exception as exc:
 		raise HTTPException(status_code=500, detail=f"내부 오류: {str(exc)}")
 


