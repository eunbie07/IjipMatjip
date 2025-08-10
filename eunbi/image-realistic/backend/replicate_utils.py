import os
import base64
import asyncio
from typing import List
import httpx
from fastapi import HTTPException
from dotenv import load_dotenv

from prompt_templates import REPLICATE_PROMPT, NEGATIVE_PROMPT
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
    """Replicate를 통한 Stability AI SDXL 모델"""
    if not REPLICATE_TOKEN:
        raise HTTPException(500, "Replicate API token missing.")
    
    resized_image_bytes = resize_image_for_sdxl(image_bytes)
    img_b64 = base64.b64encode(resized_image_bytes).decode()
    headers = {"Authorization": f"Token {REPLICATE_TOKEN}", "Content-Type": "application/json"}
    
    # Stability AI SDXL 모델 (Replicate)
    payload = {
        "version": "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        "input": {
            "image": f"data:image/png;base64,{img_b64}",
            "prompt": f"photorealistic bedroom interior, {prompt}",
            "negative_prompt": f"{NEGATIVE_PROMPT}, 3d render, cgi",
            "strength": strength,
            "guidance_scale": guidance,
            "num_outputs": 1,
            "num_inference_steps": 50,
            "scheduler": "DPMSolverMultistep"
        }
    }
    
    print(f"[Replicate] Stability AI SDXL 모델로 처리 중...")
    
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