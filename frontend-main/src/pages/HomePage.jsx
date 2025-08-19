import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { styleImagesData, STYLE_CONFIG } from "../datas/styleData";
import ImageSlider from "../components/categories/ImageSlider";
import {
  UploadCloud,
  ScanSearch,
  Cuboid,
  Star,
  Quote,
  HeartHandshake,
  Search,
  Layout,
} from "lucide-react";

import avatarFemale1 from "../assets/images/avatars/avatar_female_1.png";
import avatarMale1 from "../assets/images/avatars/avatar_male_1.png";
import avatarFemale2 from "../assets/images/avatars/avatar_female_2.png";

const HomePage = () => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  const styleOrder = Object.keys(STYLE_CONFIG);

  const handleVideoLoad = () => {
    setVideoLoaded(true);
    // 비디오 재생 속도 조절 (0.5 = 절반 속도, 2.0 = 2배 속도)
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7; // 0.7배 속도로 설정
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  const scrollToServices = () => {
    const section = document.getElementById('services');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const howItWorksSteps = [
    {
      icon: <UploadCloud className="w-12 h-12 text-primary" />,
      title: "1. 빈 방 사진 업로드",
      description:
        "이사 갈 집의 빈 방 사진 한 장이면 충분해요. AI가 공간의 크기와 구조를 정확하게 분석해요.",
    },
    {
      icon: <ScanSearch className="w-12 h-12 text-primary" />,
      title: "2. 가구 배치 및 스타일링",
      description:
        "3D로 구현된 공간에 내 가구를 배치하고, AI가 추천하는 다양한 인테리어 스타일을 적용해보세요.",
    },
    {
      icon: <Cuboid className="w-12 h-12 text-primary" />,
      title: "3. 결과 확인 및 저장",
      description:
        "완성된 인테리어를 현실처럼 생생하게 확인하고 저장하세요. 이제 체계적으로 이사 준비를 진행할 수 있어요.",
    },
  ];

  const testimonials = [
    {
      name: "이단비",
      location: "서울, 대한민국",
      quote:
        "정말 혁신적인 서비스예요! 새 원룸으로 이사 가는데 가구 배치가 가장 어려웠는데, '이집맞집' 덕분에 미리 계획하고 확신을 얻었어요. 마음에 드는 공간이 완성됐어요!",
      avatar: avatarFemale1,
    },
    {
      name: "박민준",
      location: "부산, 대한민국",
      quote:
        "공인중개사로서 고객분들께 집을 보여줄 때 이만한 서비스가 없어요. 고객님들에게 조건에 맞는 집을 찾아드리고 소개해드리는 것이 정말 만족스러워요.",
      avatar: avatarMale1,
    },
    {
      name: "정민아",
      location: "인천, 대한민국",
      quote:
        "인테리어에 서툰 저도 AI가 추천해준 스타일이 정말 세련되어서 놀랐어요. 가구를 배치하는 과정도 직관적이고 편리했어요!",
      avatar: avatarFemale2,
    },
  ];

  return (
    <div className="bg-background text-text-primary h-screen overflow-y-scroll snap-y snap-mandatory">
      {/* Hero Section */}
      <div className="relative h-screen w-full flex items-center justify-center text-center overflow-hidden snap-start">
        {/* Fallback Image - shown when video fails to load */}
        {videoError && (
          <img
            src="/hero-bg.jpg"
            alt="Interior design background"
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
          />
        )}
        
        {/* Video - hidden when error occurs */}
        {!videoError && (
          <video
            ref={videoRef}
            className="absolute top-0 left-0 w-full h-full object-cover"
            style={{ transform: 'scale(1.1) translateY(5%)' }}
            src="/hero-video.mp4"
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
          />
        )}
        
        {/* 오버레이 제거 - 비디오를 완전히 밝게 보이게 함 */}
        {/* <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 z-10"></div> */}
        
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-white px-4" style={{marginTop: '-25%'}}>
          <h1 className="text-2xl md:text-3xl font-bold mb-3 leading-tight animate-fade-in-down text-primary drop-shadow-2xl font-heading tracking-tight">
            이사 갈 새 집, <br />
            <span className="text-gray-700 drop-shadow-2xl font-bold">사진으로 미리 경험해보세요</span>
          </h1>
          <p className="text-body-large text-gray-700 mb-2 max-w-2xl animate-fade-in-up animation-delay-200 drop-shadow-lg font-body leading-relaxed">
            사진 한 장으로 새 집의 공간을 파악하고, 
            <br />내 가구를 가상으로 배치해보며 세련된 홈스타일링을 계획해보세요.
          </p>
          <div className="animate-fade-in-up animation-delay-400 mt-1">
            <button
              onClick={scrollToServices}
              className="inline-block px-4 py-2 bg-primary text-white font-semibold rounded-lg text-sm hover:bg-secondary transition-all duration-300 ease-in-out transform hover:scale-105 shadow-xl drop-shadow-lg tracking-wide"
            >
              지금 시작하기
            </button>
          </div>
        </div>
      </div>

      {/* Main Services Section */}
      <div id="services" className="py-20 bg-surface min-h-screen snap-start flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-caption text-primary font-semibold tracking-widest uppercase mb-4">
              주요 서비스
            </h2>
            <p className="text-section-title font-semibold text-text-primary leading-tight font-heading tracking-tight">
              어떤 계획을 갖고 계신가요?
            </p>
            <p className="mt-4 max-w-2xl mx-auto text-body-large text-text-secondary font-body leading-relaxed">
              이사 준비, 어디서부터 시작할지 고민이라면 '이집맞집'과 함께하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Find Your Home Card */}
            <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl p-12 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100">
              <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-secondary text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Search className="w-10 h-10" />
                </div>
                <h3 className="text-card-title font-semibold text-text-primary mb-6 group-hover:text-primary transition-colors duration-300 font-heading tracking-tight">
                  내 집 찾기
                </h3>
                <p className="text-body-medium text-text-secondary mb-10 leading-relaxed font-body">
                  내 라이프스타일과 취향에 꼭 맞는 집을 찾아보세요.<br /> 스마트한 필터로 엄선된 매물만 보여드려요.
                </p>
                <Link
                  to="/find-house"
                  className="inline-block w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-5 px-8 rounded-2xl hover:from-secondary hover:to-primary transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                >
                  집 보러가기
                </Link>
              </div>
            </div>

            {/* 2D/3D Room Planner Card */}
            <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl p-12 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100">
              <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-secondary text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Layout className="w-10 h-10" />
                </div>
                <h3 className="text-card-title font-semibold text-text-primary mb-6 group-hover:text-primary transition-colors duration-300 font-heading tracking-tight">
                  가구 배치하기
                </h3>
                <p className="text-body-medium text-text-secondary mb-10 leading-relaxed font-body">
                  AI가 빈 방 사진을 분석하여 정확한 3D 공간을 만들어 드립니다.<br /> 이사 전, 내 가구를 자유롭게 배치해보세요.
                </p>
                <Link
                  to="/room-planner"
                  className="inline-block w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-5 px-8 rounded-2xl hover:from-secondary hover:to-primary transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                >
                  가구 배치하러 가기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Style Showcase - Intro Section */}
      <div className="py-20 bg-background overflow-hidden min-h-screen snap-start flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">
              AI 인테리어 쇼룸
            </h2>
            <p className="mt-2 text-4xl md:text-5xl font-bold text-text-primary leading-tight">
              내 취향을 담은 공간, AI가 찾아드려요
            </p>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-text-secondary">
              AI가 제안하는 다양한 스타일을 구경하고, 새로운 인테리어 영감을 얻어보세요.
            </p>
          </div>
        </div>
      </div>

      {/* AI Style Showcase - Each style as its own snap section */}
      {styleOrder.map((key) => {
        const style = STYLE_CONFIG[key];
        const images = styleImagesData[key] || [];
        if (images.length === 0) return null;

        return (
          <div key={key} className="py-20 bg-background min-h-screen snap-start flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <h3 className="text-3xl font-bold text-text-primary mb-8 text-center">
                {style.label}
              </h3>
              <ImageSlider
                images={images}
                selectedImage={null}
                onImageSelect={() => {}}
              />
            </div>
          </div>
        );
      })}

      {/* How It Works Section */}
      <div className="py-20 bg-surface min-h-screen snap-start flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">
              서비스 이용 방법
            </h2>
            <p className="mt-2 text-4xl md:text-5xl font-bold text-text-primary leading-tight">
              단 3단계면, 이사 준비 끝
            </p>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-text-secondary">
              복잡한 과정 없이, 누구나 쉽고 재미있게 새로운 공간을 계획할 수 있습니다.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {howItWorksSteps.map((step, index) => (
              <div key={index} className="text-center p-6">
                <div className="flex items-center justify-center h-24 w-24 rounded-full bg-background mx-auto mb-6 border-2 border-primary shadow-lg">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-4">
                  {step.title}
                </h3>
                <p className="text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-background min-h-screen snap-start flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">
              생생한 사용자 후기
            </h2>
            <p className="mt-2 text-4xl md:text-5xl font-bold text-text-primary leading-tight">
              먼저 경험해 본 분들의 이야기
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-surface p-8 rounded-2xl shadow-lg flex flex-col"
              >
                <div className="flex-grow">
                  <Quote className="w-8 h-8 text-primary mb-4" />
                  <p className="text-text-secondary mb-6">
                    "{testimonial.quote}"
                  </p>
                </div>
                <div className="flex items-center mt-auto">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <p className="font-bold text-text-primary">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {testimonial.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-20 bg-surface min-h-screen snap-start flex items-center">
        <div className="max-w-4xl mx-auto text-center px-4">
          <HeartHandshake className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            지금 시작해보세요,
          </h2>
          <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
            AI와 함께라면, 이사 준비가 더욱 체계적이고 효율적으로 진행돼요.
          </p>
          <Link
            to="/room-planner"
            className="inline-block px-10 py-4 bg-primary text-white font-bold rounded-lg text-xl hover:bg-secondary transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          >
            무료로 시작하기
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8 min-h-screen snap-start flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-text-secondary">
          <p>&copy; {new Date().getFullYear()} IjipMatjip. All rights reserved.</p>
          <div className="mt-4">
            <Link to="/terms" className="mx-4 hover:text-primary">이용약관</Link>
            <Link to="/privacy" className="mx-4 hover:text-primary">개인정보처리방침</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
