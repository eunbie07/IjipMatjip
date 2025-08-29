import React, { useState, useEffect } from "react";
import axios from "axios";
import { undistortImage, generateDepthMap, getDepthMapImage, getDepthMeta, estimateRoomSize, saveFullRoomData, getUserRooms, loadRoomById } from "../utils/api";
import ImageUploader from "../components/ImageUploader";
import ImageUrlInput from "../components/ImageUrlInput";
import ImageClickArea from "../components/ImageClickArea";
import RoomResult from "../components/RoomResult";
import RoomBox from "../components/RoomBox";
import WebGLErrorBoundary from "../components/WebGLErrorBoundary";
import WebGLDebugger from "../components/WebGLDebugger";
import FurniturePlacement from "../components/FurniturePlacement";
import ProgressBar from "../components/ProgressBar";
import StickyProgressBar from "../components/StickyProgressBar";
import RoomSizeInput from "../components/RoomSizeInput";
import ProcessingSteps from "../components/UI/ProcessingSteps";

const HOUSING_TYPES = [
  {
    label: "주택, 아파트, 빌라",
    value: "house",
    defaultCeiling: 230,
    description: "단독주택, 빌라",
  },
  {
    label: "오피스텔",
    value: "officetel",
    defaultCeiling: 235,
    description: "오피스텔",
  },
  {
    label: "사무실",
    value: "office",
    defaultCeiling: 240,
    description: "상업용 건물",
  },
];

const LoadingSpinner = ({ message }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-text-secondary font-medium">{message}</p>
    </div>
  </div>
);

const UploadStatus = ({ status, error }) => {
  if (error) {
    const errorMessage = typeof error === 'string' ? error : 
                        error?.message || 
                        (error?.detail && typeof error.detail === 'string' ? error.detail : '알 수 없는 오류가 발생했습니다.');
    
    return (
      <div className="mt-4 p-4 bg-danger border border-danger rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-white">업로드 실패</span>
        </div>
        <p className="text-white mt-1 text-sm">{errorMessage}</p>
      </div>
    );
  }

  if (status) {
    const statusMessage = typeof status === 'string' ? status : '처리 중...';
    
    return (
      <div className="mt-4 p-4 bg-primary border border-primary rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-white">업로드 성공</span>
        </div>
        <p className="text-white mt-1 text-sm">{statusMessage}</p>
      </div>
    );
  }

  return null;
};

const HelpTips = ({ isOpen, onClose }) => (
  <div
    className={`fixed inset-0 z-50 ${
      isOpen ? "flex" : "hidden"
    } items-center justify-center bg-black bg-opacity-50`}
  >
    <div className="bg-surface rounded-xl p-6 max-w-md mx-4 relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"
      >
        X
      </button>
      <h3 className="font-semibold text-text-primary mb-4 text-lg">측정 가이드</h3>
      <div className="space-y-3">
        <div className="bg-background p-3 rounded-lg">
          <div className="font-medium text-text-primary mb-1">최적의 방 형태</div>
          <p className="text-sm text-text-secondary">
            직사각형 방이 가장 정확하게 측정됩니다
          </p>
        </div>
        <div className="bg-background p-3 rounded-lg">
          <div className="font-medium text-text-primary mb-1">사진 촬영 팁</div>
          <p className="text-sm text-text-secondary">
            조명이 밝고 선명한 사진을 사용하세요
          </p>
        </div>
        <div className="bg-background p-3 rounded-lg">
          <div className="font-medium text-text-primary mb-1">모서리 포인트</div>
          <p className="text-sm text-text-secondary">
            벽면의 모서리가 잘 보이게 촬영하세요
          </p>
        </div>
        <div className="bg-background p-3 rounded-lg">
          <div className="font-medium text-text-primary mb-1">가구 배치</div>
          <p className="text-sm text-text-secondary">
            가구가 가리지 않은 벽면을 선택하세요
          </p>
        </div>
      </div>
    </div>
  </div>
);

function RoomPlannerPage() {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const [placedFurniture, setPlacedFurniture] = useState([]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("Placed furniture updated:", placedFurniture);
    }
  }, [placedFurniture]);

  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [depthImageUrl, setDepthImageUrl] = useState(null);
  const [depthSize, setDepthSize] = useState({ width: 0, height: 0 });

  const [housingType, setHousingType] = useState("house");
  const [ceilingHeight, setCeilingHeight] = useState(230);

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("analysis");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uploadMethod, setUploadMethod] = useState("file"); // "file", "url", 또는 "manual"

  const [manualResult, setManualResult] = useState(null);
  const [autoResult, setAutoResult] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("manual");
  const [roomMeasurementPoints, setRoomMeasurementPoints] = useState(null);

  // 진행률 상태 추가
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('upload');
  const [showStickyProgress, setShowStickyProgress] = useState(false);

  // 진행률 단계 정의
  const progressSteps = [
    { id: 'upload', name: '이미지 업로드', progress: 20 },
    { id: 'processing', name: 'AI 분석', progress: 40 },
    { id: 'clicking', name: '모서리 선택', progress: 60 },
    { id: 'measuring', name: '측정 중', progress: 80 },
    { id: 'complete', name: '완료', progress: 100 }
  ];

  const updateRoomMeasurementPoints = (points) => {
    setRoomMeasurementPoints(points);
    window.roomMeasurementPoints = points;
    console.log("방 측정 포인트 저장됨:", points);
  };

  const handleTabClick = (tabName) => {
    console.log("탭 변경:", tabName);
    setActiveTab(tabName);
    if (tabName === "3d") {
      setTimeout(() => {
        const element = document.querySelector(".room-3d-viewer");
        if (element) {
          if (element.requestFullscreen) {
            element.requestFullscreen();
          } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
          } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
          } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
          }
        }
      }, 100);
    }
  };

  const handleImageUpload = async (file) => {
    setUploadError(null);
    setUploadStatus(null);
    setIsProcessing(true);
    
    // 진행률 초기화 및 업로드 단계 시작
    setCurrentStep('upload');
    setProgress(20);

    // 파일 유효성 검사
    if (!file) {
      setUploadError("파일이 선택되지 않았습니다.");
      setIsProcessing(false);
      return;
    }

    // 이미지 파일 타입 검사
    if (!file.type.startsWith('image/')) {
      setUploadError("이미지 파일만 업로드 가능합니다.");
      setIsProcessing(false);
      return;
    }

    // 파일 크기 검사 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("파일 크기는 10MB 이하여야 합니다.");
      setIsProcessing(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadStatus("이미지 전처리 중...");
      console.log("Uploading file:", file.name, "Size:", file.size, "Type:", file.type);
      console.log("FormData entries:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      const responseBlob = await undistortImage(file);

      setImage(file);
      setImageUrl(URL.createObjectURL(file));

      // AI 분석 단계로 진행
      setCurrentStep('processing');
      setProgress(40);
      setUploadStatus("AI 깊이 분석 중... (30초 소요)");
      await generateDepthMap();
      
      // 깊이 맵 크기 정보 가져오기
      try {
        const metaData = await getDepthMeta();
        if (metaData.success) {
          setDepthSize({ width: metaData.width, height: metaData.height });
        }
      } catch (error) {
        console.error("깊이 맵 메타 정보 가져오기 실패:", error);
      }

      try {
        const imageBlob = await getDepthMapImage();
        const imageObjectURL = URL.createObjectURL(imageBlob);
        setDepthImageUrl(imageObjectURL);
      } catch (error) {
        console.warn("깊이 맵 이미지 로드 실패:", error);
      }

      // 모서리 클릭 단계로 진행
      setCurrentStep('clicking');
      setProgress(60);
      setUploadStatus("이미지 업로드 완료! 방 모서리를 클릭하세요.");
    } catch (error) {
      console.error("Upload failed:", error);
      let message = "알 수 없는 오류가 발생했습니다.";
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          message = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          message = error.response.data.detail.map(item => 
            typeof item === 'string' ? item : item.msg || '오류'
          ).join(', ');
        }
      } else if (error.message) {
        message = error.message;
      } else if (error.code === 'ERR_NETWORK') {
        message = "서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.";
      }
      
      setUploadError(message);
      alert(`측정 실패: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRoomSizeSubmit = async (roomData) => {
    setIsProcessing(true);
    try {
      // 완료 단계로 바로 설정
      setCurrentStep('complete');
      setProgress(100);
      
      // 결과 설정
      setResult(roomData);
      setManualResult(roomData);
      
      // 가구배치 탭으로 바로 이동
      setActiveTab("furniture");
      
      // 측정 결과를 localStorage에 저장
      localStorage.setItem('roomPlannerResult', JSON.stringify(roomData));
      localStorage.setItem('roomPlannerImage', ''); // 이미지 없음
      localStorage.setItem('roomPlannerPlacedFurniture', JSON.stringify([]));
      
    } catch (error) {
      console.error("Room size setup failed:", error);
      alert("방 크기 설정에 실패했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 현재 방 저장하기 (MongoDB)
  const handleSaveRoom = async () => {
    if (!result) {
      alert("측정된 방이 없습니다. 먼저 방을 측정해주세요.");
      return;
    }

    const roomName = prompt("방 이름을 입력하세요 (예: 우리집 거실)", "내 방");
    if (!roomName) return;

    try {
      const roomData = {
        id: Date.now(),
        name: roomName,
        createdAt: new Date().toISOString(),
        result: result,
        placedFurniture: placedFurniture,
        imageUrl: imageUrl,
        roomMeasurementPoints: roomMeasurementPoints,
        uploadMethod: uploadMethod,
        // AI 생성 이미지 정보 (있다면 포함)
        aiGeneratedImages: {
          designImage: localStorage.getItem('lastGeneratedDesignImage') || null,
          realisticImage: localStorage.getItem('lastGeneratedRealisticImage') || null
        }
      };

      const response = await saveFullRoomData(roomData);
      alert(`"${roomName}" 방이 저장되었습니다!`);
      console.log('방 저장 성공:', response);
      
      // localStorage에 백업 (옵션)
      const savedRooms = JSON.parse(localStorage.getItem('savedRooms') || '[]');
      savedRooms.push({ ...roomData, mongoId: response.layout_id });
      localStorage.setItem('savedRooms', JSON.stringify(savedRooms));
      
    } catch (error) {
      console.error('방 저장 실패:', error);
      alert(`방 저장 실패: ${error.message}`);
    }
  };

  // 저장된 방 불러오기 (MongoDB)
  const handleLoadRoom = async () => {
    try {
      const rooms = await getUserRooms();
      
      if (rooms.length === 0) {
        alert("저장된 방이 없습니다.");
        return;
      }

      // 가장 최근 저장된 방 선택
      const latestRoom = rooms[0]; // 백엔드에서 최신순으로 정렬됨
      
      // 방 이름 표시 (scene 내부에 있을 수 있음)
      const roomName = latestRoom.scene?.name || latestRoom.layout_data?.scene?.name || "저장된 방";
      
      if (confirm(`"${roomName}" 방을 불러오시겠습니까?\n(현재 작업이 사라집니다)`)) {
        // MongoDB에서 가져온 데이터 구조에 맞게 복원
        const roomData = latestRoom.scene || latestRoom.layout_data?.scene;
        
        if (roomData) {
          setResult(roomData.result);
          setPlacedFurniture(roomData.placedFurniture || []);
          setImageUrl(roomData.imageUrl || null);
          setRoomMeasurementPoints(roomData.roomMeasurementPoints || null);
          setUploadMethod(roomData.uploadMethod || "manual");
          
          // 진행률 완료 상태로 설정
          setCurrentStep('complete');
          setProgress(100);
          
          // Furniture Layout 탭으로 이동
          setActiveTab("furniture");
          
          alert(`"${roomName}" 방을 불러왔습니다!`);
        } else {
          throw new Error("방 데이터 형식이 올바르지 않습니다.");
        }
      }
      
    } catch (error) {
      console.error('방 불러오기 실패:', error);
      alert(`방 불러오기 실패: ${error.message}`);
      
      // 실패 시 localStorage 백업 사용
      const savedRooms = JSON.parse(localStorage.getItem('savedRooms') || '[]');
      if (savedRooms.length > 0) {
        const latestRoom = savedRooms[savedRooms.length - 1];
        if (confirm(`네트워크 오류입니다. 로컬 백업 "${latestRoom.name}" 방을 불러오시겠습니까?`)) {
          setResult(latestRoom.result);
          setPlacedFurniture(latestRoom.placedFurniture || []);
          setImageUrl(latestRoom.imageUrl || null);
          setRoomMeasurementPoints(latestRoom.roomMeasurementPoints || null);
          setUploadMethod(latestRoom.uploadMethod || "manual");
          
          setCurrentStep('complete');
          setProgress(100);
          setActiveTab("furniture");
          
          alert(`"${latestRoom.name}" 방을 불러왔습니다! (로컬 백업)`);
        }
      }
    }
  };

  // 가구배치 중 방 크기 변경 핸들러
  const handleRoomSizeChange = (newSize) => {
    const updatedResult = {
      ...result,
      width_cm: newSize.width,
      depth_cm: newSize.depth,
      height_cm: newSize.height,
      dimensions: {
        width_cm: newSize.width,
        depth_cm: newSize.depth,
        height_cm: newSize.height
      },
      calculated_values: {
        area_sqm: (newSize.width * newSize.depth) / 10000,
        volume_cum: (newSize.width * newSize.depth * newSize.height) / 1000000
      }
    };
    
    setResult(updatedResult);
    
    // localStorage 업데이트
    localStorage.setItem('roomPlannerResult', JSON.stringify(updatedResult));
  };

  const handlePointsSubmit = async (points, method = "manual") => {
    try {
      // 측정 중 단계로 진행
      setCurrentStep('measuring');
      setProgress(80);
      
      updateRoomMeasurementPoints(points);

      // 층고 값 검증 및 기본값 설정
      let validatedCeilingHeight = parseFloat(ceilingHeight);
      if (isNaN(validatedCeilingHeight) || validatedCeilingHeight <= 0) {
        validatedCeilingHeight = 230; // 기본값 2.3m
        setCeilingHeight(230);
        console.warn("유효하지 않은 층고 값이 감지되어 기본값 2.3m로 설정했습니다.");
      }

      const payload = {
        housing_type: housingType,
        points: points.map((pt) => ({
          x: parseFloat(pt.x),
          y: parseFloat(pt.y),
          z: parseFloat(pt.z),
        })),
        target_height: validatedCeilingHeight / 100,
      };
      
      console.log("API 요청 payload:", payload);
      const res = await estimateRoomSize(payload.points, payload.target_height);
      console.log("API 응답 전문:", res);

      const resultData = { ...res, detectionMethod: method };

      if (method === "manual") {
        setManualResult(resultData);
      } else {
        setAutoResult(resultData);
      }

      setResult(resultData);
      
      // 측정 결과를 localStorage에 저장
      localStorage.setItem('roomPlannerResult', JSON.stringify(resultData));
      localStorage.setItem('roomPlannerImage', image ? URL.createObjectURL(image) : '');
      localStorage.setItem('roomPlannerPlacedFurniture', JSON.stringify(placedFurniture));
      
      // 완료 단계로 진행
      setCurrentStep('complete');
      setProgress(100);
    } catch (error) {
      console.error("Room size estimation failed:", error);
      let message = "방 크기 계산에 실패했습니다.";
      
      if (error.message.includes('HTTP error')) {
        message = `서버 오류: ${error.message}`;
      } else if (error.message) {
        message = error.message;
      } else if (error.code === 'ERR_NETWORK') {
        message = "서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.";
      }
      
      alert(`측정 실패: ${message}`);
    }
  };

  // URL 파라미터 처리
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const imageUrlParam = urlParams.get('imageUrl');
    const tabParam = urlParams.get('tab');
    const widthParam = urlParams.get('width');
    const heightParam = urlParams.get('height');
    const depthParam = urlParams.get('depth');
    const shouldLoadRoom = urlParams.get('loadRoom') === 'true';
    
    // MyRooms 페이지에서 방 선택해서 온 경우
    if (shouldLoadRoom) {
      const tempRoomData = localStorage.getItem('tempLoadedRoom');
      if (tempRoomData) {
        try {
          const roomData = JSON.parse(tempRoomData);
          
          // 방 데이터 복원
          setResult(roomData.result);
          setPlacedFurniture(roomData.placedFurniture || []);
          setImageUrl(roomData.imageUrl || null);
          setRoomMeasurementPoints(roomData.roomMeasurementPoints || null);
          setUploadMethod(roomData.uploadMethod || 'manual');
          
          // 진행률 완료 상태로 설정
          setCurrentStep('complete');
          setProgress(100);
          
          // Furniture Layout 탭으로 이동
          setActiveTab("furniture");
          
          // 임시 데이터 정리
          localStorage.removeItem('tempLoadedRoom');
          
          // URL 파라미터 정리
          window.history.replaceState({}, '', '/room-planner');
          
          return; // 나머지 URL 파라미터 처리 건너뛰기
        } catch (error) {
          console.error('임시 방 데이터 로드 실패:', error);
          localStorage.removeItem('tempLoadedRoom');
        }
      }
    }
    const returnParam = urlParams.get('return');
    
    // AI 인테리어에서 돌아오는 경우 (저장된 결과 복원)
    if (returnParam === 'true') {
      const savedResult = localStorage.getItem('roomPlannerResult');
      const savedImage = localStorage.getItem('roomPlannerImage');
      const savedFurniture = localStorage.getItem('roomPlannerPlacedFurniture');
      
      if (savedResult) {
        try {
          const resultData = JSON.parse(savedResult);
          setResult(resultData);
          setActiveTab("3d"); // 3D 탭으로 이동
          setCurrentStep('complete');
          setProgress(100);
          
          if (savedImage && savedImage !== '') {
            setImageUrl(savedImage);
          }
          
          if (savedFurniture) {
            const furnitureData = JSON.parse(savedFurniture);
            setPlacedFurniture(furnitureData);
          }
        } catch (error) {
          console.error('저장된 결과 복원 실패:', error);
        }
      }
    }
    // 3D 탭으로 직접 이동하는 경우 (기본 방 크기로 설정)
    else if (tabParam === '3d' && widthParam && heightParam && depthParam) {
      const defaultResult = {
        width_cm: parseInt(widthParam),
        height_cm: parseInt(heightParam),
        depth_cm: parseInt(depthParam),
        dimensions: {
          width_cm: parseInt(widthParam),
          height_cm: parseInt(heightParam), 
          depth_cm: parseInt(depthParam)
        },
        confidence: 0.85,
        detectionMethod: "default"
      };
      setResult(defaultResult);
      setActiveTab("3d");
      setCurrentStep('complete');
      setProgress(100);
    }
    // 이미지 URL이 있는 경우
    else if (imageUrlParam) {
      setUploadMethod("url");
      // URL 파라미터가 있으면 자동으로 이미지 로드
      handleImageUploadFromUrl(imageUrlParam);
    }
  }, []);

  // URL에서 이미지 업로드 처리 함수
  const handleImageUploadFromUrl = async (imageUrl) => {
    try {
      const { fetchImageFromUrl } = await import("../utils/imageUtils");
      const file = await fetchImageFromUrl(imageUrl);
      handleImageUpload(file);
    } catch (error) {
      console.error("URL에서 이미지 로드 실패:", error);
      setUploadError(`URL에서 이미지를 가져올 수 없습니다: ${error.message}`);
    }
  };

  // 스크롤 이벤트로 스티키 진행률 표시 제어
  React.useEffect(() => {
    const handleScroll = () => {
      // 진행률이 0보다 크고 결과가 없는 상태에서만 활성화
      if ((progress > 0 && !result) || isProcessing) {
        const scrollY = window.scrollY;
        const shouldShowSticky = scrollY > 200; // 200px 스크롤 후 표시
        setShowStickyProgress(shouldShowSticky);
      } else {
        setShowStickyProgress(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [progress, result, isProcessing]);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background py-8">
      {/* 스티키 진행률 바 */}
      <StickyProgressBar 
        currentStep={currentStep}
        progress={progress}
        steps={progressSteps}
        isVisible={showStickyProgress}
      />
      
      <div className="container mx-auto px-4">
        <div className="mb-8 pt-24 md:pt-28 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6 leading-tight">
            Room <span className="text-primary">Planner</span>
          </h1>
          <p className="text-lg text-text-secondary mb-8">
            Measure accurate room dimensions from a single photo using artificial intelligence
          </p>
        </div>

      {!result && (
        <div className="max-w-6xl mx-auto">
          {/* 저장된 방 불러오기 버튼 */}
          <div className="bg-surface border border-border rounded-lg shadow-sm p-4 sm:p-6 lg:p-8 mb-6">
            <div className="text-center">
              <button
                onClick={handleLoadRoom}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-secondary text-white font-medium rounded-lg transition-colors shadow-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                저장된 방 불러오기
              </button>
              <p className="text-text-secondary text-sm mt-2">
                이전에 저장한 방이 있다면 바로 불러올 수 있습니다
              </p>
            </div>
          </div>

          {/* 진행률 표시 (이미지가 업로드된 후부터 표시) */}
          {(imageUrl || isProcessing || progress > 0) && (
            <div className="bg-surface border border-border rounded-lg shadow-sm p-4 sm:p-6 lg:p-8 mb-6">
              <ProgressBar 
                currentStep={currentStep} 
                progress={progress} 
                steps={progressSteps} 
              />
            </div>
          )}
          
          <div className="bg-surface border border-border rounded-lg shadow-sm p-4 sm:p-6 lg:p-8 mb-6">
            <div className="mb-6">
              {/* 업로드 방법 선택 탭 */}
              <div className="flex border-b border-border mb-6">
                <button
                  onClick={() => setUploadMethod("file")}
                  className={`flex-1 px-3 py-3 text-center font-medium transition-colors text-xs sm:text-sm lg:text-base ${
                    uploadMethod === "file"
                      ? "text-primary border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  파일 업로드
                </button>
                <button
                  onClick={() => setUploadMethod("url")}
                  className={`flex-1 px-3 py-3 text-center font-medium transition-colors text-xs sm:text-sm lg:text-base ${
                    uploadMethod === "url"
                      ? "text-primary border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  URL에서 가져오기
                </button>
                <button
                  onClick={() => setUploadMethod("manual")}
                  className={`flex-1 px-3 py-3 text-center font-medium transition-colors text-xs sm:text-sm lg:text-base ${
                    uploadMethod === "manual"
                      ? "text-primary border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  방 크기 입력
                </button>
              </div>

              {/* 파일 업로드 섹션 */}
              {uploadMethod === "file" && (
                <div className="w-full border-2 border-dashed border-border rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center bg-background hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-lg sm:text-xl mb-2 text-text-primary">
                    파일 업로드
                  </span>
                  <span className="text-text-secondary text-sm sm:text-base mb-4 text-center">
                    방 모서리가 명확히 보이는 사진을 선택해주세요
                  </span>
                  <ImageUploader onUpload={handleImageUpload} />
                </div>
              )}

              {/* URL 입력 섹션 */}
              {uploadMethod === "url" && (
                <div className="w-full border-2 border-dashed border-border rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center bg-background">
                  <span className="font-medium text-lg sm:text-xl mb-2 text-text-primary">
                    URL에서 이미지 가져오기
                  </span>
                  <span className="text-text-secondary text-sm sm:text-base mb-4 text-center">
                    이미지 URL을 입력하여 방 사진을 가져오세요
                  </span>
                  <ImageUrlInput onUpload={handleImageUpload} isProcessing={isProcessing} />
                </div>
              )}

              {/* 방 크기 직접 입력 섹션 */}
              {uploadMethod === "manual" && (
                <RoomSizeInput 
                  onRoomSizeSubmit={handleRoomSizeSubmit}
                  isProcessing={isProcessing}
                />
              )}

              {isProcessing && uploadMethod !== "manual" && <ProcessingSteps message={uploadStatus} />}
              {uploadMethod !== "manual" && <UploadStatus status={uploadStatus} error={uploadError} />}
            </div>

            {uploadMethod !== "manual" && (
              <div className="border-t border-border pt-6">
                <h3 className="font-medium text-lg mb-4 text-text-primary">
                  Measurement Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block font-medium text-text-primary mb-2">
                      Building Type
                    </label>
                    <select
                      className="w-full border border-border rounded-lg px-4 py-3 focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-50"
                      value={housingType}
                      onChange={(e) => setHousingType(e.target.value)}
                    >
                      {HOUSING_TYPES.map((h) => (
                        <option key={h.value} value={h.value}>
                          {h.label} ({h.description})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-text-primary mb-2">
                      Ceiling Height
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="200"
                        max="400"
                        step="5"
                        value={ceilingHeight}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = parseFloat(value);
                          
                          // 유효성 검사
                          if (value === '' || isNaN(numValue)) {
                            setCeilingHeight('');
                          } else if (numValue < 200) {
                            setCeilingHeight(200);
                          } else if (numValue > 400) {
                            setCeilingHeight(400);
                          } else {
                            setCeilingHeight(value);
                          }
                        }}
                        onBlur={(e) => {
                          // 포커스를 잃을 때 기본값 설정
                          if (e.target.value === '' || isNaN(parseFloat(e.target.value))) {
                            setCeilingHeight(230);
                          }
                        }}
                        className="flex-1 border border-border rounded-lg px-4 py-3 focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-50"
                        placeholder="230"
                      />
                      <span className="text-text-secondary text-base font-medium">
                        cm
                      </span>
                    </div>
                    {ceilingHeight && (parseFloat(ceilingHeight) < 200 || parseFloat(ceilingHeight) > 400) && (
                      <p className="text-red-500 text-sm mt-1">
                        층고는 200cm ~ 400cm 사이의 값이어야 합니다.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {imageUrl && !isProcessing && !result && (
        <div className="max-w-7xl mx-auto">
          <ImageClickArea
            imageUrl={imageUrl}
            onComplete={handlePointsSubmit}
            depthWidth={depthSize.width}
            depthHeight={depthSize.height}
          />
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="bg-surface rounded-lg shadow-sm border border-border overflow-visible">
            <div className="flex flex-wrap border-b border-border">
              <button
                onClick={() => handleTabClick("analysis")}
                className={`flex-1 min-w-[120px] px-4 sm:px-6 py-3 sm:py-4 text-center font-medium transition-colors text-sm sm:text-base ${
                  activeTab === "analysis"
                    ? "bg-surface text-primary border-b-2 border-blue-600"
                    : "text-text-secondary hover:text-text-primary hover:bg-background"
                }`}
              >
                Analysis
              </button>
              <button
                onClick={() => handleTabClick("2d")}
                className={`flex-1 min-w-[120px] px-4 sm:px-6 py-3 sm:py-4 text-center font-medium transition-colors text-sm sm:text-base ${
                  activeTab === "2d"
                    ? "bg-surface text-primary border-b-2 border-blue-600"
                    : "text-text-secondary hover:text-text-primary hover:bg-background"
                }`}
              >
                2D Floor Plan
              </button>
              <button
                onClick={() => handleTabClick("furniture")}
                className={`flex-1 min-w-[120px] px-4 sm:px-6 py-3 sm:py-4 text-center font-medium transition-colors text-sm sm:text-base ${
                  activeTab === "furniture"
                    ? "bg-surface text-primary border-b-2 border-blue-600"
                    : "text-text-secondary hover:text-text-primary hover:bg-background"
                }`}
              >
                Furniture Layout
              </button>
              <button
                onClick={() => handleTabClick("3d")}
                className={`flex-1 min-w-[120px] px-4 sm:px-6 py-3 sm:py-4 text-center font-medium transition-colors text-sm sm:text-base ${
                  activeTab === "3d"
                    ? "bg-surface text-primary border-b-2 border-blue-600"
                    : "text-text-secondary hover:text-text-primary hover:bg-background"
                }`}
              >
                3D Viewer
              </button>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              {activeTab === "analysis" && (
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
                    <h3 className="text-2xl font-bold mb-4 text-text-primary">
                      AI Room Measurement Analysis
                      {result?.detectionMethod && (
                        <span className="ml-3 text-sm font-normal text-text-secondary">
                          ({result.detectionMethod === "auto" ? "Auto Detection" : "Manual 4-Point"})
                        </span>
                      )}
                    </h3>
                    <p className="text-text-secondary mb-4">
                      Advanced computer vision and deep learning technology
                      for accurate room size measurement from a single photo.
                    </p>

                    {/* 측정 결과 */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {((result.dimensions?.width_cm || result.width_cm) / 100).toFixed(1)}m
                        </div>
                        <div className="text-sm text-text-secondary">Width</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {((result.dimensions?.depth_cm || result.depth_cm) / 100).toFixed(1)}m
                        </div>
                        <div className="text-sm text-text-secondary">Depth</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {((result.dimensions?.height_cm || result.height_cm) / 100).toFixed(1)}m
                        </div>
                        <div className="text-sm text-text-secondary">Height</div>
                      </div>
                    </div>

                    {/* 계산된 값들 */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="text-center p-3 bg-background rounded border border-border">
                        <div className="text-xl font-bold text-text-primary">
                          {(result.calculated_values?.area_sqm || (((result.dimensions?.width_cm || result.width_cm) * (result.dimensions?.depth_cm || result.depth_cm)) / 10000)).toFixed(1)}㎡
                        </div>
                        <div className="text-sm text-text-secondary">Floor Area</div>
                      </div>
                      <div className="text-center p-3 bg-background rounded border border-border">
                        <div className="text-xl font-bold text-text-primary">
                          {(result.calculated_values?.volume_cum || (((result.dimensions?.width_cm || result.width_cm) * (result.dimensions?.depth_cm || result.depth_cm) * (result.dimensions?.height_cm || result.height_cm)) / 1000000)).toFixed(1)}㎥
                        </div>
                        <div className="text-sm text-text-secondary">Volume</div>
                      </div>
                    </div>
                  </div>

                  {/* 측정 정확도 및 신뢰도 */}
                  <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
                    <h4 className="text-lg font-semibold text-text-primary mb-3">Measurement Accuracy</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        <span className="text-text-secondary">Accuracy: ±5~10cm</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                        <span className="text-text-secondary">Confidence: {(result.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        <span className="text-text-secondary">Processing time: ~30 seconds</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                        <span className="text-text-secondary">Method: {result.detectionMethod === "auto" ? "Automatic" : "Manual"}</span>
                      </div>
                    </div>
                  </div>

                  {/* 원본 이미지와 깊이 분석 이미지 비교 */}
                  {depthImageUrl && (
                    <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
                      <h4 className="text-lg font-semibold text-text-primary mb-4">Image Analysis Process</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h5 className="font-medium text-text-primary">Original Image</h5>
                          <div className="relative">
                            <div className="aspect-video rounded-lg overflow-hidden border border-border">
                              <img
                                src={imageUrl}
                                alt="Original Image"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 bg-primary/80 text-white px-2 py-1 rounded text-xs">
                                Original
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-text-secondary">
                            User uploaded room image
                          </p>
                        </div>

                        <div className="space-y-3">
                          <h5 className="font-medium text-text-primary">AI Depth Analysis</h5>
                          <div className="relative">
                            <div className="aspect-video rounded-lg overflow-hidden border border-border">
                              <img
                                src={depthImageUrl}
                                alt="Depth Map"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 bg-primary/80 text-white px-2 py-1 rounded text-xs">
                                Depth Map
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-text-secondary">
                            AI analyzed depth information and 3D structure
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 측정 설정 정보 */}
                  <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
                    <h4 className="text-lg font-semibold text-text-primary mb-4">Measurement Parameters</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-text-secondary">
                      <div className="flex justify-between">
                        <span>Ceiling Height:</span>
                        <span className="font-medium">{(ceilingHeight / 100).toFixed(1)}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Building Type:</span>
                        <span className="font-medium">
                          {HOUSING_TYPES.find((h) => h.value === housingType)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Depth Map Size:</span>
                        <span className="font-medium">{depthSize.width}×{depthSize.height}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Detection Method:</span>
                        <span className="font-medium">
                          {result.detectionMethod === "auto" ? "Automatic Detection" : "Manual 4-Point"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 기술 정보 */}
                  <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
                    <h4 className="text-lg font-semibold text-text-primary mb-4">Technology Details</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h5 className="font-medium text-text-primary">AI Models Used</h5>
                        <ul className="space-y-1 text-sm text-text-secondary">
                          <li>• MiDaS v3.1 (Depth Estimation)</li>
                          <li>• Vision Transformer Architecture</li>
                          <li>• Monocular Depth Estimation</li>
                          <li>• Camera Distortion Correction</li>
                          <li>• 3D Geometric Transformation</li>
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <h5 className="font-medium text-text-primary">Limitations</h5>
                        <ul className="space-y-1 text-sm text-text-secondary">
                          <li>• Optimized for rectangular rooms</li>
                          <li>• Better lighting improves accuracy</li>
                          <li>• Clear corner visibility required</li>
                          <li>• Depends on ceiling height accuracy</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
                      <p className="text-sm text-text-primary">
                        <strong>Tip:</strong> For more accurate measurements, ensure good lighting 
                        and clear visibility of room corners and edges.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "2d" && (
                <div className="max-w-6xl mx-auto">
                  <RoomResult result={result} depthImageUrl={depthImageUrl} />
                </div>
              )}

              {activeTab === "3d" && (
                <div className="w-full space-y-4">
                  {/* WebGL 디버그 정보 (개발용) */}
                  {process.env.NODE_ENV === 'development' && (
                    <WebGLDebugger />
                  )}
                  
                  <div className="relative">
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
                      <button
                        onClick={() => {
                          const element = document.querySelector(".room-3d-viewer");
                          if (element.requestFullscreen) {
                            element.requestFullscreen();
                          } else if (element.webkitRequestFullscreen) {
                            element.webkitRequestFullscreen();
                          } else if (element.mozRequestFullScreen) {
                            element.mozRequestFullScreen();
                          } else if (element.msRequestFullscreen) {
                            element.msRequestFullscreen();
                          }
                        }}
                        className="px-4 py-2 bg-primary/50 text-white rounded-lg hover:bg-primary/70 transition-all duration-200 flex items-center gap-2"
                        title="전체화면으로 보기"
                      >
                        
                        <span className="text-sm">전체화면</span>
                      </button>
                    </div>
                    <div
                      className={`room-3d-viewer bg-black rounded-lg ${
                        isFullscreen
                          ? "fixed inset-0 w-screen h-screen z-[9999]"
                          : "min-h-[500px] md:min-h-[600px] lg:min-h-[700px]"
                      }`}
                    >
                      <WebGLErrorBoundary>
                        <RoomBox
                          width={result.dimensions?.width_cm || result.width_cm}
                          depth={result.dimensions?.depth_cm || result.depth_cm}
                          height={result.dimensions?.height_cm || result.height_cm}
                          isFullscreen={isFullscreen}
                          uploadedImageFile={image}
                          uploadedImageUrl={imageUrl}
                          placedFurniture={placedFurniture}
                          onFurnitureChange={setPlacedFurniture}
                          onTabChange={handleTabClick}
                        />
                      </WebGLErrorBoundary>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "furniture" && (
                <div className="w-full">
                  <FurniturePlacement
                    roomWidth={result.dimensions?.width_cm || result.width_cm}
                    roomDepth={result.dimensions?.depth_cm || result.depth_cm}
                    roomHeight={result.dimensions?.height_cm || result.height_cm}
                    placedFurniture={placedFurniture}
                    onFurnitureChange={setPlacedFurniture}
                    onRoomSizeChange={handleRoomSizeChange}
                    detectedWindows={[]}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="text-center mt-8 space-y-4">
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={handleSaveRoom}
                className="w-40 px-6 py-3 bg-primary hover:bg-secondary text-white font-medium rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                방 저장하기
              </button>
              
              <button
                onClick={handleLoadRoom}
                className="w-40 px-6 py-3 bg-primary hover:bg-secondary text-white font-medium rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                방 불러오기
              </button>

              <button
                onClick={() => {
                  setResult(null);
                  setManualResult(null);
                  setAutoResult(null);
                  setSelectedMethod("manual");
                  setImage(null);
                  setImageUrl(null);
                  setDepthImageUrl(null);
                  setUploadStatus(null);
                  setUploadError(null);
                  setPlacedFurniture([]);
                  setUploadMethod("file"); // 방법 초기화
                  // 진행률 초기화
                  setProgress(0);
                  setCurrentStep('upload');
                }}
                className="w-40 px-6 py-3 bg-primary hover:bg-secondary text-white font-medium rounded-lg transition-colors shadow-lg"
              >
                새로 측정하기
              </button>
              
              {/* Furniture Layout 탭에서만 3D로 보기 버튼 표시 */}
              {activeTab === "furniture" && (
                <button
                  onClick={() => handleTabClick("3d")}
                  className="w-40 px-6 py-3 bg-primary hover:bg-secondary text-white font-medium rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
                    />
                  </svg>
                  3D로 보기
                </button>
              )}
              
              {activeTab === "analysis" && (
                <button
                  onClick={() => handleTabClick("2d")}
                  className="w-40 px-6 py-3 bg-primary hover:bg-secondary text-white font-medium rounded-lg transition-colors shadow-lg"
                >
                  평면도 보기
                </button>
              )}
              
              {activeTab === "2d" && (
                <button
                  onClick={() => handleTabClick("furniture")}
                  className="w-40 px-6 py-3 bg-primary hover:bg-secondary text-white font-medium rounded-lg transition-colors shadow-lg"
                >
                  가구 배치하기
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <HelpTips isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </div>
    </div>
  );
}

export default RoomPlannerPage;