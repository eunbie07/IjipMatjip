import React, { useState, useEffect } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import LazyImage from './LazyImage';

const ImageSlider = ({ images, selectedImage, onImageSelect }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        setCurrentIndex(0);
    }, [images]);

    const nextSlide = () => {
        if (images.length < 2) return;
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    useEffect(() => {
        if (isHovering || images.length <= 1) {
            return;
        }
        const timer = setInterval(nextSlide, 3000);
        return () => clearInterval(timer);
    }, [currentIndex, isHovering, images.length]);

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
