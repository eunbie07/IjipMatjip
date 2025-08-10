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
    "Transform to photorealistic interior while preserving the exact layout. "
    "Do not add, remove, or move any furniture or walls. No built-in wardrobes, no alcoves, no extra doors or windows. "
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
    "**Transform this 3D room layout into a photorealistic interior while ABSOLUTELY PRESERVING every furniture position and room dimension.** "
    "CRITICAL LAYOUT PRESERVATION RULES: "
    "1. EXACT FURNITURE POSITIONS - Maintain precise location, orientation, and scale of every piece "
    "2. ZERO ADDITIONS/REMOVALS - Do not add new furniture, built-ins, or architectural elements "
    "3. IDENTICAL ROOM BOUNDARIES - Preserve exact room shape, size, and proportions "
    "4. SAME SPATIAL RELATIONSHIPS - Maintain distances between all objects exactly as shown "
    "5. FIXED OBJECT COUNT - Keep the exact same number of items as in the input "
    "TRANSFORMATION SCOPE (Visual Style Only): "
    "• Convert geometric/abstract shapes → realistic modern furniture with proper materials "
    "• Add professional interior lighting with natural shadows and highlights "
    "• Apply photorealistic textures: cotton bedding with natural wrinkles, wood grain patterns, matte wall paint "
    "• Create bright, airy atmosphere with large windows and natural daylight (5000K) "
    "• Use warm residential color palette suitable for modern bedroom/living space "
    "TARGET PHOTOGRAPHY STYLE: "
    "• Professional real estate photography (Canon EOS R5, 24-70mm f/2.8, f/5.6, ISO 400) "
    "• Clean, bright interior with premium finishes "
    "• Light hardwood flooring, white/cream walls, modern minimalist aesthetic "
    "• Subtle ambient details: baseboards, window frames, natural lighting gradients "
    "TECHNICAL OUTPUT: 896x896px, realistic depth of field, anti-CGI processing, warm color grading "
    "ABSOLUTE PROHIBITION: Moving furniture, changing room layout, adding/removing items, altering spatial relationships, "
    "built-in storage additions, extra doors/windows, room size modifications."
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

# 네거티브: Stability/Replicate에서 사용 (Vertex에는 쓰지 않음) - 강화된 버전
NEGATIVE_PROMPT = (
    "3d render, cgi, computer graphics, digital art, artificial render, plastic surfaces, flat shading, "
    "perfect geometry, unnaturally clean surfaces, game engine render, blender render, maya render, "
    "black background, black void, dark background, empty space, floating objects, no walls, no floor, no ceiling, "
    "colored blocks, geometric primitives, solid colors, uniform textures, perfect edges, smooth plastic, "
    "sterile surfaces, artificial materials, fake textures, glossy plastic finish, "
    "cartoon, anime, illustration, stylized, low poly, sketch, drawing, painting, "
    "overexposed, underexposed, harsh lighting, artificial lighting, neon colors, oversaturated, "
    "noise, grain, artifacts, blurry, lowres, compressed, pixelated, distorted, "
    "text, watermark, logo, signature, username, copyright, "
    "unrealistic proportions, floating furniture, impossible architecture, perfect surfaces, "
    "built-in wardrobe, alcove, niche, extra door, extra window, wall opening"
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
}

# 권장 기본값 (3D 캡처의 경우 더 강한 변환 필요)
DEFAULT_STRENGTH = 0.7  # 기본 3D 모델을 실사로 변환하려면 높은 strength 필요
DEFAULT_GUIDANCE = 12   # 더 강한 guidance로 프롬프트 준수 향상
