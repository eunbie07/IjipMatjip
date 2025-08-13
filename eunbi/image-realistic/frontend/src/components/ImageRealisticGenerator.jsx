import { useState } from 'react';
import FileUpload from './FileUpload';
import ResultGrid from './ResultGrid';

const ImageRealisticGenerator = () => {
  const [provider, setProvider] = useState('style-transfer');
  const [style, setStyle] = useState('scandinavian');
  const [jsonFile, setJsonFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [control, setControl] = useState('canny');
  const [compositeProvider, setCompositeProvider] = useState('vertex');
  const [styleTransferProvider, setStyleTransferProvider] = useState('flux'); // 새 기능의 Provider 상태
  const [mode, setMode] = useState('strict');
  const [alpha, setAlpha] = useState(0.6);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const showJsonRow = provider === 'composite' || provider === 'vertex-json' || provider === 'korean-style';
  const showImageRow = provider === 'composite' || provider.includes('-image') || provider === 'korean-style' || provider === 'style-transfer';
  const showCompositeSettings = provider === 'composite';
  const showStyleSelection = provider !== 'korean-style';
  const showStyleTransferSettings = provider === 'style-transfer'; // 새 기능의 설정 표시 여부

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (provider === 'style-transfer') {
        await handleStyleTransferSubmit();
      } else if (provider === 'korean-style') {
        await handleKoreanStyleSubmit();
      } else if (provider === 'composite') {
        await handleCompositeSubmit();
      } else if (provider === 'vertex-json') {
        await handleJsonSubmit();
      } else {
        await handleImageSubmit();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStyleTransferSubmit = async () => {
    if (!imageFile) {
      throw new Error('스타일 변환을 위한 이미지 파일을 선택해주세요.');
    }

    const fd = new FormData();
    fd.append('image', imageFile);
    fd.append('style', style);
    fd.append('provider', styleTransferProvider); // 선택된 Provider 사용

    const apiUrl = 'http://localhost:8000/api/interior-style-transfer';
    const res = await fetch(apiUrl, {
      method: 'POST',
      body: fd,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`서버 오류: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    setResults(data.images.map(url => ({ url, title: `🎨 AI Style Transfer (${styleTransferProvider}) - ${style}` })));
  };

  const handleKoreanStyleSubmit = async () => {
    if (!jsonFile || !imageFile) {
      throw new Error('JSON 파일과 이미지 파일을 모두 선택해주세요.');
    }

    const jsonText = await readFileAsText(jsonFile);
    const jsonData = JSON.parse(jsonText);
    const sceneData = jsonData.scene || jsonData;

    const fd = new FormData();
    fd.append('scene_json', JSON.stringify(sceneData));
    fd.append('capture', imageFile);
    fd.append('style', 'korean_modern');
    fd.append('provider', compositeProvider === 'vertex' ? 'vertex' : 'flux');

    const apiUrl = 'http://localhost:8000/api/v2/generate-room';
    const res = await fetch(apiUrl, {
      method: 'POST',
      body: fd,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`서버 오류: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    setResults(data.images.map(url => ({ url, title: `🏗️ V2 Layout-First (${compositeProvider}) - 구조보존` })));
  };

  const handleCompositeSubmit = async () => {
    if (!jsonFile || !imageFile) {
      throw new Error('JSON 파일과 이미지 파일을 모두 선택해주세요.');
    }

    const jsonText = await readFileAsText(jsonFile);
    const jsonData = JSON.parse(jsonText);
    const sceneData = jsonData.scene || jsonData;

    const fd = new FormData();
    fd.append('scene_json', JSON.stringify(sceneData));
    fd.append('capture', imageFile);
    fd.append('style', style);
    fd.append('control', control);
    fd.append('provider', compositeProvider);
    fd.append('mode', mode);
    fd.append('alpha', alpha.toString());

    const apiUrl = 'http://localhost:8000/api/v2/generate-room';
    const res = await fetch(apiUrl, {
      method: 'POST',
      body: fd,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`서버 오류: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    setResults(data.images.map(url => ({ url, title: `🚀 Composite (${compositeProvider}) - ${style}` })));
  };

  const handleJsonSubmit = async () => {
    if (!jsonFile) {
      throw new Error('JSON 파일을 선택해주세요.');
    }

    const jsonText = await readFileAsText(jsonFile);
    const jsonData = JSON.parse(jsonText);
    const sceneData = jsonData.scene;
    
    if (!sceneData) {
      throw new Error('JSON 파일에 "scene" 키가 없습니다.');
    }

    const apiUrl = `http://localhost:8000/api/realistic-room-vertex?style=${style}`;
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sceneData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`서버 오류: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    setResults(data.images.map(url => ({ url, title: `Vertex AI (JSON) - ${style}` })));
  };

  const handleImageSubmit = async () => {
    if (!imageFile) {
      throw new Error('이미지 파일을 선택해주세요.');
    }

    const fd = new FormData();
    fd.append('image', imageFile);
    fd.append('style', style);
    fd.append('provider', provider.replace('-image', ''));

    const apiUrl = 'http://localhost:8000/api/realistic-room-upload';
    const res = await fetch(apiUrl, { method: 'POST', body: fd });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`서버 오류: ${res.status} - ${errorText}`);
    }
    
    const data = await res.json();
    setResults(data.images.map(url => ({ url, title: `${provider.replace('-image', '')} (Image) - ${style}` })));
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기능 선택 */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-primary">기능 선택</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            >
              <option value="style-transfer">🎨 AI 인테리어 스타일 변환 (3D 렌더)</option>
              <option value="korean-style">🇰🇷 Korean Style (실사화)</option>
              <option value="composite">🚀 Composite (JSON + Image 실사화)</option>
              <option value="vertex-json">Vertex AI (JSON 실사화)</option>
              <option value="replicate-image">Replicate (Image 실사화)</option>
              <option value="stability-image">Stability (Image 실사화)</option>
            </select>
          </div>

          {/* JSON 업로드 */}
          {showJsonRow && (
            <FileUpload
              label="JSON 레이아웃 파일"
              accept=".json"
              icon="📄"
              description="JSON 파일을 선택하세요"
              file={jsonFile}
              onFileChange={setJsonFile}
            />
          )}

          {/* 이미지 업로드 */}
          {showImageRow && (
            <FileUpload
              label={provider === 'style-transfer' ? "3D 렌더링 이미지" : "스크린샷 이미지"}
              accept="image/*"
              icon="🖼️"
              description="이미지 파일을 선택하세요"
              file={imageFile}
              onFileChange={setImageFile}
            />
          )}

          {/* 스타일 변환 기능 전용 설정 */}
          {showStyleTransferSettings && (
            <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <label className="block text-sm font-semibold text-text-primary">AI Provider (스타일 변환용)</label>
              <select
                value={styleTransferProvider}
                onChange={(e) => setStyleTransferProvider(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                <option value="flux">🚀 FLUX Ultra (고해상도)</option>
                <option value="vertex">🔵 Vertex AI</option>
                <option value="replicate">🔄 Replicate</option>
              </select>
            </div>
          )}

          {/* Style 선택 */}
          {showStyleSelection && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">인테리어 스타일</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                <option value="scandinavian">🏠 Scandinavian (스칸디나비안)</option>
                <option value="modern">✨ Modern (모던)</option>
                <option value="bohemian">🌿 Bohemian (보헤미안)</option>
                <option value="japanese">🎌 Japanese (일본식)</option>
              </select>
            </div>
          )}

          {/* Composite 고급 설정 */}
          {showCompositeSettings && (
            <div className="space-y-6 p-6 bg-window-fill border border-window-stroke rounded-xl">
              <h3 className="text-lg font-semibold text-text-primary">고급 설정</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-text-primary">Control Method</label>
                  <select
                    value={control}
                    onChange={(e) => setControl(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  >
                    <option value="canny">🖋️ Canny Edge (권장)</option>
                    <option value="depth">📏 Depth Control</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-text-primary">AI Provider</label>
                  <select
                    value={compositeProvider}
                    onChange={(e) => setCompositeProvider(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  >
                    <option value="vertex">🔵 Vertex AI (권장)</option>
                    <option value="flux">🚀 FLUX Ultra (고해상도)</option>
                    <option value="replicate">🔄 Replicate</option>
                    <option value="stability">⚡ Stability AI</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-text-primary">변환 모드</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  >
                    <option value="strict">🔒 Strict (구조 완전 고정)</option>
                    <option value="interpretive">🎨 Interpretive (약간의 변형 허용)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-text-primary">
                    투명도: <span className="text-primary">{alpha}</span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={alpha}
                    onChange={(e) => setAlpha(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
              {error}
            </div>
          )}

          {/* 생성 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-secondary transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '생성 중...' : '✨ AI 인테리어 생성하기'}
          </button>
        </form>
      </div>

      {/* 결과 그리드 */}
      <ResultGrid results={results} isLoading={isLoading} />
    </div>
  );
};

export default ImageRealisticGenerator;