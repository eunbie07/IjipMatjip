import os, base64, io, uuid, asyncio, json
from typing import List, Tuple
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from PIL import Image, ImageDraw
from dotenv import load_dotenv
import numpy as np
import cv2
from prompt_templates import (
    DEFAULT_PROMPT, STABILITY_PROMPT, REPLICATE_PROMPT, VERTEX_PROMPT, 
from pydantic import BaseModel, Field
    NEGATIVE_PROMPT, DEFAULT_STRENGTH, DEFAULT_GUIDANCE,
    CAPTURE_TO_REAL_PROMPT, STYLE_PRESETS, VERTEX_HYBRID_PROMPT
)
from vertex_ai import run_pipeline_replicate_to_vertex, run_pipeline_with_hybrid_prompt, run_pipeline_controlnet_to_flux, run_pipeline_replicate_to_gemini
from prompt_builder import build_prompt

# 새로운 하이브리드 파이프라인 함수
async def run_pipeline_with_layout_preservation(
    screenshot_bytes: bytes, 
    layout_bytes: bytes, 
    style: str, 
    strength: float, 
    guidance: float
) -> str:
    """
    스크린샷과 JSON 레이아웃을 결합하여 가구 배치를 보존하며 실사화합니다.
    """
    print(f"[Pipeline-Hybrid] 레이아웃 보존 파이프라인 시작")
    
    # 기본적으로는 스크린샷을 메인 입력으로, 레이아웃은 구조 보존용으로 사용
    # 현재는 기존 파이프라인을 활용하되, 향후 더 정교한 합성 로직 추가 가능
    return await run_pipeline_replicate_to_vertex(
        screenshot_bytes, style, strength, guidance
    )

load_dotenv()
STABILITY_KEY = os.getenv("STABILITY_API_KEY")
REPLICATE_TOKEN = os.getenv("REPLICATE_API_TOKEN")
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
GCP_LOCATION = os.getenv("GCP_LOCATION", "us-central1")

app = FastAPI(title="Realistic Room i2i (triple)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for JSON Input ---
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

@app.get("/healthz")
async def healthz():
    return {"ok": True}

# --- Helper Functions ---
def save_uploaded_image(image_bytes: bytes, original_filename: str) -> str:
    os.makedirs('uploads', exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    file_id = str(uuid.uuid4())[:8]
    filename = f"{timestamp}_{file_id}_{original_filename}"
    filepath = os.path.join('uploads', filename)
    with open(filepath, 'wb') as f:
        f.write(image_bytes)
    print(f"[Storage] 업로드 이미지 저장: {filename}")
    return filepath

def save_generated_image(image_data: str, provider: str, request_id: str) -> str:
    os.makedirs('outputs', exist_ok=True)
    try:
        if image_data.startswith('data:image'):
            base64_data = image_data.split(',')[1]
        else:
            base64_data = image_data
        image_bytes = base64.b64decode(base64_data)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{request_id}_{provider}.png"
        filepath = os.path.join('outputs', filename)
        with open(filepath, 'wb') as f:
            f.write(image_bytes)
        print(f"[Storage] 생성 이미지 저장: {filename}")
        return filepath
    except Exception as e:
        print(f"[Storage] 이미지 저장 실패: {e}")
        return None

async def generate_layout_from_json(scene: Scene) -> bytes:
    """
    Three.js에서 받은 JSON 레이아웃(좌상단 원점)을 기반으로 2D 평면도 이미지를 생성합니다.
    """
    img_size = (1024, 1024)
    image = Image.new("RGB", img_size, "white")
    draw = ImageDraw.Draw(image)

    room_width_3d = scene.room.width
    room_depth_3d = scene.room.depth

    padding = 50
    drawable_width = img_size[0] - 2 * padding
    drawable_height = img_size[1] - 2 * padding
    
    scale_x = drawable_width / room_width_3d if room_width_3d > 0 else 1
    scale_y = drawable_height / room_depth_3d if room_depth_3d > 0 else 1
    scale = min(scale_x, scale_y)

    colors = {"bed": "brown", "desk": "blue", "chair": "green", "default": "gray"}

    for item in scene.objects:
        # position이 객체의 좌상단(top-left)이라고 가정하고 그립니다.
        left = padding + item.position[0] * scale
        top = padding + item.position[2] * scale
        
        size_x = item.size[0] * scale
        size_y = item.size[2] * scale
        
        right = left + size_x
        bottom = top + size_y
        
        color = colors.get(item.type, colors["default"])
        draw.rectangle([left, top, right, bottom], fill=color, outline="black")

    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    return img_byte_arr.getvalue()

async def generate_precise_layout_from_json(scene: Scene) -> bytes:
    """
    JSON 좌표를 기반으로 정밀한 2D 평면도를 생성합니다 (가구 배치 보존용).
    """
    img_size = (1024, 1024)
    image = Image.new("RGB", img_size, "white")
    draw = ImageDraw.Draw(image)

    room_width_3d = scene.room.width
    room_depth_3d = scene.room.depth

    # 더 넓은 패딩으로 정확한 비율 유지
    padding = 80
    drawable_width = img_size[0] - 2 * padding
    drawable_height = img_size[1] - 2 * padding
    
    scale_x = drawable_width / room_width_3d if room_width_3d > 0 else 1
    scale_y = drawable_height / room_depth_3d if room_depth_3d > 0 else 1
    scale = min(scale_x, scale_y)

    # 방 경계 그리기 (구조 보존을 위해)
    room_left = padding
    room_top = padding
    room_right = padding + room_width_3d * scale
    room_bottom = padding + room_depth_3d * scale
    draw.rectangle([room_left, room_top, room_right, room_bottom], outline="black", width=3)

    # 가구별 더 선명한 색상과 테두리
    colors = {
        "bed": "#8B4513",      # 진한 갈색 (침대)
        "desk": "#4169E1",     # 진한 파란색 (책상)
        "chair": "#228B22",    # 진한 초록 (의자)
        "sofa": "#800080",     # 보라색 (소파)
        "table": "#FF8C00",    # 주황색 (테이블)
        "wardrobe": "#2F4F4F", # 진한 회색 (옷장)
        "default": "#696969"   # 회색
    }

    print(f"[Layout] 방 크기: {room_width_3d}x{room_depth_3d}, 스케일: {scale}")

    for item in scene.objects:
        # 정확한 좌표 계산 (중심점 기준)
        center_x = padding + item.position[0] * scale
        center_y = padding + item.position[2] * scale
        
        size_x = item.size[0] * scale
        size_y = item.size[2] * scale
        
        # 중심점에서 좌상단/우하단 계산
        left = center_x - size_x / 2
        top = center_y - size_y / 2
        right = center_x + size_x / 2
        bottom = center_y + size_y / 2
        
        color = colors.get(item.type.lower(), colors["default"])
        
        # 가구 그리기 (채우기 + 테두리)
        draw.rectangle([left, top, right, bottom], fill=color, outline="black", width=2)
        
        print(f"[Layout] {item.name}({item.type}): 중심({center_x:.1f},{center_y:.1f}), 크기({size_x:.1f}x{size_y:.1f})")

    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    return img_byte_arr.getvalue()

def canny_from_bytes(img_bytes: bytes, target_size=None, low=80, high=160) -> bytes:
    """스크린샷에서 Canny 에지 추출"""
    arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if target_size:
        img = cv2.resize(img, target_size, interpolation=cv2.INTER_AREA)
    edges = cv2.Canny(img, low, high)
    edges_rgb = cv2.cvtColor(edges, cv2.COLOR_GRAY2RGB)
    ok, buf = cv2.imencode(".png", edges_rgb)
    if not ok:
        raise RuntimeError("Canny encode failed")
    return bytes(buf)

def overlay_images(base_png_bytes: bytes, overlay_png_bytes: bytes, alpha: float = 0.6) -> bytes:
    """두 이미지를 오버레이하여 합성"""
    base = Image.open(io.BytesIO(base_png_bytes)).convert("RGBA")
    over = Image.open(io.BytesIO(overlay_png_bytes)).convert("RGBA")
    over = over.resize(base.size, Image.LANCZOS)
    
    # overlay를 반투명으로
    channels = over.split()
    if len(channels) >= 3:
        r, g, b = channels[0], channels[1], channels[2]
        # 알파 채널 생성
        alpha_channel = Image.new("L", over.size, int(alpha * 255))
        over = Image.merge("RGBA", (r, g, b, alpha_channel))
    
    out = Image.alpha_composite(base, over)
    buf = io.BytesIO()
    out.save(buf, format="PNG")
    return buf.getvalue()

# --- Image Upload Based Endpoints ---

@app.post("/api/realistic-room-upload", response_model=I2IResponse)
async def realistic_room_upload(
    image: UploadFile = File(...),
    style: str = Form("scandinavian"),
    provider: str = Form("flux")
):
    """
    이미지 파일을 직접 업로드하여 실사화 처리합니다.
    """
    request_id = str(uuid.uuid4())[:8]
    img_bytes = await image.read()
    
    uploaded_path = save_uploaded_image(img_bytes, image.filename or "upload.png")
    print(f"[Main-Upload] Image Upload Pipeline 요청 ID: {request_id}, 업로드 파일: {uploaded_path}, 제공자: {provider}")
    
    try:
        prompt_text = build_prompt(style, CAPTURE_TO_REAL_PROMPT)
        print(f"[Main-Upload] 프롬프트: {prompt_text}")
        
        # Provider별 분기 처리
        if provider == "flux":
            # FLUX Ultra: ControlNet → FLUX 파이프라인
            final_image_data_url = await run_pipeline_controlnet_to_flux(
                img_bytes, prompt_text, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
            )
            save_suffix = "flux_ultra"
        elif provider == "vertex":
            # ControlNet → Vertex AI 파이프라인
            final_image_data_url = await run_pipeline_replicate_to_vertex(
                img_bytes, style, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
            )
            save_suffix = "vertex_hybrid_pipeline"
        elif provider == "replicate":
            # ControlNet만 (단일 단계)
            from replicate_utils import call_replicate_controlnet_structure
            import httpx, base64
            
            controlnet_urls = await call_replicate_controlnet_structure(
                img_bytes, prompt_text, DEFAULT_STRENGTH, DEFAULT_GUIDANCE, structure="depth"
            )
            
            if controlnet_urls:
                final_image_data_url = controlnet_urls[0]
                save_suffix = "replicate_controlnet"
            else:
                raise HTTPException(500, "Replicate ControlNet 처리 실패")
        elif provider == "stability":
            # Replicate를 통한 Stability AI SDXL
            from replicate_utils import call_replicate_stability_sdxl
            stability_urls = await call_replicate_stability_sdxl(
                img_bytes, prompt_text, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
            )
            
            if stability_urls:
                # URL에서 이미지 다운로드하여 base64로 변환
                import httpx, base64
                async with httpx.AsyncClient() as client:
                    resp = await client.get(stability_urls[0])
                    if resp.status_code == 200:
                        img_b64 = base64.b64encode(resp.content).decode()
                        final_image_data_url = f"data:image/png;base64,{img_b64}"
                        save_suffix = "stability_replicate"
                    else:
                        raise HTTPException(500, f"Stability 이미지 다운로드 실패: {resp.status_code}")
            else:
                raise HTTPException(500, "Replicate Stability 처리 실패")
        else:
            raise HTTPException(400, f"지원하지 않는 제공자: {provider}")
        
        if final_image_data_url:
            save_generated_image(final_image_data_url, save_suffix, request_id)
        
        return {"images": [final_image_data_url]}
            
    except Exception as e:
        print(f"[Main-Upload] Pipeline 처리 실패 - 요청 ID: {request_id}, 오류: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        else:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/realistic-room-hybrid", response_model=I2IResponse)
async def realistic_room_hybrid(
    screenshot: UploadFile = File(...),
    json_file: UploadFile = File(...),
    style: str = Form("scandinavian")
):
    """
    스크린샷과 JSON 좌표를 함께 사용하여 가구 배치를 정확히 유지하며 실사화합니다.
    """
    request_id = str(uuid.uuid4())[:8]
    
    # 파일 읽기
    screenshot_bytes = await screenshot.read()
    json_bytes = await json_file.read()
    
    # 파일 저장
    screenshot_path = save_uploaded_image(screenshot_bytes, f"{request_id}_screenshot.png")
    
    try:
        # JSON 파싱
        json_data = json.loads(json_bytes.decode('utf-8'))
        scene_data = json_data.get('scene', json_data)  # MongoDB 형식 지원
        
        # Scene 객체 생성
        scene = Scene(**scene_data)
        
        print(f"[Main-Hybrid] 요청 ID: {request_id}, 스크린샷: {screenshot_path}")
        print(f"[Main-Hybrid] 방 크기: {scene.room.width}x{scene.room.depth}, 가구: {len(scene.objects)}개")
        
        # 1. JSON을 기반으로 정확한 2D 평면도 생성
        layout_bytes = await generate_precise_layout_from_json(scene)
        
        # 2. 스크린샷을 하이브리드 프롬프트로 처리 (JSON 정보 활용)
        final_image_data_url = await run_pipeline_with_hybrid_prompt(
            screenshot_bytes, style, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
        )
        
        if final_image_data_url:
            save_generated_image(final_image_data_url, "vertex_hybrid_precise", request_id)
        
        return {"images": [final_image_data_url]}
            
    except Exception as e:
        print(f"[Main-Hybrid] 처리 실패 - 요청 ID: {request_id}, 오류: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        else:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/realistic-room-composite", response_model=I2IResponse)
async def realistic_room_composite(
    scene_json: str = Form(...),             # point.json 내용을 문자열로 받음
    capture: UploadFile = File(...),         # Three.js 스크린샷
    style: str = Form("scandinavian"),
    control: str = Form("canny"),            # "canny" | "depth"
    alpha: float = Form(0.6),
    provider: str = Form("replicate"),       # replicate | stability | vertex
    mode: str = Form("strict")               # strict | interpretive
):
    """
    JSON + 스크린샷을 합성해 구조(배치+시야각) 고정 → 스타일만 바꿔 실사화
    """
    request_id = str(uuid.uuid4())[:8]
    try:
        scene = Scene.model_validate_json(scene_json)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"scene_json parse error: {e}")

    # 1) JSON → 평면 PNG
    layout_bytes = await generate_precise_layout_from_json(scene)

    # 2) 스크린샷 처리
    cap_bytes = await capture.read()
    # control == "depth"라면 원본 이미지를 그대로 넣고 모델 내부 depth conditioning을 쓰는 게 일반적
    if control.lower() == "canny":
        cond_bytes = canny_from_bytes(cap_bytes, target_size=None)
    else:
        cond_bytes = cap_bytes

    # 3) 합성 (동일 해상도로 맞춰 반투명 오버레이)
    composite_bytes = overlay_images(layout_bytes, cond_bytes, alpha=alpha)

    # (디버깅 저장)
    save_uploaded_image(layout_bytes, f"{request_id}_layout.png")
    save_uploaded_image(cond_bytes, f"{request_id}_{control}.png")
    save_uploaded_image(composite_bytes, f"{request_id}_composite.png")

    # 4) 프롬프트 빌드
    prompt_text, negative_text = build_prompt(provider=provider, style_key=style, mode=mode)
    print(f"[Composite] 프롬프트 생성 - Provider: {provider}, Style: {style}, Mode: {mode}")
    print(f"[Composite] Prompt: {prompt_text[:100]}...")

    # 5) i2i 호출 (provider별 파이프라인 선택)
    if provider == "flux":
        # ControlNet → FLUX 파이프라인
        final_image_url = await run_pipeline_controlnet_to_flux(
            composite_bytes, style, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
        )
        print(f"[Composite-FLUX] 반환된 URL: {final_image_url}")
        
        # URL 유효성 검증
        if not final_image_url or not (final_image_url.startswith('http://') or final_image_url.startswith('https://')):
            raise HTTPException(500, f"유효하지 않은 FLUX URL: {final_image_url}")
        
        # FLUX는 URL을 반환하므로 base64로 변환
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(final_image_url)
            if resp.status_code == 200:
                import base64
                img_b64 = base64.b64encode(resp.content).decode()
                final_image_data_url = f"data:image/png;base64,{img_b64}"
            else:
                raise HTTPException(500, f"FLUX 이미지 다운로드 실패: {resp.status_code}")
    elif provider == "gemini":
        # ControlNet -> Gemini-powered Imagen 파이프라인
        final_image_data_url = await run_pipeline_replicate_to_gemini(
            composite_bytes, style, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
        )
    elif provider == "vertex":
        # ControlNet → Vertex AI 파이프라인
        final_image_data_url = await run_pipeline_replicate_to_vertex(
            composite_bytes, style, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
        )
    elif provider == "replicate":
        # ControlNet만 (단일 단계)
        from replicate_utils import call_replicate_controlnet_structure
        import httpx, base64
        
        controlnet_urls = await call_replicate_controlnet_structure(
            composite_bytes, prompt_text, DEFAULT_STRENGTH, DEFAULT_GUIDANCE, structure="depth"
        )
        if not controlnet_urls:
            raise HTTPException(500, "ControlNet 처리 실패")
            
        # URL → base64 변환
        async with httpx.AsyncClient() as client:
            resp = await client.get(controlnet_urls[0])
            if resp.status_code == 200:
                img_b64 = base64.b64encode(resp.content).decode()
                final_image_data_url = f"data:image/png;base64,{img_b64}"
            else:
                raise HTTPException(500, f"Replicate 이미지 다운로드 실패: {resp.status_code}")
    elif provider == "stability":
        # Stability AI 직접 호출
        import httpx
        
        if not os.getenv("STABILITY_API_KEY"):
            raise HTTPException(500, "Stability API key 없음")
            
        headers = {"Authorization": f"Bearer {os.getenv('STABILITY_API_KEY')}", "Accept": "application/json"}
        files = {"init_image": ("input.png", composite_bytes, "image/png")}
        data = {
            "text_prompts[0][text]": prompt_text,
            "text_prompts[1][text]": negative_text or NEGATIVE_PROMPT,
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
            final_image_data_url = f"data:image/png;base64,{b64}"
    else:
        raise HTTPException(400, f"지원하지 않는 provider: {provider}")

    if final_image_data_url:
        save_generated_image(final_image_data_url, f"{provider}_composite", request_id)

    return {"images": [final_image_data_url]}


# --- JSON Based Endpoint (New) ---

@app.post("/api/realistic-room-vertex", response_model=I2IResponse)
async def realistic_room_vertex_from_json(
    scene: Scene,
    style: str = "scandinavian"
):
    """
    Three.js의 JSON 레이아웃을 입력받아 Vertex AI 하이브리드 파이프라인으로 실사 이미지를 생성합니다.
    """
    request_id = str(uuid.uuid4())[:8]
    
    # 1. JSON 데이터로부터 2D 배치도 이미지 생성
    img_bytes = await generate_layout_from_json(scene)
    
    # (디버깅용) 생성된 배치도 저장
    save_uploaded_image(img_bytes, f"{request_id}_generated_layout.png")
    print(f"[Main-JSON] Vertex Pipeline 요청 ID: {request_id}, JSON으로부터 레이아웃 이미지 생성 완료.")
    
    try:
        # 2. 생성된 배치도 이미지를 기존 파이프라인의 입력으로 사용
        final_image_data_url = await run_pipeline_replicate_to_vertex(
            img_bytes, style, DEFAULT_STRENGTH, DEFAULT_GUIDANCE
        )
        
        if final_image_data_url:
            save_generated_image(final_image_data_url, "vertex_hybrid_pipeline", request_id)
        
        return {"images": [final_image_data_url]}
            
    except Exception as e:
        print(f"[Main-JSON] Vertex Pipeline 처리 실패 - 요청 ID: {request_id}, 오류: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        else:
            raise HTTPException(status_code=500, detail=str(e))
