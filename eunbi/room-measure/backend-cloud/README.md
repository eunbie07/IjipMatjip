# Room Measure Cloud Backend

EC2 배포용 모듈화된 백엔드 서버 (포트 3000)

## 프로젝트 구조

```
backend-cloud/
├── src/                    # 소스 코드
│   ├── auth/              # 인증 관련
│   │   ├── service.py     # JWT, 비밀번호 처리
│   │   └── __init__.py
│   ├── database/          # 데이터베이스 연결
│   │   ├── connections.py # PostgreSQL, MongoDB, JSON
│   │   └── __init__.py
│   ├── models/            # 데이터 모델
│   │   ├── schemas.py     # Pydantic 모델
│   │   └── __init__.py
│   ├── routes/            # API 라우터
│   │   ├── auth.py        # 인증 엔드포인트
│   │   ├── layouts.py     # 레이아웃 엔드포인트
│   │   └── __init__.py
│   └── __init__.py
├── config/                # 설정
│   ├── settings.py        # 환경 변수 관리
│   └── __init__.py
├── main.py               # 모듈화된 진입점
├── pyproject.toml        # Python 프로젝트 설정
├── .env.example          # 환경 변수 템플릿
├── Dockerfile            # Docker 설정
├── deploy.sh             # 배포 스크립트
└── README.md             # 문서
```

## 주요 기능
- **사용자 인증**: JWT 기반 회원가입/로그인
- **방 레이아웃 관리**: 3D 룸 데이터 저장/조회
- **가구 좌표 변환**: 2D ↔ 3D 좌표 변환
- **다중 저장소**: PostgreSQL + MongoDB + JSON 백업
- **게스트 모드**: 비회원 사용자 지원

## 기술 스택
- **Framework**: FastAPI 0.116+
- **Database**: PostgreSQL (사용자), MongoDB (레이아웃)
- **Authentication**: JWT + bcrypt
- **Deployment**: Docker + EC2
- **Package Manager**: uv (빠른 의존성 관리)

## 설치 및 실행

### 개발 환경
```bash
# 1. 환경 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 정보 입력

# 2. 의존성 설치 (uv 사용 권장)
pip install uv
uv pip install -e .

# 또는 pip 사용
pip install -e .

# 3. 데이터베이스 스키마 생성
# PostgreSQL에서 schema.sql 실행

# 4. 서버 실행
uvicorn main:app --host 0.0.0.0 --port 3000 --reload
```

### Docker 배포
```bash
# 1. 환경 설정
cp .env.example .env
# .env 파일 편집

# 2. 배포 스크립트 실행
chmod +x deploy.sh
./deploy.sh

# 또는 수동 배포
docker build -t room-measure-cloud .
docker run -d \
    --name room-measure-cloud \
    -p 3000:3000 \
    --env-file .env \
    --restart unless-stopped \
    room-measure-cloud
```

## API 엔드포인트

### 새로운 구조 (권장)
- **인증**: `/auth/*`
  - `POST /auth/signup` - 회원가입
  - `POST /auth/login` - 로그인  
  - `GET /auth/me` - 현재 사용자 정보

- **레이아웃**: `/layouts/*`
  - `POST /layouts/save` - 레이아웃 저장 (로그인)
  - `POST /layouts/save-guest` - 레이아웃 저장 (게스트)
  - `GET /layouts/` - 사용자 레이아웃 조회
  - `GET /layouts/guest` - 게스트 레이아웃 조회
  - `GET /layouts/{id}` - 특정 레이아웃 조회
  - `POST /layouts/convert-furniture-coordinates` - 좌표 변환

### 레거시 호환성
기존 엔드포인트들도 계속 지원:
- `POST /signup`, `POST /login`, `GET /me`
- `POST /save-room-layout`, `POST /save-room-layout-guest`
- `GET /room-layouts`, `GET /room-layouts-guest`
- `POST /convert-furniture-coordinates`

### 시스템
- `GET /` - API 정보
- `GET /health` - 헬스체크
- `GET /docs` - API 문서 (Swagger)

## 환경 변수

```env
# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# PostgreSQL 설정
POSTGRES_HOST=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-postgres-password
POSTGRES_DB=room_measure
POSTGRES_PORT=5432

# MongoDB 설정
MONGO_HOST=localhost
MONGO_DB=room_measure

# 로깅 설정
LOG_LEVEL=INFO
LOG_FILE=room_measure_cloud.log

# 환경
ENVIRONMENT=development
```

## 데이터베이스

### PostgreSQL (사용자 데이터)
```sql
-- 사용자 테이블
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 방 레이아웃 테이블
CREATE TABLE room_layouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    layout_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### MongoDB (레이아웃 데이터)
```javascript
// room_layouts 컬렉션
{
    scene: {
        room: { id, dimensions, ... },
        furniture: [ { id, type, position, ... } ]
    },
    user_id: ObjectId | null,  // null for guest users
    saved_at: "2025-01-01 12:00:00",
    format_version: "2.0.0"
}
```

### JSON 백업 (room_layouts.json)
MongoDB 실패 시 자동으로 JSON 파일에 백업 저장

## 개발 가이드

### 새 기능 추가
1. **모델**: `src/models/schemas.py`에 Pydantic 모델 추가
2. **라우터**: `src/routes/`에 새 라우터 파일 생성
3. **서비스**: 비즈니스 로직은 별도 서비스 파일로 분리
4. **등록**: `main.py`에서 라우터 등록

### 코드 구조 규칙
- **단일 책임**: 각 모듈은 하나의 책임만
- **의존성 주입**: 데이터베이스 연결은 의존성으로 주입
- **에러 처리**: 일관된 에러 응답 형식
- **로깅**: 모든 중요한 작업은 로그 기록

## 트러블슈팅

### 일반적인 문제
1. **포트 충돌**: 3000번 포트가 사용 중인 경우
2. **데이터베이스 연결**: PostgreSQL/MongoDB 연결 설정 확인
3. **환경 변수**: `.env` 파일 존재 및 값 확인
4. **권한 문제**: Docker 실행 권한 확인

### 로그 확인
```bash
# 컨테이너 로그
docker logs room-measure-cloud

# 파일 로그
tail -f room_measure_cloud.log
```

## 모니터링

- **헬스체크**: `GET /health` 엔드포인트
- **요청 로깅**: 모든 HTTP 요청 자동 로깅
- **에러 추적**: 상세한 에러 로그 및 스택 트레이스
- **성능 측정**: 요청 처리 시간 기록

## 배포 방법

### GitHub Actions 자동 배포
```bash
# dev-eunbi 브랜치에 push하면 자동 배포
git push origin dev-eunbi
```

### 수동 배포
```bash
# EC2에서 직접 실행
git pull origin dev-eunbi
./deploy.sh
```

배포 후 `GET /health` 엔드포인트로 상태 확인 가능합니다.