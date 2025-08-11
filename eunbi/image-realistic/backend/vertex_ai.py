import os, base64, io
from fastapi import HTTPException
from PIL import Image
import httpx
from dotenv import load_dotenv

from utils import resize_image_for_sdxl
from replicate_utils import call_replicate_controlnet_structure
from prompt_templates import STYLE_PRESETS, CAPTURE_TO_REAL_PROMPT

load_dotenv()
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
GCP_LOCATION = os.getenv("GCP_LOCATION", "us-central1")

async def call_vertex_imagen(image_bytes: bytes, prompt: str, strength: float, guidance: float) -> str:
    """Calls the Vertex AI Imagen model to generate an image."""
    key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not key_path or not GCP_PROJECT_ID:
        raise HTTPException(500, "GCP environment variables are not set.")

    try:
        from google.auth.transport.requests import Request
        from google.oauth2 import service_account
        
        credentials = service_account.Credentials.from_service_account_file(
            key_path, scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        credentials.refresh(Request())
        token = credentials.token
    except Exception as e:
        raise HTTPException(500, f"Vertex AI authentication error: {e}")

    model_name = "imagegeneration@006"
    endpoint = f"https://{GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/{GCP_PROJECT_ID}/locations/{GCP_LOCATION}/publishers/google/models/{model_name}:predict"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    resized_image_bytes = resize_image_for_sdxl(image_bytes)
    b64_img = base64.b64encode(resized_image_bytes).decode()
    
    mask_image = Image.new('L', Image.open(io.BytesIO(resized_image_bytes)).size, 255)
    mask_buffer = io.BytesIO()
    mask_image.save(mask_buffer, format="PNG")
    mask_b64 = base64.b64encode(mask_buffer.getvalue()).decode()

    body = {
        "instances": [{
            "prompt": prompt,
            "image": { "bytesBase64Encoded": b64_img },
            "mask": { "image": { "bytesBase64Encoded": mask_b64 } }
        }],
        "parameters": {
            "sampleCount": 1,
            "guidanceScale": guidance,
            "strength": strength
        }
    }
    
    print(f"[Vertex] Calling {model_name} (strength={strength}, guidance={guidance})...")
    
    async with httpx.AsyncClient(timeout=300) as client:
        r = await client.post(endpoint, headers=headers, json=body)
        if r.status_code >= 400:
            raise HTTPException(500, f"Vertex AI API Error: {r.text}")
        
        resp = r.json()
        if "predictions" not in resp or not resp["predictions"]:
             raise HTTPException(500, f"No 'predictions' in Vertex AI response: {resp}")

        img_base64 = resp["predictions"][0]["bytesBase64Encoded"]
        print(f"[Vertex] {model_name} generation successful!")
        return f"data:image/png;base64,{img_base64}"

async def run_pipeline_replicate_to_vertex(
    img_bytes: bytes, style: str, strength: float, guidance: float
) -> str:
    """
    A 2-stage pipeline: Replicate's ControlNet for structure, then Vertex AI's Imagen for refinement.
    """
    print("[Pipeline] Starting Replicate -> Vertex AI pipeline...")
    
    # --- Stage 1: Create base structure with Replicate ControlNet ---
    style_text = STYLE_PRESETS.get(style, "")
    controlnet_prompt = f"{CAPTURE_TO_REAL_PROMPT} Style: {style_text}".strip()
    
    stage1_urls = await call_replicate_controlnet_structure(
        img_bytes, prompt=controlnet_prompt, strength=0.8, guidance=10, structure="depth"
    )
    if not stage1_urls:
        raise HTTPException(500, "Stage 1 (ControlNet) failed: No output URL.")
    
    print(f"[Pipeline] Stage 1 successful, intermediate URL: {stage1_urls[0]}")
    
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.get(stage1_urls[0])
        r.raise_for_status()
        stage1_bytes = r.content
    
    print("[Pipeline] Stage 1 intermediate image downloaded.")

    # --- Stage 2: Refine with Vertex AI ---
    vertex_refine_prompt = (
        "**Strictly preserve the existing furniture layout and composition.** "
        "Refine this interior image to hyper-realistic, magazine-quality. "
        "Enhance textures: detailed wood grain, soft cotton bedding with natural wrinkles. "
        "Improve lighting: soft, warm sunlight from a large window, creating natural shadows. "
        "Add small details like a book on a nightstand. "
        "The final result must be a photorealistic, high-end architectural photograph."
    )
    
    final_image_b64 = await call_vertex_imagen(
        stage1_bytes, prompt=vertex_refine_prompt, strength=0.4, guidance=12
    )
    print("[Pipeline] Stage 2 (Vertex AI) successful!")
    return final_image_b64