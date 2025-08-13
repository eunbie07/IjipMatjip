# 🏠 Room Measure - 3D 방 측정 및 가구 배치 시뮬레이터

이 프로젝트는 부동산 방 사진을 기반으로 **3D 공간 측정**과 **실시간 가구 배치 시뮬레이션**을 제공하는 고도화된 웹 애플리케이션입니다. 

## 📋 주요 특징
- 📸 **이미지 기반 방 크기 추정** - OpenCV 왜곡 보정 적용
- 🎮 **실시간 3D 가구 배치** - Three.js 기반 인터랙티브 환경  
- 🤖 **AI 인테리어 생성** - 스타일 기반 자동 인테리어 제안
- 📱 **반응형 디자인** - 모바일/태블릿/데스크톱 지원
- 🔧 **메인 웹페이지 통합 준비완료** - 모듈화된 컴포넌트 구조

---

## ✅ 주요 기능

### 1. 사진 업로드 및 왜곡 보정

- 사용자가 사진을 업로드하면 FastAPI 서버에서 OpenCV `cv2.undistort()` 함수로 광각 왜곡을 1차 보정합니다.

### 2. 4포인트 클릭 방식 (xz / yz 평면 기반)

사용자는 아래 순서로 4개의 포인트를 클릭합니다:

1. 벽 하단 (기준점)
2. 벽 상단 (천장)
3. 왼쪽 바닥 방향 (xz 평면)
4. 오른쪽 바닥 방향 (yz 평면)

이 순서를 통해 다음을 계산합니다:

- z축 기준 픽셀 거리 → 230cm로 환산
- x, y 거리 → 각각 `xz`, `yz` 평면에서 독립적으로 환산

### 3. 거리 계산 결과

- 가로 길이 (x): cm 단위
- 세로 길이 (y): cm 단위
- 1픽셀당 cm 값

---

## 🧱 기술 스택

### Frontend
- **React 18** - 최신 React with Hooks & Concurrent Features
- **Vite** - 고속 빌드 도구 (HMR, ES Modules)
- **Three.js** - 3D 그래픽 렌더링 (`@react-three/fiber`, `@react-three/drei`)
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **React Router v7** - 최신 라우팅 시스템
- **FontAwesome** - 아이콘 라이브러리

### Backend  
- **FastAPI** - 고성능 Python 웹 프레임워크
- **OpenCV** - 이미지 처리 및 왜곡 보정
- **AI 모델 통합** - 인테리어 생성 AI 엔진

### 개발 도구
- **ESLint 9** - 코드 품질 관리
- **PostCSS** - CSS 후처리
- **Docker** - 컨테이너화 배포

---

## 🚀 실행 방법

### 1. 백엔드 실행 (FastAPI)

    cd backend
    uvicorn main:app --host 0.0.0.0 --port 3000

### 2. 프론트엔드 실행 (React)

    cd frontend
    npm install
    npm run dev -- --host 0.0.0.0 --port 4000

---

## 📦 주요 디렉토리 구조

    room-measure/
    ├── backend/
    │   └── main.py               # FastAPI 서버 + OpenCV 처리
    ├── frontend/
    │   ├── index.html
    │   ├── vite.config.js
    │   └── src/
    │       ├── App.jsx           # 전체 앱 구조
    │       ├── main.jsx          # React DOM mount
    │       └── components/
    │           ├── ImageUploader.jsx
    │           └── ImageClickArea.jsx

---

## 🎯 향후 확장 가능성

- RoomNet, HorizonNet 등으로 자동 평면 인식 기능 추가
- 방 구조 2D 시각화 기능
- 방 크기 결과 다운로드 (PDF, JSON 등)

---

## 🔗 메인 웹페이지 통합 가이드

### 통합 준비사항
이 프론트엔드는 메인 웹페이지에 **임베드 가능하도록 설계**되었습니다.

#### 1. 환경변수 설정
```bash
# .env 파일 수정
VITE_EMBED_MODE=true           # 임베드 모드 활성화
VITE_STANDALONE_MODE=false     # 독립 모드 비활성화
VITE_PUBLIC_PATH=/room-measure # 메인 사이트 내 경로
```

#### 2. 빌드 및 배포
```bash
# 프로덕션 빌드
npm run build

# dist/ 폴더를 메인 웹서버에 복사
cp -r dist/* /var/www/main-website/room-measure/
```

#### 3. 메인 페이지 임베딩
```html
<!-- 메인 웹페이지에서 iframe 방식 -->
<iframe 
  src="/room-measure" 
  width="100%" 
  height="800px"
  frameborder="0">
</iframe>

<!-- 또는 직접 통합 -->
<div id="room-measure-app"></div>
<script src="/room-measure/assets/index.js"></script>
```

#### 4. API 엔드포인트 통합
- 백엔드 API가 메인 서버와 **동일한 도메인**에서 서비스되도록 설정
- CORS 정책 조정 필요
- 인증 시스템 통합 고려

### 코드 구조 특징
- **모듈화된 컴포넌트**: 독립적으로 재사용 가능
- **상태 관리 분리**: Context API로 격리된 상태
- **라우팅 최적화**: 메인 사이트 라우팅과 충돌 방지
- **번들 최적화**: Three.js와 라우터를 별도 청크로 분리

---

## ✨ 프로젝트 목적

부동산 매물의 광각 사진만으로도 **정확한 방 크기 측정**과 **실시간 가구 배치 시뮬레이션**을 통해 사용자에게 몰입감 있는 공간 경험을 제공합니다. 메인 웹페이지의 핵심 기능으로 통합되어 사용자 참여도와 서비스 가치를 높이는 것이 목표입니다.
