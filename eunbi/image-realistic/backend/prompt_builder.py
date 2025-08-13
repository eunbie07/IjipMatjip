# prompt_builder.py - 프로바이더별 프롬프트 빌더
from typing import Tuple, Optional, List
from prompt_templates import (
    STABILITY_PROMPT, REPLICATE_PROMPT, VERTEX_PROMPT,
    NEGATIVE_PROMPT, STYLE_PRESETS, STYLE_TRANSFER_PROMPT_TEMPLATE
)

def build_style_transfer_prompt(style_key: str) -> str:
    """
    AI 인테리어 스타일 변환 전용 프롬프트를 생성합니다.
    """
    style_description = STYLE_PRESETS.get(style_key, style_key.replace('_', ' '))
    return STYLE_TRANSFER_PROMPT_TEMPLATE.format(style=style_description)


# 강화된 가구 배치 보존 모드
STRICT_SUFFIX = (
    " CRITICAL FURNITURE LAYOUT PRESERVATION: Do not move, add, or remove ANY furniture. "
    "Keep EXACT positions, orientations, and sizes of all objects as shown. "
    "Do not change spatial relationships between furniture pieces. "
    "Korean minimalist style: natural wood tones, clean lines, neutral colors, NO excessive decoration. "
    "Soft natural lighting only, NO dramatic effects."
)

# 경륙적 변환 모드
INTERPRETIVE_SUFFIX = (
    " Minor texture and color changes allowed, but NEVER move furniture positions. "
    "Keep Korean minimalist aesthetic: subtle colors, natural materials, clean design."
)

def build_prompt(
    provider: str,
    style_key: str,
    furniture_list: List[str], # 가구 목록을 인자로 추가
    mode: str = "strict"
) -> Tuple[str, Optional[str]]:
    """
    프로바이더별 기본 프롬프트 + 스타일 + 가구 목록 + 모드에 따른 프롬프트 생성
    
    Args:
        provider: AI 서비스 제공자 ("replicate" | "stability" | "vertex")
        style_key: 스타일 키 (STYLE_PRESETS에서 가져옴)
        furniture_list: 방에 있는 가구 이름 목록 (e.g., ["bed", "desk"])
        mode: 구조 보존 모드 ("strict" | "interpretive")
    
    Returns:
        Tuple[str, Optional[str]]: (프롬프트, 네거티브_프롬프트)
    """
    # 1) 가구 목록을 기반으로 프롬프트 앞부분 생성
    if furniture_list:
        # e.g., "a bed and a desk"
        furniture_str = " and ".join(f"a {f.replace('_', ' ')}" for f in furniture_list)
        prompt_prefix = f"A photorealistic image of a room containing {furniture_str}. "
    else:
        prompt_prefix = "A photorealistic image of a room. "

    # 2) base prompt by provider
    base = {
        "replicate": REPLICATE_PROMPT,
        "stability": STABILITY_PROMPT,
        "vertex": VERTEX_PROMPT
    }.get(provider, REPLICATE_PROMPT)

    # 3) mode suffix
    if mode == "strict":
        mode_suffix = STRICT_SUFFIX
    else:
        mode_suffix = INTERPRETIVE_SUFFIX

    # 4) style preset
    style_text = STYLE_PRESETS.get(style_key, "")
    if style_text:
        style_suffix = f" Style: {style_text}."
    else:
        style_suffix = ""

    # 모든 요소를 결합
    final_prompt = f"{prompt_prefix}{base}{mode_suffix}{style_suffix}"

    # Vertex는 negative 사용 안 함
    negative = None if provider == "vertex" else NEGATIVE_PROMPT
    
    return final_prompt, negative
