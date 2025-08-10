import os, base64, io, uuid, asyncio
from datetime import datetime
from fastapi import HTTPException
from PIL import Image
import httpx
from dotenv import load_dotenv

load_dotenv()
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
GCP_LOCATION = os.getenv("GCP_LOCATION", "us-central1")

def save_generated_image(image_data: str, provider: str, request_id: str) -> str:
    """생성된 이미지를 저장 (base64 data URL에서)"""
    # outputs 폴더 생성
    os.makedirs('outputs', exist_ok=True)
    
    try:
        # data:image/png;base64, 부분 제거
        if image_data.startswith('data:image'):
            base64_data = image_data.split(',')[1]
        else:
            base64_data = image_data
        
        # base64 디코딩
        image_bytes = base64.b64decode(base64_data)
        
        # 파일명 생성
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{request_id}_{provider}.png"
        filepath = os.path.join('outputs', filename)
        
        # 파일 저장
        with open(filepath, 'wb') as f:
            f.write(image_bytes)
        
        print(f"[Storage] 생성 이미지 저장: {filename}")
        return filepath
        
    except Exception as e:
        print(f"[Storage] 이미지 저장 실패: {e}")
        return None

async def call_vertex_imagen3(image_bytes: bytes, prompt: str, strength: float, guidance: float, resize_image_for_sdxl=None) -> str:
    """Vertex AI Imagen 모델을 호출하여 이미지 생성 (입력 이미지 구조 유지를 위해 strength 조정)"""
    # resize_image_for_sdxl 함수가 전달되지 않은 경우 main에서 import
    if resize_image_for_sdxl is None:
        from utils import resize_image_for_sdxl
    
    key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not key_path or not GCP_PROJECT_ID:
        raise HTTPException(500, "GCP_PROJECT_ID 또는 GOOGLE_APPLICATION_CREDENTIALS 환경변수가 설정되지 않았습니다.")

    try:
        from google.auth.transport.requests import Request
        from google.oauth2 import service_account
        
        print(f"[Vertex] 서비스 계정 키 파일 인증 시도: {key_path}")
        credentials = service_account.Credentials.from_service_account_file(
            key_path, scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        credentials.refresh(Request())
        token = credentials.token
        project_id = GCP_PROJECT_ID
        print(f"[Vertex] 인증 성공 - 프로젝트: {project_id}")

    except Exception as e:
        raise HTTPException(500, f"Vertex AI 인증 오류: {e}. 키 파일 경로와 권한을 확인하세요.")

    model_name = "imagegeneration@006"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    resized_image_bytes = resize_image_for_sdxl(image_bytes)
    b64_img = base64.b64encode(resized_image_bytes).decode()
    
    pil_image = Image.open(io.BytesIO(resized_image_bytes))
    mask_image = Image.new('L', pil_image.size, 255)
    
    mask_buffer = io.BytesIO()
    mask_image.save(mask_buffer, format="PNG")
    mask_b64 = base64.b64encode(mask_buffer.getvalue()).decode()
    print("[Vertex] 전체 이미지 영역을 포함하는 흰색 마스크 생성 완료.")

    endpoint = f"https://{GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{GCP_LOCATION}/publishers/google/models/{model_name}:predict"
    
    # 파라미터 수정: strength를 낮춰 입력 이미지의 구조를 더 존중하도록 함
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
    
    print(f"[Vertex] {model_name} 모델 호출 중 (strength={strength}, guidance={guidance})...")
    
    try:
        async with httpx.AsyncClient(timeout=180) as client:
            r = await client.post(endpoint, headers=headers, json=body)
            
            if r.status_code >= 400:
                error_text = r.text
                print(f"[Vertex] API 오류: {r.status_code} - {error_text}")
                raise HTTPException(500, f"Vertex AI API 오류: {error_text}")
            
            resp = r.json()
            if "predictions" not in resp or not resp["predictions"]:
                 raise HTTPException(500, f"Vertex AI 응답에 'predictions'가 없습니다: {resp}")

            img_base64 = resp["predictions"][0]["bytesBase64Encoded"]
            print(f"[Vertex] {model_name} 모델 생성 성공!")
            return f"data:image/png;base64,{img_base64}"

    except httpx.TimeoutException:
        raise HTTPException(408, "Vertex AI 요청 시간이 초과되었습니다.")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(500, f"Vertex AI 호출 중 예외 발생: {str(e)}")

async def run_pipeline_replicate_to_vertex(
    img_bytes: bytes, style: str, strength: float, guidance: float,
    call_replicate_controlnet_structure=None, style_presets=None, capture_to_real_prompt=None
) -> str:
    """
    A new 2-stage pipeline that uses the best of both worlds:
    1. Replicate's ControlNet to create a structurally sound base image from a schematic.
    2. Vertex AI's Imagen to refine the base image into a high-quality, photorealistic result.
    """
    # 함수들이 전달되지 않은 경우 import
    if call_replicate_controlnet_structure is None:
        from replicate_utils import call_replicate_controlnet_structure
    if style_presets is None or capture_to_real_prompt is None:
        from prompt_templates import STYLE_PRESETS, CAPTURE_TO_REAL_PROMPT, VERTEX_PROMPT, VERTEX_HYBRID_PROMPT
        style_presets = style_presets or STYLE_PRESETS
        capture_to_real_prompt = capture_to_real_prompt or CAPTURE_TO_REAL_PROMPT
    
    print("[Pipeline-Hybrid] 하이브리드 파이프라인 시작 (Replicate -> Vertex)...")
    
    # --- Stage 1: Create the base structure with Replicate's ControlNet ---
    style_text = style_presets.get(style, "")
    controlnet_prompt = (
        f"{capture_to_real_prompt} "
        f"Style: {style_text}".strip()
    )
    
    try:
        stage1_urls = await call_replicate_controlnet_structure(
            img_bytes, prompt=controlnet_prompt, strength=0.8,
            guidance=10, structure="depth"
        )
        if not stage1_urls:
            raise HTTPException(500, "Stage1 (ControlNet) failed: No output URL.")
        stage1_url = stage1_urls[0]
        print(f"[Pipeline-Hybrid] 1단계 성공, 중간 이미지 URL: {stage1_url}")
    except Exception as e:
        print(f"[Pipeline-Hybrid] 1단계 (ControlNet) 실패: {e}")
        raise HTTPException(500, f"Hybrid Pipeline Stage 1 failed: {e}")

    # Download the intermediate image from Stage 1
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.get(stage1_url)
        if r.status_code != 200:
            raise HTTPException(502, f"Stage1 이미지 다운로드 실패: {r.status_code}")
        stage1_bytes = r.content
        print("[Pipeline-Hybrid] 1단계 중간 이미지 다운로드 완료.")

    # --- Stage 2: Refine the image with Vertex AI ---
    vertex_refine_prompt = (
        "**Strictly preserve the existing furniture layout and composition.** "
        "Refine this interior image to hyper-realistic, magazine-quality. "
        "Enhance the textures: make the wood grain on the floor and furniture more detailed, "
        "make the bedding look like soft, natural cotton with realistic wrinkles. "
        "Improve the lighting: add soft, warm sunlight streaming from a large window on the left, "
        "creating natural, soft shadows. "
        "Add small details like a book on the nightstand or subtle imperfections on the wall. "
        "Ensure the final result is a photorealistic, high-end architectural photograph."
    )
    
    try:
        # For refining a photo-like image, we use a lower strength to preserve structure
        final_image_b64 = await call_vertex_imagen3(
            stage1_bytes, prompt=vertex_refine_prompt, strength=0.5, guidance=15
        )
        print("[Pipeline-Hybrid] 2단계 (Vertex AI) 성공!")
        return final_image_b64
    except Exception as e:
        print(f"[Pipeline-Hybrid] 2단계 (Vertex AI) 실패: {e}")
        raise HTTPException(500, f"Hybrid Pipeline Stage 2 failed: {e}")

async def run_pipeline_with_hybrid_prompt(
    img_bytes: bytes, style: str, strength: float, guidance: float
) -> str:
    """
    하이브리드 프롬프트를 사용하는 파이프라인 (JSON + 스크린샷용)
    """
    from replicate_utils import call_replicate_controlnet_structure
    from prompt_templates import STYLE_PRESETS, VERTEX_HYBRID_PROMPT as HYBRID_PROMPT
    
    print("[Pipeline-Hybrid] 하이브리드 프롬프트 파이프라인 시작...")
    
    # 스타일 적용
    style_modifier = STYLE_PRESETS.get(style, "")
    
    # 하이브리드 프롬프트 사용
    hybrid_prompt = f"{HYBRID_PROMPT} {style_modifier}"
    
    print(f"[Pipeline-Hybrid] 사용 프롬프트: {hybrid_prompt[:100]}...")
    
    # 1단계: Replicate ControlNet으로 구조 생성
    print("[Pipeline-Hybrid] 1단계: Replicate ControlNet 구조 생성...")
    base_image_base64 = await call_replicate_controlnet_structure(
        img_bytes, hybrid_prompt, strength, guidance
    )
    
    if not base_image_base64:
        raise HTTPException(status_code=500, detail="1단계 Replicate ControlNet 실패")
    
    # base64를 bytes로 변환
    base_image_bytes = base64.b64decode(base_image_base64.split(',')[1])
    
    # 2단계: Vertex AI Imagen으로 고품질화
    print("[Pipeline-Hybrid] 2단계: Vertex AI Imagen 고품질화...")
    final_image_base64 = await call_vertex_imagen3(
        base_image_bytes, hybrid_prompt, strength=strength, guidance=guidance
    )
    
    if not final_image_base64:
        raise HTTPException(status_code=500, detail="2단계 Vertex AI 실패")
    
    print("[Pipeline-Hybrid] 하이브리드 파이프라인 완료!")
    return final_image_base64

async def run_pipeline_controlnet_to_flux(
    img_bytes: bytes, style: str, strength: float, guidance: float
) -> str:
    """
    ControlNet → FLUX 파이프라인: 구조 보존 + 고해상도 업스케일
    """
    from replicate_utils import call_replicate_controlnet_structure, call_replicate_flux_ultra
    from prompt_templates import STYLE_PRESETS, CAPTURE_TO_REAL_PROMPT
    import httpx
    
    print("[Pipeline-FLUX] ControlNet → FLUX 파이프라인 시작...")
    
    # 스타일 적용
    style_text = STYLE_PRESETS.get(style, "")
    controlnet_prompt = f"{CAPTURE_TO_REAL_PROMPT} Style: {style_text}".strip()
    
    print(f"[Pipeline-FLUX] 사용 프롬프트: {controlnet_prompt[:100]}...")
    
    # 1단계: Replicate ControlNet으로 구조 생성
    print("[Pipeline-FLUX] 1단계: ControlNet 구조 생성...")
    base_image_urls = await call_replicate_controlnet_structure(
        img_bytes, controlnet_prompt, strength, guidance, structure="depth"
    )
    
    if not base_image_urls:
        raise HTTPException(status_code=500, detail="1단계 ControlNet 실패")
    
    # URL에서 이미지 다운로드
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.get(base_image_urls[0])
        if r.status_code != 200:
            raise HTTPException(502, f"ControlNet 이미지 다운로드 실패: {r.status_code}")
        base_image_bytes = r.content
    
    # 2단계: FLUX Ultra로 고해상도 처리
    print("[Pipeline-FLUX] 2단계: FLUX Ultra 고해상도 처리...")
    flux_prompt = f"photorealistic bedroom interior, enhance details, {style_text}"
    flux_urls = await call_replicate_flux_ultra(
        base_image_bytes, flux_prompt, strength=0.3, guidance=guidance
    )
    
    print(f"[Pipeline-FLUX] FLUX 결과 타입: {type(flux_urls)}, 값: {flux_urls}")
    
    if not flux_urls:
        raise HTTPException(status_code=500, detail="2단계 FLUX Ultra 실패")
    
    # flux_urls가 리스트인지 문자열인지 확인
    if isinstance(flux_urls, list):
        final_url = flux_urls[0] if flux_urls else None
    else:
        final_url = flux_urls
    
    print(f"[Pipeline-FLUX] 최종 URL: {final_url}")
    print("[Pipeline-FLUX] ControlNet → FLUX 파이프라인 완료!")
    return final_url


async def call_vertex_imagen_latest(image_bytes: bytes, prompt: str, strength: float, guidance: float) -> str:
    """Vertex AI 최신 Imagen 모델(가칭 Gemini-powered)을 호출하여 이미지 생성"""
    key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not key_path or not GCP_PROJECT_ID:
        raise HTTPException(500, "GCP_PROJECT_ID 또는 GOOGLE_APPLICATION_CREDENTIALS 환경변수가 설정되지 않았습니다.")

    try:
        from google.auth.transport.requests import Request
        from google.oauth2 import service_account
        
        print(f"[Vertex] 서비스 계정 키 파일 인증 시도: {key_path}")
        credentials = service_account.Credentials.from_service_account_file(
            key_path, scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        credentials.refresh(Request())
        token = credentials.token
        project_id = GCP_PROJECT_ID
        print(f"[Vertex] 인증 성공 - 프로젝트: {project_id}")

    except Exception as e:
        raise HTTPException(500, f"Vertex AI 인증 오류: {e}. 키 파일 경로와 권한을 확인하세요.")

    # NOTE: 안정적인 최신 모델 ID로 수정합니다.
    model_name = "imagegeneration@006" 
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    from utils import resize_image_for_sdxl
    resized_image_bytes = resize_image_for_sdxl(image_bytes)
    b64_img = base64.b64encode(resized_image_bytes).decode()
    
    pil_image = Image.open(io.BytesIO(resized_image_bytes))
    mask_image = Image.new('L', pil_image.size, 255)
    
    mask_buffer = io.BytesIO()
    mask_image.save(mask_buffer, format="PNG")
    mask_b64 = base64.b64encode(mask_buffer.getvalue()).decode()

    endpoint = f"https://{GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{GCP_LOCATION}/publishers/google/models/{model_name}:predict"
    
    body = {
        "instances": [{
            "prompt": prompt,
            "image": { "bytesBase64Encoded": b64_img },
            "mask": { "image": { "bytesBase64Encoded": mask_b64 } }
        }],
        "parameters": {
            "sampleCount": 1,
            "guidanceScale": guidance,
            "strength": strength,
            # "quality": 9, # @006 모델에서는 지원되지 않을 수 있으므로 주석 처리
            "outputFormat": "png"
        }
    }
    
    print(f"[Vertex-Latest] {model_name} 모델 호출 중 (strength={strength}, guidance={guidance})...")
    
    try:
        async with httpx.AsyncClient(timeout=300) as client:
            r = await client.post(endpoint, headers=headers, json=body)
            
            if r.status_code >= 400:
                error_text = r.text
                print(f"[Vertex-Latest] API 오류: {r.status_code} - {error_text}")
                raise HTTPException(500, f"Vertex AI API 오류: {error_text}")
            
            resp = r.json()
            if "predictions" not in resp or not resp["predictions"]:
                 raise HTTPException(500, f"Vertex AI 응답에 'predictions'가 없습니다: {resp}")

            img_base64 = resp["predictions"][0]["bytesBase64Encoded"]
            print(f"[Vertex-Latest] {model_name} 모델 생성 성공!")
            return f"data:image/png;base64,{img_base64}"

    except httpx.TimeoutException:
        raise HTTPException(408, "Vertex AI 요청 시간이 초과되었습니다.")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(500, f"Vertex AI 호출 중 예외 발생: {str(e)}")


async def run_pipeline_replicate_to_gemini(
    img_bytes: bytes, style: str, strength: float, guidance: float
) -> str:
    """
    ControlNet → Gemini-powered Imagen 파이프라인: 구조 보존 + 최고 품질
    """
    from replicate_utils import call_replicate_controlnet_structure
    from prompt_templates import STYLE_PRESETS, CAPTURE_TO_REAL_PROMPT
    
    print("[Pipeline-Gemini] 하이브리드 파이프라인 시작 (Replicate -> Gemini-powered Imagen)...")
    
    # --- 1단계: Replicate ControlNet으로 구조 생성 ---
    style_text = STYLE_PRESETS.get(style, "")
    controlnet_prompt = f"{CAPTURE_TO_REAL_PROMPT} Style: {style_text}".strip()
    
    try:
        stage1_urls = await call_replicate_controlnet_structure(
            img_bytes, prompt=controlnet_prompt, strength=0.8,
            guidance=10, structure="depth"
        )
        if not stage1_urls:
            raise HTTPException(500, "1단계 (ControlNet) 실패: 출력 URL 없음.")
        stage1_url = stage1_urls[0]
        print(f"[Pipeline-Gemini] 1단계 성공, 중간 이미지 URL: {stage1_url}")
    except Exception as e:
        print(f"[Pipeline-Gemini] 1단계 (ControlNet) 실패: {e}")
        raise HTTPException(500, f"하이브리드 파이프라인 1단계 실패: {e}")

    # 중간 이미지 다운로드
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.get(stage1_url)
        if r.status_code != 200:
            raise HTTPException(502, f"1단계 이미지 다운로드 실패: {r.status_code}")
        stage1_bytes = r.content
        print("[Pipeline-Gemini] 1단계 중간 이미지 다운로드 완료.")

    # --- 2단계: Vertex AI 최신 모델로 고품질화 ---
    # Gemini급 품질을 위해 프롬프트를 대폭 강화합니다.
    vertex_refine_prompt = (
        "masterpiece, best quality, ultra-detailed, photorealistic, "
        "A photograph of a professionally decorated, hyper-realistic interior room. "
        "**Strictly preserve the existing furniture layout, composition, and perspective.** "
        "The lighting should be soft and natural, as if coming from a large, unseen window, creating gentle, realistic shadows. "
        "Enhance all textures to the highest fidelity: the wood grain on the floor and furniture must be clearly visible and detailed; "
        "the fabric on the bedding should look like soft, high-thread-count cotton with natural, subtle wrinkles; "
        "the walls should have a realistic, slightly imperfect texture. "
        "Add small, plausible details that enhance realism, such as a book on the nightstand, a charging cable, or subtle dust motes in the air. "
        "The final image must be indistinguishable from a high-end architectural photograph from a magazine like Architectural Digest. "
        "Do not add or remove any furniture. Focus on photorealism."
    )
    
    try:
        # 새로운 함수로 최신 모델 호출 (strength는 낮게, guidance는 높게 설정하여 디테일 강화)
        final_image_b64 = await call_vertex_imagen_latest(
            stage1_bytes, prompt=vertex_refine_prompt, strength=0.4, guidance=12
        )
        print("[Pipeline-Gemini] 2단계 (Vertex AI Latest) 성공!")
        return final_image_b64
    except Exception as e:
        print(f"[Pipeline-Gemini] 2단계 (Vertex AI Latest) 실패: {e}")
        raise HTTPException(500, f"하이브리드 파이프라인 2단계 실패: {e}")
