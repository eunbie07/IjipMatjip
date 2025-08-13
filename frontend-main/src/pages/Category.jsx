import React, { useState, useEffect, useMemo } from 'react';
import { Check, Palette } from 'lucide-react';
import StyleTab from '../components/categories/StyleTab';
import ImageSlider from '../components/categories/ImageSlider'
import MessageBox from '../components/categories/MessageBox'
import { styleImagesData, styleLabels } from '../datas/styleData';

// --- category 컴포넌트 ---
export default function CategoryPage() {
  const [activeStyle, setActiveStyle] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [message, setMessage] = useState('');

  const imagesForSlider = useMemo(() => {
    if (activeStyle === 'all') {
      return Object.values(styleImagesData).flat();
    }
    return styleImagesData[activeStyle] || [];
  }, [activeStyle]);
  
  useEffect(() => {
    setSelectedImage(null);
  }, [activeStyle]);

  const handleImageSelect = (image) => {
    setSelectedImage(prev => (prev?.id === image.id ? null : image))
  };

  const handleGenerate = () => {
    if (!selectedImage) return;
    const alertMessage = `'${styleLabels[selectedImage.styleKey]}' 스타일의 '${selectedImage.alt}' 이미지를 참조하여 AI 이미지 생성을 시작합니다!`;
    setMessage(alertMessage);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans overflow-x-hidden">
        <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <header className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3">
                🏠 원하는 인테리어 스타일을 선택하세요
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                마음에 드는 스타일을 선택하고, AI가 만들어주는 당신만의 공간을 경험해보세요.
            </p>
            </header>

            <main>
            <StyleTab
                styles={Object.keys(styleLabels)}
                activeStyle={activeStyle}
                onStyleChange={setActiveStyle}
                styleLabels={styleLabels}
            />

            <ImageSlider
                images={imagesForSlider}
                selectedImage={selectedImage}
                onImageSelect={handleImageSelect}
            />

            <footer className="mt-8 sm:mt-12 text-center">
                {selectedImage && (
                <div className="mb-6 mr-4 p-4 bg-[#ff7e97]/10 border border-[#ff7e97]/20 rounded-lg inline-block animate-fade-in">
                    <p className="font-semibold text-[#c55a70]">
                    <Check className="inline-block w-5 h-5 mr-2" />
                    선택됨: {selectedImage.alt}
                    </p>
                </div>
                )}
                <button
                onClick={handleGenerate}
                disabled={!selectedImage}
                className={`px-8 py-4 rounded-lg font-bold text-lg text-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff7e97] ${
                    selectedImage
                    ? 'bg-[#ff7e97] hover:bg-[#ff6b87] shadow-lg hover:shadow-xl'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                >
                <Palette className="inline-block w-6 h-6 mr-2" />
                이 스타일로 생성하기
                </button>
            </footer>
            </main>
        </div>
        
        <MessageBox message={message} onClose={() => setMessage('')} />
    </div>
  );
}

const style = document.createElement('style');
style.innerHTML = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.5s ease-out forwards;
  }
`;
document.head.appendChild(style);