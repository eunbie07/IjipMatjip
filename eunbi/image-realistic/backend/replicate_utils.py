import os
import base64
import asyncio
from typing import List
import httpx
from fastapi import HTTPException
from dotenv import load_dotenv

from prompt_templates import REPLICATE_PROMPT, NEGATIVE_PROMPT, STYLE_PRESETS, CAPTURE_TO_REAL_PROMPT
from utils import resize_image_for_sdxl

load_dotenv()
REPLICATE_TOKEN = os.getenv("REPLICATE_API_TOKEN")

async def call_replicate_controlnet_structure(image_bytes: bytes, prompt: str, strength: float, guidance: float, structure: str = "depth") -> List[str]:
    """RossJillian ControlNet 모델 - 다양한 구조 보존"""
    if not REPLICATE_TOKEN:
        raise HTTPException(500, "Replicate API token missing.")
    
    resized_image_bytes = resize_image_for_sdxl(image_bytes)
    img_b64 = base64.b64encode(resized_image_bytes).decode()
    headers = {"Authorization": f"Token {REPLICATE_TOKEN}", "Content-Type": "application/json"}
    
    # RossJillian ControlNet 모델
    payload = {
        "version": "795433b19458d0f4fa172a7ccf93178d2adb1cb8ab2ad6c8fdc33fdbcd49f477",
        "input": {
            "image": f"data:image/png;base64,{img_b64}",
            "prompt": f"photorealistic bedroom interior, {REPLICATE_PROMPT}",
            "negative_prompt": f"{NEGATIVE_PROMPT}, 3d render, cgi",
            "structure": structure,
            "scale": guidance,
            "steps": 40
        }
    }
    
    print(f"[Replicate] ControlNet Structure ({structure}) 모델로 처리 중...")
    
    async with httpx.AsyncClient(timeout=300) as client:
        r = await client.post("https://api.replicate.com/v1/predictions",
                              headers=headers, json=payload)
        if r.status_code >= 400:
            raise HTTPException(r.status_code, r.text)
        pred = r.json()
        get_url = pred["urls"]["get"]
        
        while True:
            s = await client.get(get_url, headers=headers)
            if s.status_code >= 400:
                raise HTTPException(s.status_code, s.text)
            j = s.json()
            status = j.get("status")
            if status in ("succeeded", "failed", "canceled"):
                if status != "succeeded":
                    raise HTTPException(500, f"Replicate job {status}")
                return j["output"]
            await asyncio.sleep(1)

async def call_replicate_flux_ultra(image_bytes: bytes, prompt: str, strength: float, guidance: float) -> List[str]:
    """FLUX 1.1 Pro Ultra 모델 - 고해상도 포토리얼 업스케일"""
    if not REPLICATE_TOKEN:
        raise HTTPException(500, "Replicate API token missing.")
    
    from utils import resize_image_for_sdxl
    resized_image_bytes = resize_image_for_sdxl(image_bytes)
    img_b64 = base64.b64encode(resized_image_bytes).decode()
    headers = {"Authorization": f"Token {REPLICATE_TOKEN}", "Content-Type": "application/json"}
    
    # FLUX 1.1 Pro Ultra 모델
    payload = {
        "version": "c6e5086a542c99e7e523a83d3017654e8618fe64ef427c772a1def05bb599f0c",
        "input": {
            "prompt": f"photorealistic bedroom interior, {prompt}",
            "image_prompt": f"data:image/png;base64,{img_b64}",
            "image_prompt_strength": strength if strength < 0.8 else 0.1,
            "aspect_ratio": "1:1",
            "safety_tolerance": 5,
            "raw": True,
            "output_format": "png"
        }
    }
    
    print(f"[Replicate] FLUX Pro Ultra 모델로 고해상도 처리 중...")
    
    async with httpx.AsyncClient(timeout=300) as client:
        r = await client.post("https://api.replicate.com/v1/predictions",
                              headers=headers, json=payload)
        if r.status_code >= 400:
            raise HTTPException(r.status_code, r.text)
        pred = r.json()
        get_url = pred["urls"]["get"]
        
        while True:
            s = await client.get(get_url, headers=headers)
            if s.status_code >= 400:
                raise HTTPException(s.status_code, s.text)
            j = s.json()
            status = j.get("status")
            if status in ("succeeded", "failed", "canceled"):
                if status != "succeeded":
                    raise HTTPException(500, f"Replicate job {status}")
                return j["output"]
            await asyncio.sleep(1)

async def call_replicate_stability_sdxl(image_bytes: bytes, prompt: str, strength: float, guidance: float) -> List[str]:
    """Stability AI SDXL 모델"""
    if not REPLICATE_TOKEN:
        raise HTTPException(500, "Replicate API token missing.")
    
    resized_image_bytes = resize_image_for_sdxl(image_bytes)
    img_b64 = base64.b64encode(resized_image_bytes).decode()
    headers = {"Authorization": f"Token {REPLICATE_TOKEN}", "Content-Type": "application/json"}
    
    payload = {
        "version": "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
        "input": {
            "image": f"data:image/png;base64,{img_b64}",
            "prompt": prompt,
            "strength": strength,
            "guidance_scale": guidance,
            "num_inference_steps": 50
        }
    }
    
    print(f"[Replicate] Stability SDXL 모델로 처리 중...")
    
    async with httpx.AsyncClient(timeout=300) as client:
        r = await client.post("https://api.replicate.com/v1/predictions",
                              headers=headers, json=payload)
        if r.status_code >= 400:
            raise HTTPException(r.status_code, r.text)
        pred = r.json()
        get_url = pred["urls"]["get"]
        
        while True:
            s = await client.get(get_url, headers=headers)
            if s.status_code >= 400:
                raise HTTPException(s.status_code, s.text)
            j = s.json()
            status = j.get("status")
            if status in ("succeeded", "failed", "canceled"):
                if status != "succeeded":
                    raise HTTPException(500, f"Replicate job {status}")
                return j["output"]
            await asyncio.sleep(1)

async def run_pipeline_controlnet_to_flux(
    img_bytes: bytes, style: str, strength: float, guidance: float
) -> str:
    """
    ControlNet → FLUX 파이프라인: 구조 보존 + 고해상도 업스케일
    """
    print("[Pipeline-FLUX] ControlNet → FLUX 파이프라인 시작...")
    
    style_text = STYLE_PRESETS.get(style, "")
    controlnet_prompt = f"{CAPTURE_TO_REAL_PROMPT} Style: {style_text}".strip()
    
    print(f"[Pipeline-FLUX] 1단계: ControlNet 구조 생성...")
    base_image_urls = await call_replicate_controlnet_structure(
        img_bytes, controlnet_prompt, strength, guidance, structure="depth"
    )
    
    if not base_image_urls:
        raise HTTPException(status_code=500, detail="1단계 ControlNet 실패")
    
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.get(base_image_urls[0])
        if r.status_code != 200:
            raise HTTPException(502, f"ControlNet 이미지 다운로드 실패: {r.status_code}")
        base_image_bytes = r.content
    
    print("[Pipeline-FLUX] 2단계: FLUX Ultra 고해상도 처리...")
    flux_prompt = f"photorealistic bedroom interior, enhance details, {style_text}"
    flux_urls = await call_replicate_flux_ultra(
        base_image_bytes, flux_prompt, strength=0.3, guidance=guidance
    )
    
    if not flux_urls:
        raise HTTPException(status_code=500, detail="2단계 FLUX Ultra 실패")
    
    final_url = flux_urls[0] if isinstance(flux_urls, list) else flux_urls
    print(f"[Pipeline-FLUX] 최종 URL: {final_url}")
    return final_url
