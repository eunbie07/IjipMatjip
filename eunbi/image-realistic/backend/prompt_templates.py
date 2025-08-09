# Provider별 최적화된 프롬프트 (교체본)

STABILITY_PROMPT = (
    "Transform this 3D render into a photorealistic interior photograph. KEEP exact layout and furniture positions. "
    "Replace black background with bright modern bedroom setting with large windows, natural sunlight streaming in, "
    "soft shadows on white walls and light oak hardwood floors. "
    "Convert colored blocks into realistic modern furniture with actual materials: "
    "white cotton bedding with natural wrinkles, visible fabric texture, real wood grain patterns, "
    "matte wall paint with subtle imperfections, realistic proportions and scale. "
    "Professional real estate photography style, Canon 5D Mark IV, 24-70mm lens, f/5.6, ISO 400, "
    "natural color grading, warm daylight (5000K), NO CGI or plastic appearance, "
    "add ambient room details like baseboards, window frames, realistic lighting gradients."
)

REPLICATE_PROMPT = (
    "PHOTOREALISTIC interior transformation: maintain exact 3D layout, replace black void with bright modern bedroom. "
    "Add large bright windows with natural daylight, white painted walls, light hardwood flooring. "
    "Transform colored geometric shapes into realistic furniture with proper materials and textures: "
    "soft white cotton bedding with natural fabric wrinkles, visible thread patterns, "
    "wood furniture with realistic grain and matte finish, proper scale and proportions. "
    "Professional architectural photography: soft natural lighting, realistic shadows and highlights, "
    "depth of field, warm color temperature, film grain, ANTI-CGI: no plastic sheen, no perfect surfaces, "
    "add realistic room details: crown molding, window sills, light switches, subtle wall texture variations."
)

VERTEX_PROMPT = (
    "Convert 3D render to photorealistic bedroom photo while preserving exact layout and positions. "
    "Replace black background with bright, airy modern bedroom: white walls, large windows with natural light, "
    "warm oak hardwood floors, realistic room proportions and architectural details. "
    "Transform colored blocks into authentic materials: crisp white cotton bedding with natural texture and wrinkles, "
    "wood furniture with visible grain and realistic finish, painted walls with subtle texture variations. "
    "Professional interior photography lighting: soft window light, natural shadows, balanced exposure, "
    "warm color temperature (4800K), realistic depth of field, eliminate all CGI/3D render artifacts, "
    "add authentic room elements: baseboards, window trim, light fixtures, wall outlets for realism."
)

# 기본 프롬프트
DEFAULT_PROMPT = STABILITY_PROMPT

# 네거티브: Stability/Replicate에서 사용 (Vertex에는 쓰지 않음) - 강화된 버전
NEGATIVE_PROMPT = (
    "3d render, cgi, computer graphics, digital art, artificial render, plastic surfaces, flat shading, "
    "perfect geometry, unnaturally clean surfaces, game engine render, blender render, maya render, "
    "black background, black void, empty space, floating objects, no walls, no floor, no ceiling, "
    "colored blocks, geometric primitives, solid colors, uniform textures, perfect edges, "
    "cartoon, anime, illustration, stylized, low poly, sketch, drawing, painting, "
    "overexposed, underexposed, harsh lighting, artificial lighting, neon colors, oversaturated, "
    "noise, grain, artifacts, blurry, lowres, compressed, pixelated, distorted, "
    "text, watermark, logo, signature, username, copyright, "
    "unrealistic proportions, floating furniture, impossible architecture"
)

# 3D 캡처 실사화용: 레이아웃 고정 강조 + 재질·조명 구체화
CAPTURE_TO_REAL_PROMPT = (
    "Keep the exact room layout and furniture arrangement from the input image. "
    "Convert CGI look to realistic interior photography. Use physically plausible materials "
    "(wood grains, fabric fibers, metal reflections), correct perspective, soft natural light, "
    "balanced white balance, subtle shadows, no over-sharpening."
)

# 선택 스타일 프리셋
STYLE_PRESETS = {
    "scandinavian": "light wood, white walls, linen fabrics, minimal decor, soft daylight",
    "modern": "neutral palette, matte finishes, clean lines, low contrast lighting", 
    "bohemian": "warm tones, layered textiles, plants, rattan, cozy ambient light",
    "japanese": "natural wood, tatami-inspired textures, shoji-like diffusion, calm ambiance",
}

# 권장 기본값 (레이아웃 보존을 위해 낮은 strength)
DEFAULT_STRENGTH = 0.3
DEFAULT_GUIDANCE = 9   # Stability cfg_scale 7–10 / Replicate scale 8–12 권장
