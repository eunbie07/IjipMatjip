import React, { useState, useEffect, useMemo } from 'react';
import { Check, Palette, ChevronLeft, ChevronRight } from 'lucide-react';

// --- 이미지 데이터 ---
// 1. src/assets/images 폴더의 실제 이미지들을 import 합니다.
import modernImg1 from './assets/images/Modern1.png';
import modernImg2 from './assets/images/Modern2.png';
import modernImg3 from './assets/images/Modern3.png';
import scandinavianImg1 from './assets/images/Scandinavian1.png';
import scandinavianImg2 from './assets/images/Scandinavian2.png';
import scandinavianImg3 from './assets/images/Scandinavian3.png';
import industrialImg1 from './assets/images/Industrial1.png';
import industrialImg2 from './assets/images/Industrial2.png';
import industrialImg3 from './assets/images/Industrial3.png';
import bohemianImg1 from './assets/images/Bohemain1.png'; // 파일명에 맞춰 Bohemain으로 작성
import bohemianImg2 from './assets/images/Bohemain2.png';
import bohemianImg3 from './assets/images/Bohemain3.png';


// 2. import한 이미지들을 데이터 객체에 연결합니다.
const styleImagesData = {
  modern: [
    { id: 'modern-1', src: modernImg1, alt: '모던 미니멀리스트 1' },
    { id: 'modern-2', src: modernImg2, alt: '모던 미니멀리스트 2' },
    { id: 'modern-3', src: modernImg3, alt: '모던 미니멀리스트 3' },
  ],
  scandinavian: [
    { id: 'scandinavian-1', src: scandinavianImg1, alt: '스칸디나비안 1' },
    { id: 'scandinavian-2', src: scandinavianImg2, alt: '스칸디나비안 2' },
    { id: 'scandinavian-3', src: scandinavianImg3, alt: '스칸디나비안 3' },
  ],
  industrial: [
    { id: 'industrial-1', src: industrialImg1, alt: '인더스트리얼 1' },
    { id: 'industrial-2', src: industrialImg2, alt: '인더스트리얼 2' },
    { id: 'industrial-3', src: industrialImg3, alt: '인더스트리얼 3' },
  ],
  bohemian: [
    { id: 'bohemian-1', src: bohemianImg1, alt: '보헤미안 내추럴 1' },
    { id: 'bohemian-2', src: bohemianImg2, alt: '보헤미안 내추럴 2' },
    { id: 'bohemian-3', src: bohemianImg3, alt: '보헤미안 내추럴 3' },
  ],
};

// --- 스타일 레이블 ---
const styleLabels = {
  all: '전체',
  modern: '모던/미니멀리스트',
  scandinavian: '스칸디나비안',
  industrial: '인더스트리얼',
  bohemian: '보헤미안/내추럴',
};


// --- 스타일 탭 컴포넌트 ---
const StyleTab = ({ styles, activeStyle, onStyleChange, styleLabels }) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
      {styles.map((style) => (
        <button
          key={style}
          onClick={() => onStyleChange(style)}
          className={`px-4 py-2 sm:px-6 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff7e97] ${
            activeStyle === style
              ? 'bg-[#ff7e97] text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 hover:border-gray-400'
          }`}
        >
          {styleLabels[style]}
        </button>
      ))}
    </div>
  );
};

// --- 커버플로우 이미지 슬라이더 컴포넌트 (무한 루프 적용) ---
const ImageSlider = ({ images, selectedImage, onImageSelect }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // 자동 슬라이드 (로직 변경 없음)
    useEffect(() => {
        if (images.length > 1) {
            const timer = setInterval(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
            }, 3000);
            return () => clearInterval(timer);
        }
    }, [images.length]);

    // 필터링 시 인덱스 초기화 (로직 변경 없음)
    useEffect(() => {
        setCurrentIndex(0);
    }, [images]);

    const prevSlide = () => {
        if (images.length < 2) return;
        setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };

    const nextSlide = () => {
        if (images.length < 2) return;
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    };
    
    const handleItemClick = (index) => {
        if (index === currentIndex) {
            onImageSelect(images[index]);
        } else {
            setCurrentIndex(index);
        }
    };

    if (images.length === 0) {
        return <div className="text-center p-8">표시할 이미지가 없습니다.</div>;
    }

    return (
        <div className="relative w-full max-w-4xl mx-auto" style={{ height: '50vh', minHeight: '400px' }}>
            {/* 슬라이더 컨테이너 */}
            <div className="relative h-full flex items-center justify-center">
                {images.map((image, index) => {
                    // --- 무한 루프를 위한 로직 변경 ---
                    const numImages = images.length;
                    let offset = index - currentIndex;

                    // 현재 이미지와의 거리가 절반보다 크면 반대쪽으로 넘겨서 거리를 좁힘
                    if (numImages > 2) { // 이미지가 3개 이상일 때만 무한루프 로직 적용
                        if (offset > numImages / 2) {
                            offset -= numImages;
                        } else if (offset < -numImages / 2) {
                            offset += numImages;
                        }
                    }
                    
                    const isCurrent = offset === 0;
                    // 시야에서 벗어난 이미지는 숨겨서 성능과 디자인을 개선
                    const isVisible = Math.abs(offset) <= 2; // 중앙 이미지와 좌우 2개씩만 보이게 함

                    const transform = `translateX(${offset * 40}%) scale(${isCurrent ? 1 : 0.7}) rotateY(${offset * -15}deg)`;
                    const zIndex = numImages - Math.abs(offset);
                    const opacity = isVisible ? (isCurrent ? 1 : 0.5) : 0;
                    const pointerEvents = isVisible ? 'auto' : 'none'; // 보이지 않는 이미지는 클릭 불가

                    return (
                        <div
                            key={image.id + '-' + index} // 중복 이미지에 대비해 key를 더 고유하게 만듦
                            className="absolute w-3/5 h-4/5 transition-all duration-500 ease-out"
                            style={{ transform, zIndex, opacity, perspective: '1000px', pointerEvents }}
                            onClick={() => handleItemClick(index)}
                        >
                            <img
                                src={image.src}
                                alt={image.alt}
                                className="w-full h-full object-cover cursor-pointer rounded-lg shadow-2xl"
                            />
                            {selectedImage?.id === image.id && (
                                <div className="absolute inset-0 ring-4 ring-offset-4 ring-[#ff7e97] rounded-lg pointer-events-none">
                                    <div className="absolute top-3 right-3 bg-[#ff7e97] text-white rounded-full p-2 shadow-md">
                                        <Check className="w-5 h-5" />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 이전/다음 버튼 */}
            {images.length > 1 && <>
                <button onClick={prevSlide} className="absolute top-1/2 left-0 sm:-left-4 transform -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 transition-all shadow-md z-50">
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                <button onClick={nextSlide} className="absolute top-1/2 right-0 sm:-right-4 transform -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 transition-all shadow-md z-50">
                    <ChevronRight className="w-6 h-6 text-gray-800" />
                </button>
            </>}
            
            {/* 인디케이터 */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                    <button key={index} onClick={() => setCurrentIndex(index)} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-gray-800 scale-125' : 'bg-gray-800/50'}`}></button>
                ))}
            </div>
        </div>
    );
};

// --- 알림 메시지 컴포넌트 ---
const MessageBox = ({ message, onClose }) => {
    if (!message) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-sm text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#ff7e97]/20 mb-4">
                    <Palette className="h-6 w-6 text-[#ff7e97]" />
                </div>
                <h3 className="text-lg leading-6 font-bold text-gray-900 mb-2">알림</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6">{message}</p>
                <button
                    onClick={onClose}
                    className="w-full bg-[#ff7e97] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#ff6b87] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff7e97]"
                >
                    확인
                </button>
            </div>
        </div>
    );
};


// --- 메인 App 컴포넌트 ---
export default function App() {
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
    if (selectedImage?.id === image.id) {
      setSelectedImage(null);
    } else {
      setSelectedImage(image);
    }
  };

  const handleGenerate = () => {
    if (!selectedImage) return;
    const selectedStyleKey = Object.keys(styleImagesData).find(key => styleImagesData[key].some(img => img.id === selectedImage.id));
    const alertMessage = `'${styleLabels[selectedStyleKey]}' 스타일의 '${selectedImage.alt}' 이미지를 참조하여 AI 이미지 생성을 시작합니다!`;
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
                <div className="mb-6 p-4 bg-[#ff7e97]/10 border border-[#ff7e97]/20 rounded-lg inline-block animate-fade-in">
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
