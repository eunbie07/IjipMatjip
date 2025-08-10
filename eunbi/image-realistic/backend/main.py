import os, base64, io, uuid, asyncio, json
from typing import List, Tuple
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
from PIL import Image, ImageDraw
from dotenv import load_dotenv

from prompt_templates import DEFAULT_STRENGTH, DEFAULT_GUIDANCE
from vertex_ai import run_pipeline_controlnet_to_flux
from prompt_builder import build_prompt

load_dotenv()

app = FastAPI(title="Realistic Room Composite Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class FurnitureItem(BaseModel):
    name: str
    type: str
    position: Tuple[float, float, float]
    rotation_y: float
    size: Tuple[float, float, float]

class Room(BaseModel):
    width: float
    depth: float
    height: float

class Scene(BaseModel):
    description: str
    room: Room
    objects: List[FurnitureItem]

class I2IResponse(BaseModel):
    images: List[str]

# --- Helper Functions ---
def save_uploaded_image(image_bytes: bytes, original_filename: str) -> str:
    os.makedirs('uploads', exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    file_id = str(uuid.uuid4())[:8]
    filename = f"{timestamp}_{file_id}_{original_filename}"
    filepath = os.path.join('uploads', filename)
    with open(filepath, 'wb') as f:
        f.write(image_bytes)
    print(f"[Storage] Saved: {filename}")
    return filepath

def save_generated_image(image_data: str, provider: str, request_id: str) -> str:
    os.makedirs('outputs', exist_ok=True)
    try:
        # Support both data URL and raw base64
        if image_data.startswith('http'):
             # If it's a URL, we need to download it first
            response = httpx.get(image_data)
            response.raise_for_status()
            image_bytes = response.content
        elif image_data.startswith('data:image'):
            base64_data = image_data.split(',')[1]
            image_bytes = base64.b64decode(base64_data)
        else:
            image_bytes = base64.b64decode(image_data)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{request_id}_{provider}.png"
        filepath = os.path.join('outputs', filename)
        with open(filepath, 'wb') as f:
            f.write(image_bytes)
        print(f"[Storage] Saved result: {filename}")
        return filepath
    except Exception as e:
        print(f"[Storage] Failed to save image: {e}")
        return None

def composite_images_crop_paste(scene: Scene, capture_bytes: bytes, img_size=(1024, 1024)) -> bytes:
    """
    Uses JSON coordinates to crop parts of the capture image and paste them onto a new canvas.
    """
    room_width_3d = scene.room.width
    room_depth_3d = scene.room.depth
    padding = 50
    
    drawable_width = img_size[0] - 2 * padding
    drawable_height = img_size[1] - 2 * padding
    
    scale_x = drawable_width / room_width_3d if room_width_3d > 0 else 1
    scale_y = drawable_height / room_depth_3d if room_depth_3d > 0 else 1
    scale = min(scale_x, scale_y)

    capture_img = Image.open(io.BytesIO(capture_bytes)).convert("RGBA")
    
    # Assuming capture_img is a direct screenshot of the Three.js scene,
    # it should be scaled to match the 2D canvas dimensions for accurate cropping.
    # The capture should ideally not contain anything outside the room boundaries.
    scaled_capture_size = (int(room_width_3d * scale), int(room_depth_3d * scale))
    capture_img = capture_img.resize(scaled_capture_size, Image.LANCZOS)

    canvas = Image.new("RGB", img_size, "white")

    for item in scene.objects:
        # Convert JSON center-point coordinates and size to pixel values
        center_x = item.position[0] * scale
        center_y = item.position[2] * scale
        size_x = item.size[0] * scale
        size_y = item.size[2] * scale

        # Calculate the crop box for the capture image (top-left coordinate system)
        crop_left = int(center_x - size_x / 2)
        crop_top = int(center_y - size_y / 2)
        crop_right = int(center_x + size_x / 2)
        crop_bottom = int(center_y + size_y / 2)
        
        crop_box = (
            max(0, crop_left), 
            max(0, crop_top), 
            min(capture_img.width, crop_right), 
            min(capture_img.height, crop_bottom)
        )
        
        if crop_box[0] >= crop_box[2] or crop_box[1] >= crop_box[3]:
            continue

        cropped_part = capture_img.crop(crop_box)

        # Calculate the paste position on the main canvas (with padding)
        paste_x = padding + crop_left
        paste_y = padding + crop_top
        
        canvas.paste(cropped_part, (paste_x, paste_y), cropped_part if cropped_part.mode == 'RGBA' else None)

    buf = io.BytesIO()
    canvas.save(buf, format="PNG")
    return buf.getvalue()

# --- Main Endpoint ---
@app.post("/api/realistic-room-composite", response_model=I2IResponse)
async def realistic_room_composite(
    scene_json: str = Form(...),
    capture: UploadFile = File(...),
    style: str = Form("scandinavian"),
    provider: str = Form("flux"),
    mode: str = Form("strict")
):
    """
    Composites a new image from a JSON layout and a capture screenshot,
    then sends it to an AI pipeline for stylization.
    """
    request_id = str(uuid.uuid4())[:8]
    try:
        scene = Scene.model_validate_json(scene_json)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid scene_json: {e}")

    cap_bytes = await capture.read()

    # Use the new 'crop and paste' compositing method
    composite_bytes = composite_images_crop_paste(scene, cap_bytes)

    # Save intermediate files for debugging
    save_uploaded_image(cap_bytes, f"{request_id}_capture.png")
    save_uploaded_image(composite_bytes, f"{request_id}_composite_final.png")

    prompt_text, _ = build_prompt(provider=provider, style_key=style, mode=mode)
    
    # Currently, only the FLUX pipeline is fully integrated here.
    # This can be expanded with if/elif for other providers.
    if provider == "flux":
        final_image_url = await run_pipeline_controlnet_to_flux(
            composite_bytes, prompt_text, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
        )
    else:
        raise HTTPException(status_code=400, detail=f"Provider '{provider}' is not supported for this endpoint.")
    
    if not final_image_url:
        raise HTTPException(500, "Image generation failed, no URL returned.")
    
    save_generated_image(final_image_url, f"{provider}_composite", request_id)

    return {"images": [final_image_url]}

@app.get("/healthz")
async def healthz():
    return {"ok": True}