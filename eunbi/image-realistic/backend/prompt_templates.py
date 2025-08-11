# Provider별 최적화된 프롬프트 (교체본)

# 한국식 인테리어에 최적화된 프롬프트 - 과도한 장식 제거
STABILITY_PROMPT = (
    "Transform this 3D render into a natural photorealistic interior. PRESERVE exact layout and furniture positions. "
    "Replace dark background with clean, bright interior space with natural daylight. "
    "Convert colored shapes into realistic furniture with natural materials: "
    "soft fabric textures, natural wood grain, simple wall finishes. "
    "Natural indoor lighting, warm atmosphere, realistic proportions. "
    "Clean and minimal aesthetic, NO over-decoration, subtle details only."
)

REPLICATE_PROMPT = (
    "Transform to photorealistic interior while preserving EXACT layout. "
    "CRITICAL: Do not add, remove, or move any furniture. Keep exact positions and orientations. "
    "Replace abstract shapes with realistic furniture using natural materials. "
    "Add natural daylight, clean walls, simple flooring. "
    "Natural fabric textures, wood grain, matte finishes. "
    "Soft natural lighting, realistic but subtle details. "
    "Korean-inspired minimalism: clean lines, warm wood, neutral colors. "
    "NO elaborate decoration, NO professional photography effects."
)

VERTEX_PROMPT = (
    "**Transform this 3D room into photorealistic interior while ABSOLUTELY PRESERVING furniture positions.** "
    "MANDATORY LAYOUT PRESERVATION: "
    "1. EXACT FURNITURE POSITIONS - Keep precise location and orientation of every item "
    "2. NO ADDITIONS/REMOVALS - Do not add or remove any furniture or objects "
    "3. SAME ROOM BOUNDARIES - Preserve exact room shape and dimensions "
    "4. IDENTICAL SPATIAL RELATIONSHIPS - Maintain all distances between objects "
    "VISUAL TRANSFORMATION ONLY: "
    "• Convert abstract shapes into realistic furniture with natural materials "
    "• Add natural interior lighting and soft shadows "
    "• Apply Korean-inspired minimalist aesthetic: clean lines, natural wood, neutral colors "
    "• Create warm, comfortable atmosphere with natural daylight "
    "• Use simple, natural textures: wood grain, fabric, painted walls "
    "KOREAN INTERIOR STYLE: "
    "• Natural wood tones, cream/white walls, minimal decoration "
    "• Clean, uncluttered design with focus on functionality "
    "• Warm, inviting lighting without harsh contrasts "
    "ABSOLUTE PROHIBITION: Moving furniture, changing layout, adding objects, over-decoration."
)

# 하이브리드 모드 전용 프롬프트 (JSON + 스크린샷)
VERTEX_HYBRID_PROMPT = (
    "**PRECISE LAYOUT PRESERVATION: Transform this 3D screenshot into photorealistic interior while maintaining EXACT furniture arrangement.** "
    "INPUT ANALYSIS: This image contains a 3D room with specific furniture pieces at precise coordinates. "
    "MANDATORY PRESERVATION: "
    "• Bed position and orientation - EXACT location as shown "
    "• Desk/table position and size - EXACT placement as shown "
    "• Room boundaries and dimensions - EXACT shape and size "
    "• All spatial relationships between objects - EXACT distances "
    "• Object count - Do NOT add or remove any furniture "
    "VISUAL TRANSFORMATION ONLY: "
    "• Replace 3D render materials with photorealistic textures "
    "• Add natural interior lighting with soft shadows "
    "• Convert abstract surfaces to realistic materials: wood grain, fabric textures, painted walls "
    "• Create modern residential atmosphere with warm daylight (5500K) "
    "• Apply professional architectural photography aesthetics "
    "TECHNICAL REQUIREMENTS: "
    "• Canon EOS R5, 24-70mm f/2.8, professional interior photography "
    "• Light hardwood flooring with natural grain variation "
    "• Clean white/cream walls with subtle texture "
    "• High-end modern furniture with realistic wear patterns "
    "• Natural depth of field, anti-CGI processing "
    "STRICT PROHIBITIONS: Furniture relocation, room reshaping, object additions/removals, "
    "built-in storage, extra architectural elements, spatial relationship changes."
)

# 기본 프롬프트
DEFAULT_PROMPT = STABILITY_PROMPT

# 네거티브: 과도한 장식과 가구 이동 방지
NEGATIVE_PROMPT = (
    "3d render, cgi, computer graphics, plastic surfaces, artificial materials, "
    "black background, dark void, floating objects, colored blocks, geometric shapes, "
    "cartoon, illustration, sketch, oversaturated colors, neon lighting, "
    "moving furniture, changing positions, adding furniture, removing furniture, "
    "built-in storage, extra doors, extra windows, wall modifications, "
    "over-decoration, excessive ornaments, complex patterns, busy textures, "
    "professional photography equipment, camera settings, technical specifications, "
    "luxury finishes, premium materials, high-end furniture, elaborate details, "
    "perfect surfaces, glossy finishes, harsh lighting, dramatic shadows"
)

# 3D 캡처 실사화용: 어떤 3D 레이아웃이든 침실로 변환
CAPTURE_TO_REAL_PROMPT = (
    "Transform this 3D room layout into a stunning photorealistic modern bedroom photograph. "
    "INTERPRET the 3D furniture positions as bedroom elements: "
    "Convert any sofa/seating area into a comfortable bed with white cotton bedding and realistic wrinkles, "
    "transform walls to textured white painted bedroom walls with baseboards and crown molding, "
    "change floor to beautiful light hardwood with natural grain patterns, "
    "add bedroom-appropriate furniture like nightstands, dresser, or wardrobe in logical positions, "
    "create large bright windows with natural daylight streaming in, soft ambient bedroom lighting, "
    "include bedroom details: bedside lamps, artwork, plants, decorative pillows, realistic proportions. "
    "Professional architectural photography style, Canon 5D Mark IV, warm daylight (5000K), "
    "natural color grading, eliminate all 3D render and CGI artifacts, achieve magazine-quality bedroom photography."
)

# 선택 스타일 프리셋
STYLE_PRESETS = {
    "scandinavian": "light wood, white walls, linen fabrics, minimal decor, soft daylight",
    "modern": "neutral palette, matte finishes, clean lines, low contrast lighting", 
    "bohemian": "warm tones, layered textiles, plants, rattan, cozy ambient light",
    "japanese": "natural wood, tatami-inspired textures, shoji-like diffusion, calm ambiance",
    "korean": "warm wood tones, ondol flooring, clean white walls, minimal furniture, natural lighting, subtle traditional elements",
    "korean_modern": "light oak wood, cream walls, low profile furniture, floor seating, warm neutral colors, clean minimalism",
}

# 권장 기본값 (3D 캡처의 경우 더 강한 변환 필요)
DEFAULT_STRENGTH = 0.6  # 가구 배치 보존을 위해 strength 감소
DEFAULT_GUIDANCE = 8    # 자연스러운 결과를 위해 guidance 감소
