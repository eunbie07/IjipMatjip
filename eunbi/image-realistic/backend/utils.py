import io
import os
import httpx
from PIL import Image
from fastapi import HTTPException

async def call_stability_controlnet(image_bytes: bytes, prompt_text: str, structure: str = "depth") -> str:
    """
    Stability AI SDXL을 사용하여 ControlNet 이미지 생성
    """
    if not os.getenv("STABILITY_API_KEY"):
        raise HTTPException(500, "Stability API key 없음")
        
    headers = {"Authorization": f"Bearer {os.getenv('STABILITY_API_KEY')}", "Accept": "application/json"}
    files = {"init_image": ("input.png", image_bytes, "image/png")}
    data = {
        "text_prompts[0][text]": prompt_text,
        "text_prompts[1][text]": "blurry, low quality, distorted",
        "text_prompts[1][weight]": "-1",
        "image_strength": "0.7",
        "cfg_scale": "12",
        "samples": "1",
        "steps": "50"
    }
    
    async with httpx.AsyncClient(timeout=300) as client:
        r = await client.post(
            "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image",
            headers=headers, files=files, data=data
        )
        if r.status_code >= 400:
            raise HTTPException(r.status_code, f"Stability API 오류: {r.text}")
        
        j = r.json()
        if "artifacts" not in j or not j["artifacts"]:
            raise HTTPException(500, "Stability 응답에 artifacts 없음")
        
        b64 = j["artifacts"][0]["base64"]
        return f"data:image/png;base64,{b64}"

def resize_image_for_sdxl(image_bytes: bytes) -> bytes:
    """이미지를 SDXL 호환 크기로 리사이즈"""
    sdxl_sizes = [
        (1024, 1024), (1152, 896), (1216, 832), (1344, 768),
        (1536, 640), (640, 1536), (768, 1344), (832, 1216), (896, 1152)
    ]
    
    image = Image.open(io.BytesIO(image_bytes))
    original_width, original_height = image.size
    original_ratio = original_width / original_height
    
    best_size = min(sdxl_sizes, key=lambda size: abs(size[0]/size[1] - original_ratio))
    
    if (original_width, original_height) != best_size:
        print(f"이미지 리사이즈: {original_width}x{original_height} → {best_size[0]}x{best_size[1]}")
        image = image.resize(best_size, Image.Resampling.LANCZOS)
    
    output = io.BytesIO()
    image.save(output, format='PNG', quality=90)
    return output.getvalue()
