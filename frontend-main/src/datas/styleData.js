// --- 설정 (Configuration) ---
// 스타일 정보를 한 곳에서 관리합니다.
// key: 데이터 처리에 사용될 고유 키
// label: UI에 표시될 한글 이름
// altBase: 이미지 alt 태그에 사용될 기본 텍스트
// fileName: 실제 파일명과 key가 다를 경우 (e.g., 오타 대응)
export const STYLE_CONFIG = {
  modern: { key: 'modern', label: '모던/미니멀리스트', altBase: '모던 미니멀리스트' },
  scandinavian: { key: 'scandinavian', label: '스칸디나비안', altBase: '스칸디나비안' },
  industrial: { key: 'industrial', label: '인더스트리얼', altBase: '인더스트리얼' },
  bohemian: { key: 'bohemian', label: '보헤미안/내추럴', altBase: '보헤미안 내추럴', fileName: 'Bohemian' },
};

// --- 동적 이미지 로더 ---
// Vite의 기능을 사용해 이미지들을 한번에 가져옵니다.
const imageModules = import.meta.glob('../assets/images/*.png');

// --- 동적 데이터 생성 ---
const generateImageData = () => {
  const imageData = {};
  Object.keys(STYLE_CONFIG).forEach(key => {
    imageData[key] = [];
  });

  for (const path in imageModules) {
    const match = path.match(/\/([a-zA-Z]+)(\d+)\.png$/);

    if (!match) continue;
    const [, name, num] = match;

    // BUG FIX: 비교 시 양쪽 모두 소문자로 변경하여 대소문자 구분 문제를 해결합니다.
    const styleConfig = Object.values(STYLE_CONFIG).find(
      c => (c.fileName || c.key).toLowerCase() === name.toLowerCase()
    );

    if (styleConfig) {
      imageData[styleConfig.key].push({
        id: `${styleConfig.key}-${num}`,
        src: imageModules[path],
        alt: `${styleConfig.altBase} ${num}`,
        styleKey: styleConfig.key,
      });
    }
  }
  return imageData;
};

// --- 내보낼 데이터 ---
export const styleImagesData = generateImageData();

export const styleLabels = {
  all: '전체',
  ...Object.fromEntries(Object.values(STYLE_CONFIG).map(s => [s.key, s.label]))
};
