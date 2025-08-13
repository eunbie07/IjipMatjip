import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase 설정은 Canvas 환경에서 자동으로 제공됩니다.
// 앱이 실행될 때 __firebase_config 변수를 통해 설정이 주입됩니다.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

function App() {
  // 세분화된 입력 상태 변수들
  const [overallStyle, setOverallStyle] = useState(''); // 전체적인 스타일
  const [furniture, setFurniture] = useState('');     // 가구 (침대, 서랍장 등)
  const [wallpaper, setWallpaper] = useState('');     // 벽지
  const [floor, setFloor] = useState('');             // 바닥
  const [deskDetails, setDeskDetails] = useState(''); // 책상 관련 상세 지시

  const [uploadedImage, setUploadedImage] = useState(null); // 업로드된 이미지 파일 (Base64)
  const [imageUrl, setImageUrl] = useState(''); // 첫 번째 생성된 이미지 URL (AI 디자인)
  const [realisticImageUrl, setRealisticImageUrl] = useState(''); // 두 번째 생성된 이미지 URL (실사화된 이미지)
  
  const [loading, setLoading] = useState(false); // 첫 번째 생성 로딩 상태
  const [generatingRealistic, setGeneratingRealistic] = useState(false); // 두 번째(실사화) 생성 로딩 상태
  const [error, setError] = useState(''); // 에러 메시지
  const [authReady, setAuthReady] = useState(false); // Firebase 인증 준비 상태

  useEffect(() => {
    // Firebase 앱 초기화
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app); // Firestore는 현재 사용하지 않지만, 미래 확장을 위해 초기화

    // Firebase 인증 상태 변경 리스너
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try {
          // 사용자가 로그인되어 있지 않으면 익명으로 로그인
          await signInAnonymously(auth);
          console.log('익명 로그인 성공!');
        } catch (error) {
          console.error('익명 로그인 실패:', error);
          setError('로그인에 실패했습니다. 다시 시도해주세요.');
        }
      }
      setAuthReady(true); // 인증 준비 완료
    });

    // 컴포넌트 언마운트 시 리스너 해제
    return () => unsubscribe();
  }, []);

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

  // 첫 번째 이미지 생성 함수 (AI 인테리어 디자인)
  const generateImage = async () => {
    // 입력 필드가 모두 비어있고, 이미지도 없으면 오류
    if (!overallStyle.trim() && !furniture.trim() && !wallpaper.trim() && !floor.trim() && !deskDetails.trim() && !uploadedImage) {
      setError('인테리어 스타일 설명 또는 이미지를 업로드해주세요.');
      return;
    }
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

      // 세분화된 입력 필드의 내용을 조합하여 프롬프트 생성
      let detailedPrompt = '';
      if (overallStyle.trim()) {
        detailedPrompt += `${overallStyle.trim()} 스타일로. `;
      }
      if (furniture.trim()) {
        detailedPrompt += `가구는 ${furniture.trim()}으로. `;
      }
      if (wallpaper.trim()) {
        detailedPrompt += `벽지는 ${wallpaper.trim()}으로. `;
      }
      if (floor.trim()) {
        detailedPrompt += `바닥은 ${floor.trim()}으로. `;
      }
      if (deskDetails.trim()) { // 책상 상세 지시 추가
        detailedPrompt += `책상은 ${deskDetails.trim()}으로. `;
      } else { // 책상 상세 지시가 없으면 기본값 포함
        detailedPrompt += `책상 위의 모든 물건을 깨끗하게 치워주세요. 책상은 심플한 디자인의 흰색으로 변경해주세요.`;
      }

      // 최종 프롬프트 구성
      let finalPromptText = '';
      if (!detailedPrompt.trim()) {
        finalPromptText = '모던하고 깔끔한 스타일. 새로운 가구, 현대적인 벽지, 밝은 톤의 바닥으로 변경.';
      } else {
        finalPromptText = `기존 가구, 벽지, 바닥을 제거하고 다음 설명을 바탕으로 인테리어를 변경해주세요: ${detailedPrompt}`;
      }
      
      // 첫 번째 생성 시에도 어느 정도 사실감 지시 포함
      finalPromptText += ` 실제 방처럼 자연스럽게 렌더링해주세요.`;

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

      const apiKey = process.env.REACT_APP_GEMINI_API_KEY; 
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

      // 첫 번째 생성된 이미지를 입력으로 사용하며, 사실감을 최대한 강조하는 프롬프트 사용
      parts.push({ text: '이 인테리어 디자인 이미지를 실제 방 사진처럼 고품질로 사실적으로 렌더링해주세요. 자연스러운 조명, 그림자, 깊이감, 현실적인 질감을 추가하여 전문적인 사진처럼 보이도록 해주세요. 어떤 컴퓨터 그래픽이나 3D 렌더링된 아티팩트도 남기지 마세요.' }); // 사실감 지시 강화
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

      const apiKey = process.env.REACT_APP_GEMINI_API_KEY; 
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

  if (!authReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="text-xl text-gray-700">인증 준비 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Tailwind CSS CDN 스크립트 (React에서는 필요하지 않지만 HTML 앱에서는 필요) */}
      <script src="https://cdn.tailwindcss.com"></script>
      {/* Inter 폰트 설정 */}
      <style>
        {`
          body {
            font-family: 'Inter', sans-serif;
          }
        `}
      </style>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-gray-200">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-800 mb-6">
          ✨ AI 인테리어 디자인 생성기 ✨
        </h1>
        <p className="text-center text-gray-600 mb-8 text-base sm:text-lg">
          기존 이미지와 함께 원하는 인테리어 스타일을 입력하고, AI가 만들어주는 멋진 이미지를 감상하세요!
        </p>

        <div className="mb-6">
          <label htmlFor="image-upload" className="block text-gray-700 text-lg font-semibold mb-2">
            🖼️ 인테리어에 참고할 이미지 업로드 (선택 사항)
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-base sm:text-lg"
            onChange={handleImageUpload}
            disabled={loading || generatingRealistic}
          />
          {uploadedImage && (
            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <img
                src={`data:${uploadedImage.mimeType};base64,${uploadedImage.data}`}
                alt="업로드된 이미지 미리보기"
                className="w-full h-auto max-h-60 object-contain rounded-lg"
              />
              <p className="text-center text-gray-500 text-sm mt-2 p-2">
                업로드된 이미지 미리보기
              </p>
            </div>
          )}
        </div>

        {/* 세분화된 입력 필드들 */}
        <div className="mb-6">
          <label htmlFor="overall-style-input" className="block text-gray-700 text-lg font-semibold mb-2">
            🏠 전체적인 스타일:
          </label>
          <input
            id="overall-style-input"
            type="text"
            className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-base sm:text-lg"
            placeholder="예: '모던하고 미니멀한', '인더스트리얼한'"
            value={overallStyle}
            onChange={(e) => setOverallStyle(e.target.value)}
            disabled={loading || generatingRealistic}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="furniture-input" className="block text-gray-700 text-lg font-semibold mb-2">
            🛏️ 가구 (종류 및 디자인):
          </label>
          <input
            id="furniture-input"
            type="text"
            className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-base sm:text-lg"
            placeholder="예: '금속 프레임 침대, 가죽 의자'"
            value={furniture}
            onChange={(e) => setFurniture(e.target.value)}
            disabled={loading || generatingRealistic}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="wallpaper-input" className="block text-gray-700 text-lg font-semibold mb-2">
            🌈 벽지 (색상과 질감):
          </label>
          <input
            id="wallpaper-input"
            type="text"
            className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-base sm:text-lg"
            placeholder="예: '베이지 톤의 따뜻한 느낌', '회색 콘크리트 질감'"
            value={wallpaper}
            onChange={(e) => setWallpaper(e.target.value)}
            disabled={loading || generatingRealistic}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="floor-input" className="block text-gray-700 text-lg font-semibold mb-2">
            🪵 바닥 (재질과 색상):
          </label>
          <input
            id="floor-input"
            type="text"
            className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-base sm:text-lg"
            placeholder="예: '카펫 없는 밝은 마루', '어두운 대리석 타일'"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            disabled={loading || generatingRealistic}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="desk-details-input" className="block text-gray-700 text-lg font-semibold mb-2">
            🖥️ 책상 (물건 및 스타일):
          </label>
          <input
            id="desk-details-input"
            type="text"
            className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-base sm:text-lg"
            placeholder="예: '책상 위의 모든 물건을 치우고 깔끔한 표면으로 해주세요. 심플한 디자인의 흰색 책상으로 변경.'"
            value={deskDetails}
            onChange={(e) => setDeskDetails(e.target.value)}
            disabled={loading || generatingRealistic}
          />
        </div>


        <button
          onClick={generateImage}
          className={`w-full py-3 sm:py-4 px-6 rounded-xl font-bold text-white text-lg sm:text-xl transition-all duration-300 ease-in-out
            ${loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg transform hover:-translate-y-1'
            }`}
          disabled={loading || generatingRealistic}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12V4a8 8 0 018 8z"></path>
              </svg>
              인테리어 디자인 생성 중...
            </span>
          ) : (
            '🖼️ 1단계: 인테리어 디자인 생성하기'
          )}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm sm:text-base">
            🚨 오류: {error}
          </div>
        )}

        {imageUrl && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              🎉 1단계: 생성된 인테리어 디자인
            </h2>
            <div className="relative w-full overflow-hidden rounded-xl shadow-lg border border-gray-200">
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
            </div>
            <p className="text-center text-gray-500 text-sm mt-4">
              AI가 만들어낸 인테리어 디자인입니다.
            </p>

            {/* 2단계: 실사화 버튼 및 이미지 영역 */}
            <button
              onClick={generateRealisticImage}
              className={`w-full py-3 sm:py-4 px-6 rounded-xl font-bold text-white text-lg sm:text-xl transition-all duration-300 ease-in-out mt-6
                ${generatingRealistic
                  ? 'bg-purple-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 shadow-md hover:shadow-lg transform hover:-translate-y-1'
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
                '📸 2단계: 실제 방 사진처럼 만들기'
              )}
            </button>

            {realisticImageUrl && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                  ✨ 2단계: 실사화된 방 사진
                </h2>
                <div className="relative w-full overflow-hidden rounded-xl shadow-lg border border-gray-200">
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
                </div>
                <p className="text-center text-gray-500 text-sm mt-4">
                  AI가 만들어낸 실제와 같은 인테리어 사진입니다.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
