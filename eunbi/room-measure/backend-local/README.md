# Room Measure Local Backend

로컬 개발용 AI 이미지 처리 백엔드 (포트 3010)

## 프로젝트 구조

```
backend-local/
├── src/                      # 소스 코드
│   ├── processing/          # 이미지 처리 모듈
│   │   ├── depth_processing.py # 깊이 맵 생성 (MiDaS)
│   │   ├── room_measurement.py # 방 크기 측정
│   │   └── __init__.py
│   ├── detection/           # AI 감지 모듈
│   │   ├── ai_room_detection.py # AI 방 감지
│   │   ├── window_detection.py  # 창문 감지 (YOLO)
│   │   ├── improved_ai_detection.py # 개선된 AI 감지
│   │   ├── corner_intersection_detection.py # 모서리 교차점 감지
│   │   └── __init__.py
│   ├── models/              # 데이터 모델
│   │   ├── schemas.py       # Pydantic 모델
│   │   └── __init__.py
│   ├── routes/              # API 라우터
│   │   ├── processing.py    # 이미지 처리 엔드포인트
│   │   ├── detection.py     # AI 감지 엔드포인트
│   │   └── __init__.py
│   └── __init__.py
├── models/                  # AI 모델
│   └── yolo11n.pt          # YOLO11 nano 모델 (5.6MB)
├── outputs/                 # 처리 결과물
│   ├── depth_map.npy       # 깊이 맵 데이터
│   ├── depth_map_output.png # 깊이 맵 이미지
│   ├── depth_meta.txt      # 깊이 메타데이터
│   └── undistorted_image.jpg # 왜곡 보정 이미지
├── main.py                 # 모듈화된 진입점
├── pyproject.toml          # Python 프로젝트 설정
├── requirements.txt        # 의존성 목록
├── uv.lock                 # uv 락 파일
└── README.md               # 프로젝트 문서
```

## 주요 기능
- **이미지 왜곡 보정**: 카메라 렌즈 왜곡 보정
- **깊이 맵 생성**: MiDaS 모델을 이용한 단안 깊이 추정
- **AI 방 감지**: RoomNet 시뮬레이션 기반 방 경계 자동 감지
- **창문 감지**: YOLO11을 이용한 창문 객체 감지
- **방 크기 측정**: 깊이 정보를 활용한 실제 방 크기 계산
- **3D 거리 계산**: 픽셀 좌표 간 실제 거리 측정

## 기술 스택
- **Framework**: FastAPI 0.116+
- **AI Models**: MiDaS (깊이), YOLO11 (객체 감지)
- **Image Processing**: OpenCV, PIL
- **Deep Learning**: PyTorch, Ultralytics
- **Scientific Computing**: NumPy, scikit-learn
- **Package Manager**: uv (빠른 의존성 관리)

## 설치 및 실행

### 개발 환경
```bash
# 1. 저장소 클론 및 디렉토리 이동
cd backend-local

# 2. 가상환경 생성 (선택사항)
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 3. 의존성 설치 (uv 사용 권장)
pip install uv
uv pip install -r requirements.txt

# 또는 pip 사용
pip install -r requirements.txt

# 4. YOLO 모델 자동 다운로드
# 첫 실행 시 models/yolo11n.pt가 자동으로 다운로드됩니다

# 5. 서버 실행
python main.py
```

서버는 `http://localhost:3010`에서 실행됩니다.

### Docker 실행 (향후 지원 예정)
```bash
# TODO: Dockerfile 추가 필요
docker build -t room-measure-local .
docker run -p 3010:3010 room-measure-local
```

## API 엔드포인트

### 새로운 구조 (권장)
- **이미지 처리**: `/processing/*`
  - `POST /processing/undistort` - 이미지 왜곡 보정
  - `POST /processing/depth-map` - 깊이 맵 생성
  - `GET /processing/depth-map-image` - 깊이 맵 이미지 조회
  - `GET /processing/depth-at-point` - 특정 좌표 깊이 값
  - `GET /processing/depth-meta` - 깊이 맵 메타데이터
  - `POST /processing/depth-distance` - 두 점 간 3D 거리 계산

- **AI 감지**: `/detection/*`
  - `POST /detection/auto-detect-room` - AI 자동 방 경계 감지
  - `POST /detection/estimate-room-size` - 방 크기 측정  
  - `POST /detection/detect-windows` - 창문 감지

### 레거시 호환성
기존 엔드포인트들도 계속 지원:
- `POST /undistort`, `POST /depth-map`, `GET /depth-map-image`
- `GET /get-depth-at-point`, `GET /depth-meta`, `POST /depth-distance`
- `POST /auto-detect-room`, `POST /estimate-room-size`, `POST /detect-windows`

### 시스템
- `GET /` - API 정보
- `GET /health` - 헬스체크
- `GET /docs` - API 문서 (Swagger)

## 설정 및 리소스 요구사항

### 시스템 요구사항
- **Python**: 3.12+
- **메모리**: 2-4GB (모델 로딩 시)
- **디스크**: ~2GB (모델 + 의존성)
- **CPU**: 멀티코어 권장 (이미지 처리 시)
- **GPU**: 선택사항 (CUDA 지원 시 가속)

### 성능 최적화
- **모델 캐싱**: YOLO/MiDaS 모델 한 번만 로딩
- **GPU 가속**: CUDA 사용 가능 시 자동 활용
- **이미지 크기**: 처리 속도를 위한 자동 리사이징
- **메모리 관리**: 대용량 이미지 배치 처리 최적화

## 처리 워크플로우

### 기본 이미지 처리
1. **업로드** → 이미지 파일 검증
2. **왜곡 보정** → 카메라 캘리브레이션 적용
3. **깊이 맵 생성** → MiDaS 모델 추론
4. **결과 저장** → outputs/ 폴더에 저장

### AI 방 감지
1. **전처리** → 이미지 정규화 및 크기 조정
2. **AI 분석** → 개선된 방 감지 알고리즘
3. **후처리** → 신뢰도 필터링 및 좌표 보정
4. **폴백** → 실패 시 기존 알고리즘 사용

### 방 크기 측정
1. **깊이 정보** → 픽셀별 실제 거리 매핑
2. **기하학적 계산** → 투시 변환 및 스케일 보정
3. **크기 추정** → 실제 방 넓이/높이 계산

## 테스트 및 디버깅

### API 테스트
```bash
# 헬스체크
curl http://localhost:3010/health

# 이미지 업로드 테스트
curl -X POST -F "file=@test_image.jpg" \
     http://localhost:3010/undistort

# 깊이 맵 생성
curl -X POST http://localhost:3010/depth-map

# 특정 좌표 깊이 조회
curl http://localhost:3010/get-depth-at-point?x=100&y=150
```

### 로그 확인
```bash
# 실시간 로그 모니터링
python main.py 2>&1 | tee app.log

# 에러 로그 필터링
grep "ERROR" app.log
```

## 트러블슈팅

### 일반적인 문제
1. **모델 로딩 실패**
   - YOLO 모델 재다운로드: models/ 폴더의 yolo11n.pt 삭제 후 재실행
   - PyTorch Hub 캐시 문제: `torch.hub.set_dir()` 설정 확인

2. **메모리 부족**
   - 이미지 크기 축소: 입력 이미지 해상도 조정
   - 배치 크기 축소: 동시 처리 이미지 수 제한

3. **GPU 사용 문제**
   - CUDA 설치 확인: `torch.cuda.is_available()` 체크
   - 드라이버 호환성: PyTorch와 CUDA 버전 매칭

4. **포트 충돌**
   - 포트 변경: `main.py`에서 포트 3010 → 다른 포트
   - 프로세스 확인: `lsof -i :3010`

### 성능 최적화
```bash
# 메모리 사용량 모니터링
htop

# GPU 사용량 확인 (NVIDIA)
nvidia-smi

# 디스크 I/O 모니터링
iotop
```

## 개발 가이드

### 새 기능 추가
1. **모델**: `src/models/schemas.py`에 Pydantic 스키마 정의
2. **라우터**: `src/routes/`에 새 라우터 파일 생성
3. **서비스**: 비즈니스 로직은 `src/processing/` 또는 `src/detection/`에 분리
4. **등록**: `main.py`에서 라우터 등록

### 코드 구조 규칙
- **단일 책임**: 각 모듈은 하나의 책임만
- **의존성 주입**: 모듈 간 의존성은 상대 import로 관리
- **에러 처리**: 일관된 에러 응답 형식
- **로깅**: 모든 중요한 작업은 로그 기록

## 모니터링 및 로깅

### 로그 레벨
- **INFO**: 정상 처리 과정
- **WARNING**: 폴백 알고리즘 사용
- **ERROR**: 처리 실패 및 예외
- **DEBUG**: 상세 디버깅 정보

### 성능 메트릭
- **처리 시간**: 각 API 엔드포인트별 응답 시간
- **메모리 사용량**: 모델 로딩 시 메모리 사용량
- **GPU 활용률**: CUDA 사용 시 GPU 효율성
- **에러율**: 실패한 요청 비율

## 관련 서비스

- **backend-cloud** (포트 3000): 사용자 인증 및 데이터 저장
- **frontend** (포트 3001): 웹 인터페이스
- **nginx**: 리버스 프록시 및 로드 밸런싱

## 라이선스 및 모델 정보

### 사용된 오픈소스 모델
- **MiDaS**: MIT License (Intel ISL)
- **YOLO11**: AGPL-3.0 License (Ultralytics)
- **PyTorch**: BSD License (Meta)

### 주의사항
- 상업적 사용 시 YOLO11 라이선스 확인 필요
- 대용량 이미지 처리 시 메모리 사용량 주의
- GPU 메모리 부족 시 자동으로 CPU 모드로 전환