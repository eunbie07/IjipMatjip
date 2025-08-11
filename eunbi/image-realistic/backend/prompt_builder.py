# prompt_builder.py - 프로바이더별 프롬프트 빌더
from typing import Tuple, Optional
from prompt_templates import (
    STABILITY_PROMPT, REPLICATE_PROMPT, VERTEX_PROMPT,
    NEGATIVE_PROMPT, STYLE_PRESETS
)

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
    provider: str,            # "replicate" | "stability" | "vertex"
    style_key: str,           # e.g. "scandinavian"
    mode: str = "strict"      # "strict" | "interpretive"
) -> Tuple[str, Optional[str]]:
    """
    프로바이더별 기본 프롬프트 + 스타일 + 모드에 따른 프롬프트 생성
    
    Args:
        provider: AI 서비스 제공자 ("replicate" | "stability" | "vertex")
        style_key: 스타일 키 (STYLE_PRESETS에서 가져옴)
        mode: 구조 보존 모드 ("strict" | "interpretive")
    
    Returns:
        Tuple[str, Optional[str]]: (프롬프트, 네거티브_프롬프트)
    """
    # 1) base prompt by provider
    base = {
        "replicate": REPLICATE_PROMPT,
        "stability": STABILITY_PROMPT,
        "vertex": VERTEX_PROMPT
    }.get(provider, REPLICATE_PROMPT)

    # 2) mode suffix
    if mode == "strict":
        base = base + STRICT_SUFFIX
    else:
        base = base + INTERPRETIVE_SUFFIX

    # 3) style preset
    style_text = STYLE_PRESETS.get(style_key, "")
    if style_text:
        base = f"{base} Style: {style_text}."

    # Vertex는 negative 사용 안 함
    negative = None if provider == "vertex" else NEGATIVE_PROMPT
    
    return base, negative