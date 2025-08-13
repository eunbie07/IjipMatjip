import React, { useState, useEffect } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import LazyImage from './LazyImage';

const ImageSlider = ({ images, selectedImage, onImageSelect }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    // 마우스 호버 상태를 추적하는 state 추가
    const [isHovering, setIsHovering] = useState(false);

    // 필터링 시 인덱스가 초기화되도록 합니다.
    useEffect(() => {
        setCurrentIndex(0);
    }, [images]);

    const nextSlide = () => {
        if (images.length < 2) return;
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    // --- 자동 슬라이드 로직 추가 ---
    useEffect(() => {
        // 마우스가 호버 중이거나 이미지가 1개 이하면 자동 슬라이드를 멈춥니다.
        if (isHovering || images.length <= 1) {
            return;
        }

        const timer = setInterval(() => {
            nextSlide();
        }, 3000); // 3초마다 슬라이드 변경

        // 컴포넌트가 언마운트되거나 의존성이 변경될 때 타이머를 정리합니다.
        return () => clearInterval(timer);
    }, [currentIndex, isHovering, images.length]); // currentIndex가 바뀌어도 타이머를 재시작하여 안정적으로 동작

    // --- 스마트 프리로딩 로직 (기존과 동일) ---
    useEffect(() => {
        if (images.length > 1) {
            const nextIndex = (currentIndex + 1) % images.length;
            const prevIndex = (currentIndex - 1 + images.length) % images.length;

            if (images[nextIndex]) {
                images[nextIndex].src();
            }
            if (images[prevIndex]) {
                images[prevIndex].src();
            }
        }
    }, [currentIndex, images]);

    const prevSlide = () => {
        if (images.length < 2) return;
        setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
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
        <div 
            className="relative w-full max-w-4xl mx-auto" 
            style={{ height: '50vh', minHeight: '400px' }}
            // 마우스 진입/이탈 시 isHovering 상태를 변경합니다.
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div className="relative h-full flex items-center justify-center" style={{ perspective: '1000px' }}>
                {images.map((image, index) => {
                    const numImages = images.length;
                    let offset = index - currentIndex;

                    if (numImages > 2) {
                        if (offset > numImages / 2) offset -= numImages;
                        else if (offset < -numImages / 2) offset += numImages;
                    }
                    
                    const isCurrent = offset === 0;
                    const isVisible = Math.abs(offset) <= 2;

                    const transform = `translateX(${offset * 40}%) scale(${isCurrent ? 1 : 0.7}) rotateY(${offset * -15}deg)`;
                    const zIndex = numImages - Math.abs(offset);
                    const opacity = isVisible ? 1 : 0;
                    const pointerEvents = isVisible ? 'auto' : 'none';

                    return (
                        <div
                            key={image.id + '-' + index}
                            className="absolute w-3/5 h-4/5 transition-all duration-500 ease-out cursor-pointer"
                            style={{ transform, zIndex, opacity, pointerEvents }}
                            onClick={() => handleItemClick(index)}
                        >
                            <LazyImage
                                src={image.src}
                                alt={image.alt}
                                className="shadow-2xl"
                            />
                            {selectedImage?.id === image.id && isCurrent && (
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

            {images.length > 1 && <>
                <button onClick={prevSlide} className="absolute top-1/2 left-0 sm:-left-4 transform -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 transition-all shadow-md z-50">
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                <button onClick={nextSlide} className="absolute top-1/2 right-0 sm:-right-4 transform -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 transition-all shadow-md z-50">
                    <ChevronRight className="w-6 h-6 text-gray-800" />
                </button>
            </>}
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                    <button key={index} onClick={() => setCurrentIndex(index)} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-gray-800 scale-125' : 'bg-gray-800/50'}`}></button>
                ))}
            </div>
        </div>
    );
};
export default ImageSlider;
