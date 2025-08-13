import os, base64, io, uuid, asyncio, json
from typing import List, Tuple
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from dotenv import load_dotenv

from prompt_templates import DEFAULT_STRENGTH, DEFAULT_GUIDANCE
from vertex_ai import run_pipeline_replicate_to_vertex
from replicate_utils import call_replicate_controlnet_structure, call_replicate_stability_sdxl, run_pipeline_controlnet_to_flux
from utils import resize_image_for_sdxl
import httpx
import numpy as np
import cv2
from PIL import ImageDraw
from prompt_builder import build_prompt, build_style_transfer_prompt
from layout_processor import LayoutProcessor

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
def save_image(image_bytes: bytes, folder: str, filename: str) -> str:
    os.makedirs(folder, exist_ok=True)
    filepath = os.path.join(folder, filename)
    with open(filepath, 'wb') as f:
        f.write(image_bytes)
    print(f"[Storage] Saved: {filepath}")
    return filepath

def save_generated_image(image_data: str, provider: str, request_id: str) -> str:
    try:
        if image_data.startswith('http'):
            response = httpx.get(image_data)
            response.raise_for_status()
            image_bytes = response.content
        elif image_data.startswith('data:image'):
            image_bytes = base64.b64decode(image_data.split(',')[1])
        else:
            image_bytes = base64.b64decode(image_data)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{request_id}_{provider}.png"
        return save_image(image_bytes, 'outputs', filename)
    except Exception as e:
        print(f"[Storage] Failed to save image: {e}")
        return None

def composite_images_crop_paste(scene: Scene, capture_bytes: bytes, img_size=(1024, 1024)) -> bytes:
    """
    Uses JSON coordinates to crop parts of the capture image and paste them onto a new canvas.
    This is the core logic to ensure the layout is preserved.
    """
    room_width_3d = scene.room.width
    room_depth_3d = scene.room.depth
    padding = 80
    
    drawable_width = img_size[0] - 2 * padding
    drawable_height = img_size[1] - 2 * padding
    
    scale = min(drawable_width / room_width_3d, drawable_height / room_depth_3d) if room_width_3d > 0 and room_depth_3d > 0 else 1

    capture_img = Image.open(io.BytesIO(capture_bytes)).convert("RGBA")
    
    # The capture image is a direct screenshot of the 3D scene.
    # We assume its content corresponds to the room dimensions.
    scaled_capture_size = (int(room_width_3d * scale), int(room_depth_3d * scale))
    capture_img_resized = capture_img.resize(scaled_capture_size, Image.LANCZOS)

    canvas = Image.new("RGB", img_size, "white")

    for item in scene.objects:
        # 가구는 바닥 평면만 사용: [X, Z] → [X, Y] 매핑 (Y축 높이 무시)
        center_x = padding + item.position[0] * scale  # X 그대로
        center_y = padding + item.position[2] * scale  # Z를 Y로 (top-left origin)
        
        size_x = item.size[0] * scale
        size_y = item.size[2] * scale

        # Calculate the crop box based on the scaled capture image dimensions.
        crop_left = int(center_x - size_x / 2)
        crop_top = int(center_y - size_y / 2)
        crop_right = int(center_x + size_x / 2)
        crop_bottom = int(center_y + size_y / 2)
        
        crop_box = (
            max(0, crop_left), 
            max(0, crop_top), 
            min(capture_img_resized.width, crop_right), 
            min(capture_img_resized.height, crop_bottom)
        )
        
        if crop_box[0] >= crop_box[2] or crop_box[1] >= crop_box[3]:
            continue

        cropped_part = capture_img_resized.crop(crop_box)

        # Calculate the paste position on the main canvas, including padding.
        paste_x = padding + crop_left
        paste_y = padding + crop_top
        
        canvas.paste(cropped_part, (paste_x, paste_y), cropped_part)

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
    request_id = str(uuid.uuid4())[:8]
    try:
        scene = Scene.model_validate_json(scene_json)
    except Exception as e:
        print(f"[ERROR] Invalid scene_json: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid scene_json: {e}")

    try:
        cap_bytes = await capture.read()

        # Use the new, correct 'crop and paste' compositing method
        composite_bytes = composite_images_crop_paste(scene, cap_bytes)
    except Exception as e:
        print(f"[ERROR] Composite error: {e}")
        raise HTTPException(status_code=500, detail=f"Composite error: {e}")

    # Save intermediate files for debugging
    save_image(cap_bytes, 'uploads', f"{request_id}_capture.png")
    save_image(composite_bytes, 'uploads', f"{request_id}_composite_input.png")

    try:
        # This old endpoint will not use the new dynamic prompt logic
        prompt_text, _ = build_prompt(provider=provider, style_key=style, mode=mode, furniture_list=[])
        print(f"[INFO] Using prompt: {prompt_text}")
        
        if provider == "flux":
            # FLUX Ultra: ControlNet → FLUX-1.1-PRO
            final_image_url = await run_pipeline_controlnet_to_flux(
                composite_bytes, prompt_text, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
            )
        elif provider == "vertex":
            # Vertex AI: ControlNet → Vertex Imagen
            final_image_data_url = await run_pipeline_replicate_to_vertex(
                composite_bytes, style, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
            )
            final_image_url = final_image_data_url
        elif provider == "replicate":
            # Replicate: ControlNet만 (단일 단계)
            controlnet_urls = await call_replicate_controlnet_structure(
                composite_bytes, prompt_text, DEFAULT_STRENGTH, DEFAULT_GUIDANCE, structure="depth"
            )
            
            if controlnet_urls:
                # URL에서 이미지 다운로드하여 base64로 변환
                async with httpx.AsyncClient() as client:
                    resp = await client.get(controlnet_urls[0])
                    if resp.status_code == 200:
                        import base64
                        img_b64 = base64.b64encode(resp.content).decode()
                        final_image_url = f"data:image/png;base64,{img_b64}"
                    else:
                        raise HTTPException(500, f"Replicate 이미지 다운로드 실패: {resp.status_code}")
            else:
                raise HTTPException(500, "Replicate ControlNet 처리 실패")
        elif provider == "stability":
            # Stability AI: Replicate를 통한 SDXL
            stability_urls = await call_replicate_stability_sdxl(
                composite_bytes, prompt_text, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
            )
            
            if stability_urls:
                # URL에서 이미지 다운로드하여 base64로 변환
                async with httpx.AsyncClient() as client:
                    resp = await client.get(stability_urls[0])
                    if resp.status_code == 200:
                        import base64
                        img_b64 = base64.b64encode(resp.content).decode()
                        final_image_url = f"data:image/png;base64,{img_b64}"
                    else:
                        raise HTTPException(500, f"Stability 이미지 다운로드 실패: {resp.status_code}")
            else:
                raise HTTPException(500, "Stability 처리 실패")
        else:
            raise HTTPException(status_code=400, detail=f"Provider '{provider}' is not supported.")
    except Exception as e:
        print(f"[ERROR] Pipeline error with provider {provider}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Pipeline error: {e}")
    
    if not final_image_url:
        raise HTTPException(500, "Image generation failed, no URL returned.")
    
    save_generated_image(final_image_url, f"{provider}_composite", request_id)

    return {"images": [final_image_url]}

# --- 추가 엔드포인트들 ---

@app.post("/api/realistic-room-upload", response_model=I2IResponse)
async def realistic_room_upload(
    image: UploadFile = File(...),
    style: str = Form("scandinavian"),
    provider: str = Form("flux")
):
    """
    단일 이미지 업로드로 실사화 처리
    """
    request_id = str(uuid.uuid4())[:8]
    img_bytes = await image.read()
    
    uploaded_path = save_image(img_bytes, 'uploads', f"{request_id}_upload.png")
    print(f"[Upload] 요청 ID: {request_id}, 제공자: {provider}")
    
    try:
        prompt_text, _ = build_prompt(provider=provider, style_key=style, mode="strict", furniture_list=[])
        
        if provider == "flux":
            final_image_url = await run_pipeline_controlnet_to_flux(
                img_bytes, prompt_text, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
            )
        elif provider == "vertex":
            final_image_url = await run_pipeline_replicate_to_vertex(
                img_bytes, style, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
            )
        elif provider == "replicate":
            controlnet_urls = await call_replicate_controlnet_structure(
                img_bytes, prompt_text, DEFAULT_STRENGTH, DEFAULT_GUIDANCE, structure="depth"
            )
            if controlnet_urls:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(controlnet_urls[0])
                    if resp.status_code == 200:
                        img_b64 = base64.b64encode(resp.content).decode()
                        final_image_url = f"data:image/png;base64,{img_b64}"
                    else:
                        raise HTTPException(500, f"이미지 다운로드 실패: {resp.status_code}")
            else:
                raise HTTPException(500, "ControlNet 처리 실패")
        elif provider == "stability":
            stability_urls = await call_replicate_stability_sdxl(
                img_bytes, prompt_text, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
            )
            if stability_urls:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(stability_urls[0])
                    if resp.status_code == 200:
                        img_b64 = base64.b64encode(resp.content).decode()
                        final_image_url = f"data:image/png;base64,{img_b64}"
                    else:
                        raise HTTPException(500, f"이미지 다운로드 실패: {resp.status_code}")
            else:
                raise HTTPException(500, "Stability 처리 실패")
        else:
            raise HTTPException(400, f"지원하지 않는 제공자: {provider}")
        
        if final_image_url:
            save_generated_image(final_image_url, f"{provider}_upload", request_id)
        
        return {"images": [final_image_url]}
        
    except Exception as e:
        print(f"[Upload] 처리 실패 - 요청 ID: {request_id}, 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/realistic-room-json", response_model=I2IResponse)
async def realistic_room_json_only(
    scene_json: str = Form(...),
    style: str = Form("scandinavian"),
    provider: str = Form("flux"),
    mode: str = Form("strict")
):
    """
    JSON 데이터만으로 2D 레이아웃 생성 후 실사화
    """
    request_id = str(uuid.uuid4())[:8]
    try:
        scene = Scene.model_validate_json(scene_json)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"JSON 파싱 오류: {e}")

    # JSON에서 2D 레이아웃 생성
    layout_bytes = generate_layout_from_json(scene)
    save_image(layout_bytes, 'uploads', f"{request_id}_layout_from_json.png")

    furniture_list = [obj.type for obj in scene.objects]
    prompt_text, _ = build_prompt(provider=provider, style_key=style, mode=mode, furniture_list=furniture_list)

    if provider == "flux":
        final_image_url = await run_pipeline_controlnet_to_flux(
            layout_bytes, prompt_text, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
        )
        if not final_image_url:
            raise HTTPException(500, "이미지 생성 실패")
        
        save_generated_image(final_image_url, f"{provider}_json_only", request_id)
        return {"images": [final_image_url]}
    else:
        raise HTTPException(400, f"Provider '{provider}'는 이 엔드포인트에서 지원되지 않습니다.")

def generate_layout_from_json(scene: Scene, img_size=(1024, 1024)) -> bytes:
    """
    JSON 좌표 기반 정밀 2D 레이아웃 생성 - composite와 완전히 동일한 좌표계 사용
    """
    image = Image.new("RGB", img_size, "white")
    draw = ImageDraw.Draw(image)

    room_width_3d = scene.room.width
    room_depth_3d = scene.room.depth

    padding = 80  # composite와 동일한 패딩
    drawable_width = img_size[0] - 2 * padding
    drawable_height = img_size[1] - 2 * padding
    
    # composite와 완전히 동일한 스케일링
    scale_x = drawable_width / room_width_3d if room_width_3d > 0 else 1
    scale_y = drawable_height / room_depth_3d if room_depth_3d > 0 else 1
    scale = min(scale_x, scale_y)

    # 방 경계선 그리기
    room_left = padding
    room_top = padding
    room_right = padding + room_width_3d * scale
    room_bottom = padding + room_depth_3d * scale
    draw.rectangle([room_left, room_top, room_right, room_bottom], outline="black", width=3)

    # 한국식 인테리어에 맞는 자연스러운 색상
    colors = {
        "bed": "#D2B48C", "desk": "#8B7355", "chair": "#A0522D",
        "sofa": "#CD853F", "table": "#DEB887", "wardrobe": "#BC9A6A",
        "default": "#D2B48C"
    }

    print(f"[Layout] 방 크기: {room_width_3d:.1f}x{room_depth_3d:.1f}, 통일 스케일: {scale:.4f}")

    # 가구 그리기 (바닥 평면 X,Z만 사용, Y축 높이 무시)
    for item in scene.objects:
        center_x = padding + item.position[0] * scale  # X 그대로  
        center_y = padding + item.position[2] * scale  # Z를 Y로
        size_x = item.size[0] * scale
        size_y = item.size[2] * scale
        
        left = center_x - size_x / 2
        top = center_y - size_y / 2
        right = center_x + size_x / 2
        bottom = center_y + size_y / 2
        
        color = colors.get(item.type.lower(), colors["default"])
        # 더 부드러운 테두리로 자연스러운 느낌
        draw.rectangle([left, top, right, bottom], fill=color, outline="#8B4513", width=1)
        print(f"[Layout] {item.name}({item.type}): 중심({center_x:.1f},{center_y:.1f}), 크기({size_x:.1f}x{size_y:.1f})")

    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    return img_byte_arr.getvalue()

def canny_from_bytes(img_bytes: bytes, low=80, high=160) -> bytes:
    """
    Canny edge detection from image bytes
    """
    arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    edges = cv2.Canny(img, low, high)
    edges_rgb = cv2.cvtColor(edges, cv2.COLOR_GRAY2RGB)
    ok, buf = cv2.imencode(".png", edges_rgb)
    if not ok:
        raise RuntimeError("Canny encode failed")
    return bytes(buf)

def overlay_images(base_png_bytes: bytes, overlay_png_bytes: bytes, alpha: float = 0.6) -> bytes:
    """
    Alpha blending of two images
    """
    base = Image.open(io.BytesIO(base_png_bytes)).convert("RGBA")
    over = Image.open(io.BytesIO(overlay_png_bytes)).convert("RGBA")
    over = over.resize(base.size, Image.LANCZOS)
    
    # Alpha 채널 조정
    channels = over.split()
    if len(channels) >= 3:
        r, g, b = channels[0], channels[1], channels[2]
        alpha_channel = Image.new("L", over.size, int(alpha * 255))
        over = Image.merge("RGBA", (r, g, b, alpha_channel))
    
    out = Image.alpha_composite(base, over)
    buf = io.BytesIO()
    out.save(buf, format="PNG")
    return buf.getvalue()

@app.post("/api/realistic-room-advanced-composite", response_model=I2IResponse)
async def realistic_room_advanced_composite(
    scene_json: str = Form(...),
    capture: UploadFile = File(...),
    style: str = Form("scandinavian"),
    control: str = Form("canny"),
    alpha: float = Form(0.6),
    provider: str = Form("flux"),
    mode: str = Form("strict")
):
    """
    고급 Composite 시스템: JSON 레이아웃 + 스크린샷 + ControlNet
    완벽한 가구 배치 보존을 위한 3단계 처리
    """
    request_id = str(uuid.uuid4())[:8]
    try:
        scene = Scene.model_validate_json(scene_json)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"JSON 파싱 오류: {e}")

    print(f"[Advanced-Composite] 요청 ID: {request_id}, 제공자: {provider}, 컨트롤: {control}, 알파: {alpha}")

    # 1) JSON에서 정확한 2D 레이아웃 생성
    layout_bytes = generate_layout_from_json(scene)
    
    # 2) 스크린샷 전처리
    cap_bytes = await capture.read()
    
    # 3) ControlNet 전처리 (선택적)
    if control.lower() == "canny":
        cond_bytes = canny_from_bytes(cap_bytes)
        print(f"[Advanced-Composite] Canny edge detection 완료")
    else:
        cond_bytes = cap_bytes

    # 4) 고급 합성: 레이아웃 + 조건부 이미지
    composite_bytes = overlay_images(layout_bytes, cond_bytes, alpha=alpha)

    # 5) 중간 결과 저장 (디버깅용)
    save_image(layout_bytes, 'uploads', f"{request_id}_layout.png")
    save_image(cond_bytes, 'uploads', f"{request_id}_{control}.png")
    save_image(composite_bytes, 'uploads', f"{request_id}_composite.png")

    # 6) AI 파이프라인 실행
    furniture_list = [obj.type for obj in scene.objects]
    prompt_text, negative_text = build_prompt(provider=provider, style_key=style, mode=mode, furniture_list=furniture_list)
    print(f"[Advanced-Composite] 프롬프트: {prompt_text[:100]}...")
    
    if provider == "flux":
        final_image_url = await run_pipeline_controlnet_to_flux(
            composite_bytes, prompt_text, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
        )
    elif provider == "vertex":
        final_image_url = await run_pipeline_replicate_to_vertex(
            composite_bytes, style, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
        )
    elif provider == "replicate":
        controlnet_urls = await call_replicate_controlnet_structure(
            composite_bytes, prompt_text, DEFAULT_STRENGTH, DEFAULT_GUIDANCE, structure="depth"
        )
        if controlnet_urls:
            async with httpx.AsyncClient() as client:
                resp = await client.get(controlnet_urls[0])
                if resp.status_code == 200:
                    img_b64 = base64.b64encode(resp.content).decode()
                    final_image_url = f"data:image/png;base64,{img_b64}"
                else:
                    raise HTTPException(500, f"이미지 다운로드 실패: {resp.status_code}")
        else:
            raise HTTPException(500, "ControlNet 처리 실패")
    elif provider == "stability":
        stability_urls = await call_replicate_stability_sdxl(
            composite_bytes, prompt_text, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
        )
        if stability_urls:
            async with httpx.AsyncClient() as client:
                resp = await client.get(stability_urls[0])
                if resp.status_code == 200:
                    img_b64 = base64.b64encode(resp.content).decode()
                    final_image_url = f"data:image/png;base64,{img_b64}"
                else:
                    raise HTTPException(500, f"이미지 다운로드 실패: {resp.status_code}")
        else:
            raise HTTPException(500, "Stability 처리 실패")
    else:
        raise HTTPException(400, f"지원하지 않는 제공자: {provider}")
    
    # 7) 최종 결과 저장
    if final_image_url:
        save_generated_image(final_image_url, f"{provider}_advanced_composite", request_id)
    
    return {"images": [final_image_url]}

@app.post("/api/realistic-room-korean", response_model=I2IResponse)
async def realistic_room_korean_style(
    scene_json: str = Form(...),
    capture: UploadFile = File(...),
    provider: str = Form("vertex"),
    layout_preservation: str = Form("strict")  # "strict" | "ultra_strict"
):
    """
    한국식 인테리어 전용 엔드포인트 - 가구 배치 절대 보존
    """
    request_id = str(uuid.uuid4())[:8]
    try:
        scene = Scene.model_validate_json(scene_json)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"JSON 파싱 오류: {e}")

    print(f"[Korean-Style] 요청 ID: {request_id}, 제공자: {provider}, 보존 레벨: {layout_preservation}")

    try:
        cap_bytes = await capture.read()
        composite_bytes = composite_images_crop_paste(scene, cap_bytes)
    except Exception as e:
        print(f"[Korean-Style] 합성 오류: {e}")
        raise HTTPException(status_code=500, detail=f"합성 오류: {e}")

    # 중간 파일 저장
    save_image(cap_bytes, 'uploads', f"{request_id}_korean_capture.png")
    save_image(composite_bytes, 'uploads', f"{request_id}_korean_composite.png")

    try:
        # 한국식 인테리어 전용 프롬프트
        if layout_preservation == "ultra_strict":
            korean_prompt = (
                "Transform to natural Korean-style interior. ABSOLUTE FURNITURE PRESERVATION: "
                "Keep EXACT positions, sizes, and orientations of all furniture items. "
                "Korean minimalist aesthetic: warm wood tones, clean white walls, natural lighting. "
                "Simple fabric textures, minimal decoration, calm atmosphere. "
                "NO moving furniture, NO adding objects, NO removing items. "
                "Natural indoor lighting, subtle shadows, realistic materials only."
            )
            strength = 0.5  # 매우 낮은 변형률
            guidance = 6    # 낮은 가이던스로 자연스러운 결과
        else:
            # 기본 strict 모드
            furniture_list = [obj.type for obj in scene.objects]
            prompt_text, _ = build_prompt(provider=provider, style_key="korean_modern", mode="strict", furniture_list=furniture_list)
            korean_prompt = prompt_text
            strength = 0.6
            guidance = 8
        
        print(f"[Korean-Style] 프롬프트: {korean_prompt[:100]}...")
        
        if provider == "vertex":
            final_image_url = await run_pipeline_replicate_to_vertex(
                composite_bytes, "korean_modern", strength, guidance, korean_prompt
            )
        elif provider == "flux":
            final_image_url = await run_pipeline_controlnet_to_flux(
                composite_bytes, korean_prompt, strength, guidance
            )
        elif provider == "replicate":
            controlnet_urls = await call_replicate_controlnet_structure(
                composite_bytes, korean_prompt, strength, guidance, structure="depth"
            )
            if controlnet_urls:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(controlnet_urls[0])
                    if resp.status_code == 200:
                        img_b64 = base64.b64encode(resp.content).decode()
                        final_image_url = f"data:image/png;base64,{img_b64}"
                    else:
                        raise HTTPException(500, f"이미지 다운로드 실패: {resp.status_code}")
            else:
                raise HTTPException(500, "ControlNet 처리 실패")
        else:
            raise HTTPException(400, f"지원하지 않는 제공자: {provider}")
        
        if final_image_url:
            save_generated_image(final_image_url, f"{provider}_korean_style", request_id)
        
        return {"images": [final_image_url]}
        
    except Exception as e:
        print(f"[Korean-Style] 처리 실패 - 요청 ID: {request_id}, 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- V2 HYBRID IMPLEMENTATION (Corrected) ---

def create_hybrid_input_image(scene_json_str: str, capture_bytes: bytes, output_size=(1024, 1024)) -> bytes:
    """
    Generates a hybrid image by overlaying a Canny edge map from the capture
    onto a 2D layout generated from JSON. This provides clear structure and
    style hints to the AI model.
    """
    scene_data = json.loads(scene_json_str)
    if 'scene' not in scene_data:
        scene_data = {'scene': scene_data}
    
    # We need the Scene model to pass to generate_layout_from_json
    scene_model = Scene.model_validate(scene_data['scene'])

    # 1. Generate the base 2D layout from JSON (Structure)
    layout_bytes = generate_layout_from_json(scene_model, img_size=output_size)

    # 2. Generate Canny edge map from the capture image (Style Hint)
    canny_bytes = canny_from_bytes(capture_bytes)

    # 3. Overlay the Canny map onto the layout image
    # The layout provides the solid blocks, the canny map provides texture/detail hints
    hybrid_image_bytes = overlay_images(layout_bytes, canny_bytes, alpha=0.5)
    
    return hybrid_image_bytes


@app.post("/api/v2/generate-room", response_model=I2IResponse)
async def generate_room_v2(
    scene_json: str = Form(...),
    capture: UploadFile = File(...),
    style: str = Form("korean_modern"),
    provider: str = Form("flux")
):
    """
    V2 endpoint using the 'Hybrid Input Image' strategy for superior layout preservation.
    """
    request_id = str(uuid.uuid4())[:8]
    print(f"[V2] Request received: {request_id}, Style: {style}, Provider: {provider}")

    try:
        # 1. Generate the hybrid input image using the corrected logic
        capture_bytes = await capture.read()
        hybrid_image_bytes = create_hybrid_input_image(scene_json, capture_bytes)
        
        save_image(hybrid_image_bytes, 'uploads', f"{request_id}_v2_hybrid_input.png")
        print(f"[V2] Hybrid input image created for request {request_id}")

        # 2. Build a prompt focused on style, as layout is handled by the image
        scene_data = json.loads(scene_json)
        if 'scene' not in scene_data:
            scene_data = {'scene': scene_data}
        scene_model = Scene.model_validate(scene_data['scene'])
        furniture_list = [obj.type for obj in scene_model.objects]
        
        prompt_text, _ = build_prompt(
            provider=provider, 
            style_key=style, 
            mode="strict", 
            furniture_list=furniture_list
        )
        print(f"[V2] Using prompt: {prompt_text}")

        # 3. Execute the recommended AI Pipeline
        if provider == "flux":
            final_image_url = await run_pipeline_controlnet_to_flux(
                hybrid_image_bytes, prompt_text, strength=0.7, guidance=8
            )
        elif provider == "vertex":
            final_image_url = await run_pipeline_replicate_to_vertex(
                hybrid_image_bytes, style, strength=0.6, guidance=10
            )
        else:
            raise HTTPException(status_code=400, detail=f"Provider '{provider}' is not yet supported in V2.")

        if not final_image_url:
            raise HTTPException(500, "Image generation failed, no URL returned.")

        # 4. Save and return the final image
        save_generated_image(final_image_url, f"{provider}_v2_final", request_id)
        print(f"[V2] Final image for request {request_id} has been saved.")

        return {"images": [final_image_url]}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"V2 pipeline error: {str(e)}")


@app.get("/healthz")
async def healthz():
    return {"ok": True}


@app.post("/api/interior-style-transfer", response_model=I2IResponse)
async def interior_style_transfer(
    image: UploadFile = File(...),
    style: str = Form("modern"),
    provider: str = Form("flux")
):
    """
    3D 렌더링 이미지의 인테리어 스타일을 변환합니다. (실사화 X)
    """
    request_id = str(uuid.uuid4())[:8]
    img_bytes = await image.read()
    
    save_image(img_bytes, 'uploads', f"{request_id}_style_transfer_input.png")
    print(f"[Style-Transfer] Request ID: {request_id}, Provider: {provider}, Style: {style}")
    
    try:
        # 스타일 변환에 특화된 프롬프트 빌더 사용
        prompt_text = build_style_transfer_prompt(style_key=style)
        print(f"[Style-Transfer] Generated Prompt: {prompt_text}")
        
        if provider == "flux":
            final_image_url = await run_pipeline_controlnet_to_flux(
                img_bytes, prompt_text, strength=0.8, guidance=8
            )
        elif provider == "vertex":
            final_image_url = await run_pipeline_replicate_to_vertex(
                img_bytes, style, strength=0.7, guidance=10
            )
        else:
            # 기본적으로 Replicate ControlNet 사용
            controlnet_urls = await call_replicate_controlnet_structure(
                img_bytes, prompt_text, strength=0.85, guidance=9, structure="depth"
            )
            if controlnet_urls:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(controlnet_urls[0])
                    if resp.status_code == 200:
                        img_b64 = base64.b64encode(resp.content).decode()
                        final_image_url = f"data:image/png;base64,{img_b64}"
                    else:
                        raise HTTPException(500, f"Image download failed: {resp.status_code}")
            else:
                raise HTTPException(500, "ControlNet processing failed")

        if final_image_url:
            save_generated_image(final_image_url, f"{provider}_style_transfer", request_id)
        
        return {"images": [final_image_url]}
        
    except Exception as e:
        print(f"[Style-Transfer] Failed - Request ID: {request_id}, Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

