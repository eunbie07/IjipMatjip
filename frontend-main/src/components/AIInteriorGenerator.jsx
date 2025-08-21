import React, { useState } from "react";
import { uploadGeneratedImageToS3 } from "../utils/api";

// 검증된 침실 스타일 프리셋들
const bedroomPresets = {
  modern_warm: {
    name: "Modern Minimal (Warm)",
    description: "깨끗하고 따뜻한 현대적 침실",
    basePrompt: `
Modern minimal bedroom with warm neutral tones:
- Clean lines, minimal furniture, uncluttered surfaces, open spaces
- Warm beiges, soft creams, light browns, gentle taupes, cozy atmosphere
- Sleek contemporary furniture, clean geometric shapes, natural materials
- Large windows, abundant natural light, bright airy atmosphere
- Platform bed with simple headboard, floating nightstands, built-in storage
- Light oak wood floors, white/cream walls, minimal decorative items
- Quality textiles: linen, cotton, soft wool in neutral tones
- Hidden storage solutions maintaining clean aesthetic`
  },
  
  modern_cool: {
    name: "Modern Minimal (Cool)",
    description: "시원하고 깨끗한 현대적 침실",
    basePrompt: `
Modern minimal bedroom with cool neutral tones:
- Clean lines, minimal furniture, open spaces, sophisticated simplicity
- Cool grays, soft whites, pale blues, crisp clean feeling, modern aesthetic
- Sleek contemporary furniture, mixed materials, geometric shapes
- Bright even lighting, large windows, airy atmosphere
- Platform bed, geometric nightstands, hidden storage solutions
- Light gray walls, white trim, polished concrete or light wood floors
- Minimal metal accents, glass elements, monochromatic palette
- Everything has its place, surfaces kept completely clear`
  },
  
  scandinavian_cozy: {
    name: "Scandinavian",
    description: "따뜻하고 자연스러운 북유럽 침실",
    basePrompt: `
Scandinavian cozy bedroom with hygge atmosphere:
- Light woods, cozy textiles, white and natural tones, functional design
- Pine/birch wood furniture, woven textiles, natural fiber rugs
- Mid-century inspired pieces, walnut accents, tapered wooden legs
- Soft warm lighting, table lamps, candles, golden glow ambiance
- Wooden bed frame, linen bedding, wool throws, multiple pillows
- Light wooden floors, white walls with wood accents, large windows
- Plants, books, ceramic items, but kept minimal and purposeful
- Emphasis on natural materials, comfort, and sustainable living`
  },
  
  contemporary_bold: {
    name: "Contemporary",
    description: "현대적이고 세련된 침실",
    basePrompt: `
Contemporary sophisticated bedroom with bold design:
- Current design trends, mixed materials, bold accents, sophisticated schemes
- Rich color combinations, dramatic contrasts, luxurious textures
- Designer furniture, innovative materials, statement pieces
- Strategic lighting, architectural features, dynamic shadows, accent lighting
- Upholstered headboard, designer nightstands, luxury finishes
- Rich textures: velvet, silk, leather, polished stone, metal accents
- Modern art, curated accessories, plants as design elements
- High-end materials, attention to detail, magazine-worthy styling`
  },
  
  industrial_urban: {
    name: "Industrial",
    description: "도시적이고 날것의 인더스트리얼 침실",
    basePrompt: `
Industrial urban bedroom with raw, edgy aesthetic:
- Exposed brick walls, concrete floors, metal beams, raw materials
- Dark color palette: blacks, grays, browns, with metallic accents
- Reclaimed wood furniture, metal bed frames, vintage industrial pieces
- Edison bulbs, metal pendant lights, exposed wiring aesthetic
- Leather upholstery, distressed finishes, aged patina textures
- Large factory-style windows, high ceilings, open ductwork
- Vintage machinery elements, industrial artifacts as decor
- Urban loft feel with masculine, sophisticated edge`
  },
  
  bohemian_free: {
    name: "Bohemian",
    description: "자유롭고 개성있는 보헤미안 침실",
    basePrompt: `
Bohemian eclectic bedroom with artistic, free-spirited vibe:
- Rich, layered textiles: Persian rugs, tapestries, embroidered pillows
- Warm, earthy colors: terracotta, deep blues, mustard yellows, forest greens
- Mix of vintage and ethnic furniture, handcrafted pieces, global influences
- Multiple lighting sources: string lights, lanterns, candles, ambient glow
- Plants and natural elements: hanging plants, dried flowers, natural materials
- Artistic elements: gallery walls, handmade ceramics, woven baskets
- Comfortable, lived-in feel with personal touches and collected treasures
- Relaxed, creative atmosphere perfect for artistic souls`
  }
};

// 사용 목적별 모드 옵션들
const moodOptions = {
  netflix: {
    name: "Netflix & Chill",
    description: "영상 감상에 최적화된 아늤한 공간",
    modifier: `

NETFLIX VIEWING OPTIMIZATION:
- Bed positioned facing TV wall or projector area for optimal viewing angles
- Dim ambient lighting: warm LED strips behind TV, soft bedside lamps (2700K)
- Blackout curtains or smart blinds for optimal screen viewing experience
- Comfort elements: extra throw pillows, soft blankets, cozy textures
- Sound optimization: soft furnishings to absorb echo, comfortable acoustics
- Snack accessibility: bedside storage for beverages and light snacks
- NO bright lights or reflective surfaces that cause screen glare
- Cable management for clean, distraction-free environment`
  },
  
  focus: {
    name: "집중/업무",
    description: "업무와 학습에 집중할 수 있는 공간",
    modifier: `

FOCUS & PRODUCTIVITY OPTIMIZATION:
- Bright task lighting: LED ceiling panels or desk lamps (4000K-5000K) for alertness
- Zero visual distractions: clean, organized surfaces, hidden clutter
- Ergonomic work area: proper desk height, comfortable supportive chair
- Air quality: plants or air purifier for mental clarity and oxygen
- Colors that enhance concentration: white, light blue, soft green accents
- Organized storage: designated places for everything, filing systems
- Sound control: materials that absorb noise, quiet environment
- Separation of sleep and work areas to maintain healthy boundaries`
  },
  
  guest: {
    name: "손님맞이",
    description: "게스트를 위한 환대하는 공간",
    modifier: `

GUEST WELCOMING OPTIMIZATION:
- Hotel-like cleanliness and professional organization
- Fresh neutral colors: white, cream, soft gray for universal appeal
- Quality bedding: crisp white linens, multiple pillow and blanket options
- Thoughtful amenities: bedside water carafe, reading light, phone charging station
- Clear surfaces with only essential welcoming items: fresh flowers, welcome note
- Ample storage: empty closet space, clear drawers for guest belongings
- Privacy considerations: quality window treatments, door that closes properly
- Fresh air circulation and subtle, pleasant scent throughout
- Mirror and good lighting for guests to prepare and feel comfortable`
  },
  
  romantic: {
    name: "로맨틱",
    description: "카플을 위한 로맨틱한 공간",
    modifier: `

ROMANTIC ATMOSPHERE OPTIMIZATION:
- Soft romantic lighting: dimmable warm lights, candles, fairy lights (2200K)
- Luxurious textures: silk pillowcases, velvet throws, cashmere blankets
- Rich romantic colors: deep reds, soft pinks, gold accents, warm burgundy
- Fresh flowers: roses, peonies, or seasonal romantic blooms
- Intimate seating: comfortable reading chair or small loveseat for two
- Sensory elements: soft music capability, pleasant natural scents
- Privacy enhancement: layered window treatments, intimate enclosed feeling
- Special touches: quality wine glasses, books of poetry, meaningful art`
  }
};

const AIInteriorGenerator = ({ onImageGenerated, capturedScreenshot }) => {
  // 새로운 프리셋 기반 상태 변수들
  const [selectedPreset, setSelectedPreset] = useState('modern_warm'); // 기본 침실 스타일 프리셋
  const [selectedMood, setSelectedMood] = useState(''); // 사용 목적
  const [furnitureLayout, setFurnitureLayout] = useState('add_furniture'); // 가구 배치 방식 (기존 유지)
  const [customPrompt, setCustomPrompt] = useState(''); // 추가 커스텀 요청 (기존 유지)
  
  // 실사화 품질 설정
  const [photoStyle, setPhotoStyle] = useState('architectural'); // 사진 스타일
  const [lightingMode, setLightingMode] = useState('natural'); // 조명 모드

  // 사람 삭제 및 3D 모델 관련 상태
  const [removePeople, setRemovePeople] = useState(true); // 사람 삭제 여부
  const [apply3DModels, setApply3DModels] = useState(true); // 3D 모델 적용 여부

  const [uploadedImage, setUploadedImage] = useState(null); // 업로드된 이미지 파일 (Base64)
  const [imageUrl, setImageUrl] = useState(''); // 첫 번째 생성된 이미지 URL (AI 디자인)
  const [realisticImageUrl, setRealisticImageUrl] = useState(''); // 두 번째 생성된 이미지 URL (실사화된 이미지)
  
  const [loading, setLoading] = useState(false); // 첫 번째 생성 로딩 상태
  const [generatingRealistic, setGeneratingRealistic] = useState(false); // 두 번째(실사화) 생성 로딩 상태
  const [error, setError] = useState(''); // 에러 메시지

  // data:URL을 Blob으로 변환해 안전하게 다운로드 (anchor href=data:URL 사용 시 브라우저 콘솔 경고 방지)
  const downloadDataUrl = async (dataUrl, filename) => {
    try {
      const base64 = dataUrl.split(',')[1] || dataUrl;
      const mimeMatch = dataUrl.match(/^data:(.*?);base64,/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const byteChars = atob(base64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  // 캡쳐 이미지를 업로드 이미지로 변환하는 함수
  React.useEffect(() => {
    if (capturedScreenshot && capturedScreenshot.imageData) {
      // capturedScreenshot.imageData가 base64 문자열인 경우
      const base64Data = capturedScreenshot.imageData.split(',')[1] || capturedScreenshot.imageData;
      setUploadedImage({ 
        data: base64Data, 
        mimeType: 'image/png'
      });
    }
  }, [capturedScreenshot]);

  const getFurnitureLayoutPrompt = (layout) => {
    const layouts = {
      keep_existing: `
STRICT FURNITURE CONSTRAINT - KEEP EXISTING ONLY:
- Count the furniture pieces in the original image EXACTLY
- If original has bed + desk ONLY, result must have bed + desk ONLY
- DO NOT ADD: nightstands, side tables, chairs, plants, decorations, lamps, rugs, artwork
- DO NOT ADD: any furniture pieces not present in the original image
- ONLY change: colors, materials, textures, wall paint, flooring
- Keep exact same furniture count and positioning as original
- Transform ONLY the appearance/style of existing items, never add new items`,
      
      add_furniture: "Keep the existing furniture in their current positions, but ADD complementary furniture pieces and accessories that enhance the space. Maintain the current layout while enriching the room with additional items that match the selected style.",
      
      style_optimized: "Completely rearrange and add furniture as needed to create the perfect composition for the selected style. Move existing pieces to optimal positions and add complementary pieces that enhance the overall design while maintaining functionality."
    };
    return layouts[layout] || layouts.keep_existing;
  };

  // 첫 번째 이미지 생성 함수 (AI 최적화된 프롬프트)
  const generateImage = async () => {
    setLoading(true);
    setImageUrl(''); // 기존 이미지 URL 초기화
    setRealisticImageUrl(''); // 실사화 이미지 URL 초기화
    setError('');

    try {
      const parts = [];
      
      // 이미지 기반으로 인테리어를 생성하도록 명확한 프롬프트 추가
      if (uploadedImage) {
        parts.push({ text: '이 이미지를 참고하여 인테리어 디자인을 적용해주세요.' });
        parts.push({
          inlineData: {
            mimeType: uploadedImage.mimeType,
            data: uploadedImage.data,
          },
        });
      }

      // 새로운 프리셋 기반 프롬프트 생성
      const selectedPresetData = bedroomPresets[selectedPreset];
      const selectedMoodData = selectedMood ? moodOptions[selectedMood] : null;
      const layoutDescription = getFurnitureLayoutPrompt(furnitureLayout);
      
      // 전문적인 인테리어 디자인 프롬프트 구성
      let finalPromptText = `
Create a professionally designed bedroom space with the following specifications:

BEDROOM STYLE FOUNDATION:
${selectedPresetData.basePrompt}

FURNITURE LAYOUT STRATEGY:
${layoutDescription}`;

      // 무드 설정이 있으면 추가
      if (selectedMoodData) {
        finalPromptText += selectedMoodData.modifier;
      }

      // 공통 디자인 요구사항 추가
      finalPromptText += `\n\nDESIGN REQUIREMENTS:
- High-quality bedroom interior design suitable for design magazines
- Balanced composition with proper proportions for bedroom functionality
- Cohesive color scheme throughout the space promoting rest and relaxation
- Clean, organized, and visually appealing space
- Modern interior design standards and best practices
- Bedroom-specific considerations: privacy, comfort, storage, lighting layers

DESK AND WORKSPACE REQUIREMENTS (if present):
- Remove ALL items from desk surfaces (monitors, keyboards, papers, decorations, etc.)
- Keep the existing desk structure but change its style and material to match the selected furniture style
- Transform the desk design to align with the chosen furniture aesthetic
- Keep desk surface completely clear and clean
- Organize and hide all cables and wires
- Maintain desk positioning but update its appearance to match room style`;

      // 사람 삭제 옵션 추가
      if (removePeople) {
        finalPromptText += `\n\nPEOPLE REMOVAL REQUIREMENT:
- Remove ALL people, human figures, or human-like objects from the scene
- Ensure the room appears completely empty of any human presence
- Focus on the interior design and furniture only
- Create a clean, unoccupied space suitable for interior photography`;
      }

      // 3D 모델 적용 옵션 추가
      if (apply3DModels) {
        finalPromptText += `\n\n3D MODEL INTEGRATION:
- Apply realistic 3D furniture models with proper textures and materials
- Ensure furniture appears as high-quality 3D rendered objects
- Use realistic lighting and shadows for 3D models
- Maintain proper scale and proportions for all 3D elements
- Create seamless integration between 3D models and the room environment`;
      }

      // 기존 배치 유지 시 추가 제한사항
      if (furnitureLayout === 'keep_existing') {
        finalPromptText += `\n\nCRITICAL CONSTRAINT FOR EXISTING LAYOUT:
- FURNITURE COUNT MUST MATCH ORIGINAL IMAGE EXACTLY
- If original shows bed + desk only, result must show bed + desk only
- DO NOT add nightstands, side tables, chairs, plants, lamps, rugs, or any decorative items
- DO NOT add any furniture pieces not visible in the original uploaded image
- Focus transformation on: wall colors, flooring materials, existing furniture styling only
- This is a STRICT requirement - adding furniture violates user preferences`;
      }

      // 커스텀 요청이 있으면 추가
      if (customPrompt.trim()) {
        finalPromptText += `\n\nADDITIONAL REQUIREMENTS:
${customPrompt.trim()}`;
      }
      
      // 3D 렌더링 품질 지시 (실사화 아님)
      finalPromptText += `\n\nRENDERING STYLE:
- 3D architectural rendering style, not photographic
- Clean digital rendering with smooth surfaces
- Computer-generated interior visualization
- Professional 3D modeling quality like SketchUp or Blender
- Maintain rendering aesthetic, not realistic photography`;

      console.log('Generated Prompt:', finalPromptText); // 디버깅용

      parts.push({ text: finalPromptText });

      const payload = {
        contents: [{
            role: "user",
            parts: parts
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        },
      };

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`;

      let attempt = 0;
      const maxAttempts = 5;
      while (attempt < maxAttempts) {
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorBody = await response.text();
            console.error('API Error Response Body (First Gen):', errorBody);
            throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
          }

          const result = await response.json();
          const base64Data = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

          if (base64Data) {
            setImageUrl(`data:image/png;base64,${base64Data}`);
            
            if (onImageGenerated) {
              onImageGenerated({
                url: `data:image/png;base64,${base64Data}`,
                style: bedroomPresets[selectedPreset]?.name || selectedPreset,
                generated_at: new Date().toISOString()
              });
            }
          } else {
            setError('인테리어 디자인 생성에 실패했습니다. 설명을 더 구체적으로 입력해보세요.');
          }
          break;
        } catch (err) {
          console.error(`API 호출 실패 (시도 ${attempt + 1}, First Gen):`, err);
          if (attempt < maxAttempts - 1) {
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            await new Promise(res => setTimeout(res, delay));
          } else {
            setError(`인테리어 디자인 생성에 실패했습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요. (오류: ${err.message})`);
          }
        }
        attempt++;
      }
    } catch (err) {
      console.error('이미지 생성 중 오류 발생:', err);
      setError('이미지 생성 중 알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 두 번째 이미지 생성 함수 (실사화)
  const generateRealisticImage = async () => {
    if (!imageUrl) {
      setError('먼저 인테리어 이미지를 생성해주세요.');
      return;
    }
    setGeneratingRealistic(true);
    setRealisticImageUrl(''); // 기존 실사화 이미지 초기화
    setError('');

    try {
      const parts = [];
      const base64Image = imageUrl.split(',')[1]; // data URL에서 base64 데이터 추출

      // 잡지급 인테리어 사진을 위한 전문적인 프롬프트 (설정 기반)
      const getPhotoStyleSpecs = (style) => {
        const styles = {
          architectural: "Architectural Digest style - clean, spacious, dramatic lighting",
          lifestyle: "Elle Decor lifestyle - warm, lived-in, cozy atmosphere",
          luxury: "Luxe Interiors - high-end, opulent, designer showcase",
          minimal: "Modern minimalist - clean lines, negative space, zen aesthetic",
          editorial: "Vogue Living editorial - artistic angles, creative composition"
        };
        return styles[style] || styles.architectural;
      };

      const getLightingSpecs = (mode) => {
        const lighting = {
          natural: "Natural window lighting as primary source, warm golden hour ambiance (2700K-3000K)",
          studio: "Professional studio lighting setup with key, fill, and rim lights",
          moody: "Dramatic low-key lighting with deep shadows and selective illumination",
          bright: "High-key lighting with minimal shadows, clean and airy feeling"
        };
        return lighting[mode] || lighting.natural;
      };

      let professionalPrompt = `
Transform this interior design into a PREMIUM, MAGAZINE-QUALITY architectural photography shot worthy of ${getPhotoStyleSpecs(photoStyle)}.

PHOTOGRAPHY SPECIFICATIONS:
- Professional DSLR camera quality (Canon 5D Mark IV with L-series lens)
- Wide-angle perspective (14-24mm) for expansive spatial feeling
- Perfect composition using rule of thirds and leading lines
- Tack-sharp focus with subtle depth of field bokeh
- Professional color grading and post-processing

LIGHTING SETUP:
- ${getLightingSpecs(lightingMode)}
- Soft shadows with professional fill lighting to eliminate harsh contrasts
- Subtle ambient lighting from practical fixtures
- Perfect white balance and color temperature consistency

ULTRA-REALISTIC MATERIAL TEXTURES:
- Fabric: Visible weave patterns, natural draping, realistic textile behavior
- Wood: Authentic grain patterns, natural imperfections, proper aging
- Metal: Realistic patina, brushed finishes, authentic reflective properties
- Stone/Marble: Natural veining, mineral patterns, realistic surface variations
- Leather: Visible grain texture, natural aging, realistic wear patterns
- Glass: Perfect reflections, refractions, and transparency effects

PROFESSIONAL FINISHING TOUCHES:
- Color grading matching luxury interior magazines
- Atmospheric depth with subtle environmental effects
- Natural imperfections that prove authenticity
- Strategic styling with designer accessories and plants
- Lived-in details without clutter
- Perfect symmetry and visual balance

QUALITY STANDARDS:
- 8K resolution equivalent detail
- Print-ready commercial photography quality  
- Zero CGI artifacts or artificial elements
- Professional retouching standards
- Magazine cover-worthy composition

Final result must be indistinguishable from a $5000/day professional interior photographer's portfolio work.`;

      // 사람 삭제 옵션 추가 (실사화)
      if (removePeople) {
        professionalPrompt += `

PEOPLE REMOVAL FOR REALISTIC PHOTO:
- Ensure NO people, human figures, or human-like objects appear in the final image
- Create a completely unoccupied, professional interior photography shot
- Focus on the architectural and design elements only
- Maintain the clean, magazine-quality aesthetic without any human presence`;
      }

      // 3D 모델 적용 옵션 추가 (실사화)
      if (apply3DModels) {
        professionalPrompt += `

3D MODEL REALISTIC INTEGRATION:
- Ensure all 3D furniture models appear as real, physical objects
- Apply realistic lighting and shadows to 3D elements
- Maintain proper scale and proportions for all 3D furniture
- Create seamless integration between 3D models and the room environment
- Ensure 3D models have realistic textures and materials`;
      }
      
      parts.push({ text: professionalPrompt });
      parts.push({
        inlineData: {
          mimeType: 'image/png', // 또는 imageUrl의 실제 MIME 타입 사용
          data: base64Image,
        },
      });

      const payload = {
        contents: [{
            role: "user",
            parts: parts
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        },
      };

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`;

      let attempt = 0;
      const maxAttempts = 5;
      while (attempt < maxAttempts) {
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorBody = await response.text();
            console.error('API Error Response Body (Realistic Gen):', errorBody);
            throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
          }

          const result = await response.json();
          const base64Data = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

          if (base64Data) {
            setRealisticImageUrl(`data:image/png;base64,${base64Data}`);
          } else {
            setError('실사화 이미지 생성에 실패했습니다. 다시 시도해주세요.');
          }
          break;
        } catch (err) {
          console.error(`API 호출 실패 (시도 ${attempt + 1}, Realistic Gen):`, err);
          if (attempt < maxAttempts - 1) {
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            await new Promise(res => setTimeout(res, delay));
          } else {
            setError(`실사화 이미지 생성에 실패했습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요. (오류: ${err.message})`);
          }
        }
        attempt++;
      }

    } catch (err) {
      console.error('실사화 이미지 생성 중 오류 발생:', err);
      setError('실사화 이미지 생성 중 알 수 없는 오류가 발생했습니다.');
    } finally {
      setGeneratingRealistic(false);
    }
  };

  // 이미지 파일 업로드 핸들러
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        setUploadedImage({ data: base64String, mimeType: file.type });
        setError(''); // 파일 업로드 시 이전 오류 메시지 초기화
        setImageUrl(''); // 새 이미지 업로드 시 기존 생성 이미지 초기화
        setRealisticImageUrl(''); // 새 이미지 업로드 시 실사화 이미지 초기화
      };
      reader.onerror = () => {
        setError('파일을 읽는 데 실패했습니다.');
        setUploadedImage(null);
      };
      reader.readAsDataURL(file); // 파일을 Base64로 읽기
    } else {
      setUploadedImage(null);
      setError('이미지 파일만 업로드할 수 있습니다.');
    }
  };


  return (
    <div className="bg-background min-h-auto">
      <div className="space-y-8">
        <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-xl font-bold mb-4 text-text-primary">
            AI 인테리어 디자인 생성기
          </h3>
          
          <form onSubmit={(e) => { e.preventDefault(); generateImage(); }} className="space-y-6">
            {/* 이미지 업로드 (캡쳐된 이미지가 있으면 표시) */}
            <div className="space-y-2">
              <label htmlFor="image-upload" className="block text-sm font-semibold text-text-primary">
                
              </label>
              {!capturedScreenshot && (
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  onChange={handleImageUpload}
                  disabled={loading || generatingRealistic}
                />
              )}
              {uploadedImage && (
                <div className="mt-4 border border-border rounded-xl overflow-hidden shadow-sm">
                  <img
                    src={`data:${uploadedImage.mimeType};base64,${uploadedImage.data}`}
                    alt=""
                    className="w-full h-auto max-h-60 object-contain rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* 기본 침실 스타일 */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">
                스타일
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(bedroomPresets).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedPreset(key)}
                    className={`p-4 border rounded-xl text-left transition-all duration-200 ${
                      selectedPreset === key 
                        ? 'border-primary bg-pink-50 shadow-md' 
                        : 'border-border hover:border-primary hover:bg-window-fill'
                    }`}
                    disabled={loading || generatingRealistic}
                  >
                    <h4 className="font-semibold text-text-primary">{preset.name}</h4>
                    <p className="text-sm text-text-secondary mt-1">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 사용 목적 */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">
                사용 목적 (선택사항)
              </label>
              <div className="grid grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMood('')}
                  className={`p-3 border rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedMood === '' 
                      ? 'border-primary bg-window-fill text-text-primary' 
                      : 'border-border text-text-secondary hover:border-primary'
                  }`}
                  disabled={loading || generatingRealistic}
                >
                  기본
                </button>
                {Object.entries(moodOptions).map(([key, mood]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedMood(key)}
                    className={`p-3 border rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedMood === key 
                        ? 'border-primary bg-pink-50 text-primary' 
                        : 'border-border text-text-secondary hover:border-primary'
                    }`}
                    disabled={loading || generatingRealistic}
                  >
                    {mood.name}
                  </button>
                ))}
              </div>
              {selectedMood && moodOptions[selectedMood] && (
                <p className="text-sm text-text-secondary mt-2">
                  {moodOptions[selectedMood].description}
                </p>
              )}
            </div>

            {/* 가구 배치 방식 */}
            <div className="space-y-2">
              <label htmlFor="furniture-layout" className="block text-sm font-semibold text-text-primary">
                가구 배치 방식
              </label>
              <select
                id="furniture-layout"
                value={furnitureLayout}
                onChange={(e) => setFurnitureLayout(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                disabled={loading || generatingRealistic}
              >
                <option value="keep_existing">기존 배치 유지 (스타일만 변경)</option>
                <option value="add_furniture">기존 배치 + 가구 추가</option>
                <option value="style_optimized">완전 최적화 (가구 추가/재배치)</option>
              </select>
              <p className="text-sm text-text-secondary mt-2">
                <strong>기존 배치 유지</strong>: 현재 가구 위치 그대로, 디자인만 변경<br/>
                <strong>기존 배치 + 가구 추가</strong>: 현재 가구 위치는 유지하되, 추가 가구/소품으로 공간 풍성하게<br/>
                <strong>완전 최적화</strong>: 가구 재배치 + 추가로 스타일에 완벽하게 맞춤
              </p>
            </div>
            {/* 추가 커스텀 요청 */}
            <div className="space-y-2">
              <label htmlFor="custom-prompt" className="block text-sm font-semibold text-text-primary">
                추가 요청 (선택사항)
              </label>
              <textarea
                id="custom-prompt"
                rows="3"
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="예: '책상을 창문 쪽으로 배치', '식물을 많이 넣어주세요', '아늑한 독서 공간 만들어주세요'"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                disabled={loading || generatingRealistic}
              />
            </div>

            {/* 선택된 조합 미리보기 */}
            <div className="p-4 bg-window-fill border border-window-stroke rounded-xl">
              <h4 className="font-semibold text-text-primary mb-2">선택된 조합</h4>
              <div className="text-sm text-text-secondary">
                <p>
                  <strong>스타일:</strong> {bedroomPresets[selectedPreset]?.name}
                </p>
                {selectedMood && (
                  <p>
                    <strong>목적:</strong> {moodOptions[selectedMood]?.name}
                  </p>
                )}
                <p>
                  <strong>배치:</strong> {
                    furnitureLayout === 'keep_existing' ? '기존 배치 유지' :
                    furnitureLayout === 'add_furniture' ? '기존 배치 + 가구 추가' :
                    '완전 최적화'
                  }
                </p>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
                오류: {error}
              </div>
            )}

            {/* 생성 버튼 */}
            <button
              type="submit"
              disabled={loading || generatingRealistic}
              className="w-full bg-primary text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-secondary transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '생성 중...' : '1단계: 인테리어 디자인 생성하기'}
            </button>
          </form>
        </div>

        {/* 생성된 이미지 결과 */}
        {imageUrl && (
          <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-2xl font-bold text-text-primary mb-4 text-center">
              1단계: 생성된 인테리어 디자인
            </h2>
            <div className="relative w-full overflow-hidden rounded-xl shadow-lg border border-border">
              <img
                src={imageUrl}
                alt="생성된 AI 인테리어 디자인 이미지"
                className="w-full h-auto object-cover rounded-xl transition-transform duration-300 hover:scale-105"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/600x400/CCCCCC/333333?text=이미지+로딩+실패';
                  setError('인테리어 디자인 이미지 로드에 실패했습니다.');
                }}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={async () => {
                    try {
                      const res = await uploadGeneratedImageToS3({ imageDataUrl: imageUrl, variant: 'design' });
                      alert('S3 업로드 완료: ' + res.url);
                    } catch (e) {
                      alert('S3 업로드 실패: ' + (e?.message || '오류'));
                    }
                  }}
                  className="flex-1 bg-primary text-white py-3 px-4 rounded-lg text-sm font-semibold hover:bg-secondary"
                >
                  Save
                </button>
                <button
                  onClick={() => downloadDataUrl(imageUrl, `ai-interior-design-${Date.now()}.png`)}
                  className="flex-1 bg-window-fill border border-window-stroke text-text-primary py-3 px-4 rounded-lg text-sm font-semibold"
                >
                  Download
                </button>
              </div>
            </div>
            <p className="text-center text-text-secondary text-sm mt-4">
              AI가 만들어낸 인테리어 디자인입니다.
            </p>

            {/* 실사화 품질 설정 - 1단계 완료 후에만 표시 */}
            <div className="mt-6 p-4 bg-window-fill border border-window-stroke rounded-xl">
              <h3 className="text-lg font-semibold text-text-primary mb-3">실사화 품질 설정</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="photo-style" className="block text-text-primary font-medium mb-2">
                    사진 스타일
                  </label>
                  <select
                    id="photo-style"
                    value={photoStyle}
                    onChange={(e) => setPhotoStyle(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    disabled={loading || generatingRealistic}
                  >
                    <option value="architectural">Architectural Digest - 건축적</option>
                    <option value="lifestyle">Elle Decor - 라이프스타일</option>
                    <option value="luxury">Luxe Interiors - 럭셔리</option>
                    <option value="minimal">Modern Minimal - 미니멀</option>
                    <option value="editorial">Vogue Living - 에디토리얼</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="lighting-mode" className="block text-text-primary font-medium mb-2">
                    조명 모드
                  </label>
                  <select
                    id="lighting-mode"
                    value={lightingMode}
                    onChange={(e) => setLightingMode(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    disabled={loading || generatingRealistic}
                  >
                    <option value="natural">자연광 - 골든아워</option>
                    <option value="studio">스튜디오 조명</option>
                    <option value="moody">무드 조명 - 극적</option>
                    <option value="bright">밝은 조명 - 깔끔</option>
                  </select>
                </div>
              </div>
              
              <p className="text-sm text-primary mt-2">
                설정에 따라 Architectural Digest, Elle Decor 수준의 전문 인테리어 사진이 생성됩니다.
              </p>
            </div>

            {/* 2단계: 실사화 버튼 */}
            <button
              onClick={generateRealisticImage}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg text-white transition-colors shadow-lg hover:shadow-xl mt-6 ${
                generatingRealistic
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-secondary'
              }`}
              disabled={generatingRealistic || loading}
            >
              {generatingRealistic ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12V4a8 8 0 018 8z"></path>
                  </svg>
                  실사 방 사진 생성 중...
                </span>
              ) : (
                '2단계: 실제 방 사진처럼 만들기'
              )}
            </button>

            {/* 실사화된 이미지 결과 */}
            {realisticImageUrl && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-text-primary mb-4 text-center">
                  2단계: 실사화된 방 사진
                </h2>
                <div className="relative w-full overflow-hidden rounded-xl shadow-lg border border-border">
                  <img
                    src={realisticImageUrl}
                    alt="실사화된 AI 인테리어 이미지"
                    className="w-full h-auto object-cover rounded-xl transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/600x400/CCCCCC/333333?text=이미지+로딩+실패';
                      setError('실사화 이미지 로드에 실패했습니다.');
                    }}
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={async () => {
                        try {
                          const res = await uploadGeneratedImageToS3({ imageDataUrl: realisticImageUrl, variant: 'realistic' });
                          alert('S3 업로드 완료: ' + res.url);
                        } catch (e) {
                          alert('S3 업로드 실패: ' + (e?.message || '오류'));
                        }
                      }}
                      className="flex-1 bg-primary text-white py-3 px-4 rounded-lg text-sm font-semibold hover:bg-secondary"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => downloadDataUrl(realisticImageUrl, `ai-interior-realistic-${Date.now()}.png`)}
                      className="flex-1 bg-window-fill border border-window-stroke text-text-primary py-3 px-4 rounded-lg text-sm font-semibold"
                    >
                      Download
                    </button>
                  </div>
                </div>
                <p className="text-center text-text-secondary text-sm mt-4">
                  AI가 만들어낸 실제와 같은 인테리어 사진입니다.
                </p>
              </div>
            )}
          </div>
        )}


        

      </div>
    </div>

  );
};

export default AIInteriorGenerator;
