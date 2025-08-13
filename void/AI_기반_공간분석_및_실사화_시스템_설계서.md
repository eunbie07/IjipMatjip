# SW개발 설계서

**프로젝트명**: 이집맛집(IjipMatjip) - AI 기반 공간 분석 및 인테리어 시뮬레이션 플랫폼

---

## 1. 요구사항 정의서

| 구분      | 기능               | 설명                                                              |
| :------ | :--------------- | :-------------------------------------------------------------- |
| **S/W** | **사용자 기능**       |                                                                 |
|         | 1. 방 이미지 업로드     | 사용자가 부동산 방 사진을 업로드하여 분석을 시작할 수 있다.                              |
|         | 2. 방 크기 자동 측정    | AI 또는 4포인트 클릭 방식으로 방의 가로/세로 길이를 자동 계산한다.                        |
|         | 3. 3D 공간 시각화     | Three.js를 활용하여 측정된 방 크기를 3D 공간으로 렌더링한다.                         |
|         | 4. 실시간 가구 배치     | 드래그앤드롭 방식으로 3D 가구를 실시간으로 배치하고 이동/회전할 수 있다.                      |
|         | 5. AI 인테리어 생성    | Stability AI, Replicate, Vertex AI를 활용하여 스타일 기반 인테리어 이미지를 생성한다. |
|         | 6. 레이아웃 저장/불러오기  | 완성된 방 레이아웃을 저장하고 나중에 불러올 수 있다.                                  |
|         | **백엔드 시스템 기능**   |                                                                 |
|         | 7. 광각 왜곡 보정      | cv2.undistort() 함수를 통해 광각 카메라로 촬영된 이미지의 왜곡을 1차 보정한다.            |
|         | 8. 깊이 맵 생성       | 단일 2D 이미지로부터 깊이 정보를 추출하여 3D 공간을 추론한다.                           |
|         | 9. 창문/방 경계 자동 감지 | YOLO, RoomNet 등 AI 모델을 활용하여 방 이미지에서 주요 구조를 자동으로 탐지한다.           |
|         | 10. 가구 배치 보존     | '하이브리드 입력 이미지' 기술을 통해 원본 배치를 유지하며 스타일만 변경한다.                    |
|         | 11. 사용자 인증       | 회원가입/로그인을 통해 개인별 레이아웃을 관리한다.                                    |
| **H/W** | **서버 요구사항**      |                                                                 |
|         | 12. 고성능 GPU 지원   | AI 이미지 생성을 위한 GPU 가속 처리를 지원한다.                                  |
|         | 13. 멀티 플랫폼 지원    | Windows, macOS, Linux 환경에서 서버를 운영할 수 있다.                        |

---

## 2. 서비스 구성도 - 서비스 시나리오

### 하이브리드 아키텍처 구성

```
로컬 환경 (사용자 PC)              클라우드 환경 (AWS EC2)
┌─────────────────────────┐     ┌─────────────────────────┐
│   Backend-Local         │     │   Backend-Cloud        │
│   (포트: 3010)          │────▶│   (포트: 3000)         │
│                         │     │                        │
│   • AI 이미지 처리      │     │   • 사용자 인증        │
│   • 방 크기 측정        │     │   • 데이터 저장        │
│   • 창문 감지           │     │   • 레이아웃 관리      │
│   • YOLO, MiDaS 모델    │     │                        │
│   • OpenCV 처리         │     │   Frontend             │
└─────────────────────────┘     │   (포트: 80/443)        │
                               │                        │
                               │   • React 18 + Vite    │
                               │   • Three.js 3D 렌더링  │
                               │   • Tailwind CSS UI     │
                               └─────────────────────────┘
```

### 사용자 접근 및 시스템 인터페이스

1.  **사용자 접근**: 사용자는 웹 브라우저를 통해 프론트엔드 서비스에 접근하여 방 이미지 업로드, 측정, 3D 시뮬레이션 등 모든 기능을 사용한다.
2.  **시스템 연동**: 프론트엔드는 기능에 따라 Backend-Local(무거운 AI 처리) 또는 Backend-Cloud(데이터 관리) API를 호출하여 실시간으로 결과를 사용자에게 보여준다.

---

## 3. 메뉴 구성도

```
이집맛집 메인 앱
└── 방 측정 모드
    ├── 이미지 업로드
    │   ├── 파일 선택
    │   └── 샘플 이미지
    └── 측정 결과
        ├── 3D 뷰어
        ├── 가구 배치
        └── 저장/공유

└── AI 인테리어 생성
    ├── 스타일 선택
    │   ├── 현대적
    │   ├── 클래식
    │   └── 미니멀
    ├── 생성 옵션
    │   ├── 강도 조절
    │   └── AI 제공자
    └── 결과 관리
        ├── 다운로드
        └── 히스토리

└── 계정 관리
    ├── 로그인/회원가입
    └── 마이페이지 (레이아웃 히스토리)
```

---

## 4. 화면설계서 - 사용자 인터페이스(SW)

### 주요 화면 구성 및 플로우

#### **화면 1: 메인 대시보드**
*   **목적**: 서비스의 시작점으로, 사용자가 원하는 기능(방 측정, 기존 레이아웃 불러오기)을 선택할 수 있도록 안내합니다.
*   **주요 컴포넌트**:
    *   **헤더**: 로고, 로그인/회원가입 버튼, 마이페이지 링크.
    *   **메인 배너**: 서비스의 핵심 가치를 보여주는 이미지 또는 문구.
    *   **기능 선택 버튼**:
        *   `[새로운 방 측정 시작하기]`: 방 측정 플로우(화면 2)로 진입합니다.
        *   `[내 레이아웃 불러오기]`: 사용자가 저장한 레이아웃 목록을 보여주는 모달(Modal)을 엽니다.
    *   **푸터**: 서비스 정보, 이용약관, 연락처 등.

#### **화면 2: 방 측정 플로우 (단계별 UI)**
*   **목적**: 사용자가 업로드한 이미지를 기반으로 방의 크기를 정확하게 측정하는 단계별 가이드를 제공합니다.
*   **주요 컴포넌트 및 인터랙션**:
    *   **Step 1: 이미지 업로드**:
        *   파일 드래그앤드롭 영역 또는 파일 선택 버튼을 제공합니다.
        *   업로드된 이미지는 중앙에 표시됩니다.
    *   **Step 2: 측정 방식 선택**:
        *   `[AI로 자동 측정]`: Backend-Local의 AI 방 경계 탐지 기능을 호출하여 자동으로 모서리 포인트를 찾습니다. 사용자는 탐지된 포인트를 미세 조정할 수 있습니다.
        *   `[수동으로 4포인트 지정]`: 사용자가 직접 이미지 위에서 방의 기준이 될 4개의 모서리(벽 하단, 벽 상단, 왼쪽 바닥, 오른쪽 바닥)를 클릭하도록 안내합니다.
    *   **Step 3: 측정 결과 확인**:
        *   Backend-Local에서 계산된 방의 `가로`, `세로`, `높이`가 화면에 표시됩니다.
        *   `[3D 스튜디오로 이동]` 버튼을 클릭하여 측정된 값을 기반으로 생성된 3D 공간(화면 3)으로 진입합니다.

#### **화면 3: 3D 인테리어 스튜디오**
*   **목적**: 3D로 렌더링된 공간에서 가구를 배치하고, AI를 통해 원하는 스타일의 인테리어로 변환하는 핵심 작업 공간입니다.
*   **주요 컴포넌트 및 인터랙션**:
    *   **중앙 뷰포트 (Viewport)**:
        *   Three.js로 렌더링된 3D 방 모델이 표시됩니다.
        *   마우스/터치로 뷰를 회전, 확대/축소, 이동할 수 있습니다.
    *   **사이드바 (Sidebar)**:
        *   **가구 라이브러리 탭**: 침대, 책상, 소파 등 카테고리별 가구 목록을 보여줍니다. 사용자는 여기서 가구를 뷰포트로 드래그앤드롭하여 배치할 수 있습니다.
        *   **AI 생성 탭**:
            *   **스타일 선택**: '모던', '클래식', '한국식' 등 인테리어 스타일을 선택하는 라디오 버튼 또는 드롭다운 메뉴.
            *   **AI 옵션**: 생성 강도(Strength), 가이던스(Guidance) 등을 조절하는 슬라이더.
            *   `[인테리어 생성하기]` 버튼: 현재 3D 뷰를 캡처하고 선택된 스타일을 적용하여 Backend-Cloud에 AI 생성을 요청합니다.
    *   **결과 표시**:
        *   AI 생성이 완료되면, 결과 이미지가 모달 창이나 별도의 뷰에 표시됩니다.
        *   사용자는 결과를 `[다운로드]` 하거나 `[레이아웃 저장]` 버튼을 눌러 현재 상태를 저장할 수 있습니다.

---

## 5. 엔티티관계도 - ERD 및 테이블 정의서

### 데이터베이스 구조 (PostgreSQL + MongoDB)

**PostgreSQL: 사용자 및 레이아웃 정보 관리**
```
┌──────────────────────┐    ┌──────────────────────────────────────┐
│       users          │    │           room_layouts               │
├──────────────────────┤    ├──────────────────────────────────────┤
│  id         SERIAL   │◄──┤│  id               SERIAL             │
│  email      VARCHAR  │    │  user_id          INT (FK)           │
│  password   VARCHAR  │    │  layout_name      VARCHAR(100)       │
│  created_at TIMESTAMP│    │  layout_data      JSONB              │
└──────────────────────┘    │  created_at       TIMESTAMP          │
                           │  updated_at       TIMESTAMP          │
                           └──────────────────────────────────────┘
```
**MongoDB: AI 생성 이미지 히스토리 관리**
```json
{
  "collection": "ai_generations",
  "schema": {
    "_id": "ObjectId",
    "user_id": "String",
    "layout_id": "String",
    "provider": "String (stability|replicate|vertex)",
    "style": "String",
    "output_image_url": "String",
    "created_at": "Date"
  }
}
```

### PostgreSQL 테이블 정의서

#### **users 테이블**
| 컬럼명 | Type | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY | 사용자 고유 ID |
| email | VARCHAR(100) | UNIQUE, NOT NULL | 사용자 이메일 (로그인용) |
| password | VARCHAR(255) | NOT NULL | 암호화된 비밀번호 |
| created_at | TIMESTAMP | DEFAULT NOW() | 계정 생성일시 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 최종 수정일시 |

#### **room_layouts 테이블**
| 컬럼명 | Type | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY | 레이아웃 고유 ID |
| user_id | INT | FOREIGN KEY (users.id) | 레이아웃을 생성한 사용자 ID |
| layout_name | VARCHAR(100) | NOT NULL | 사용자가 지정한 레이아웃 이름 |
| layout_data | JSONB | NOT NULL | 방 크기, 가구 배치 등 상세 정보 |
| created_at | TIMESTAMP | DEFAULT NOW() | 레이아웃 생성일시 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 최종 수정일시 |


---

## 6. 기능 처리도(기능 흐름도)

### 이집맛집 AI 인테리어 시뮬레이션 연계도

사용자의 선택에 따라 기능 흐름이 어떻게 분기되고 연계되는지를 상세히 나타냅니다.

```mermaid
graph TD
    subgraph "사용자 시작"
        A[앱 실행] --> B{메인 메뉴};
    end

    subgraph "경로 1: 방 측정부터 시작"
        B -- "방 측정 모드 선택" --> C[1. 이미지 업로드];
        C --> D[2. Backend-Local: 왜곡 보정 및 AI 분석];
        D --> E[3. 사용자: 측정 방식 선택/확인<br>(AI 자동 또는 4포인트 수동)];
        E --> F[4. Backend-Local: 방 크기 계산];
        F --> G[5. Frontend: 3D 공간 렌더링];
        G --> H[6. 사용자: 3D 가구 배치];
    end

    subgraph "경로 2: AI 생성부터 시작"
         B -- "AI 인테리어 생성 선택" --> I{7. AI 인테리어 생성};
    end
    
    subgraph "공통: AI 생성 및 저장"
        H -- "AI 생성 요청" --> I;
        I --> J[8. 사용자: 인테리어 스타일 선택];
        J --> K[9. Backend-Cloud: AI Provider 연동 및<br>하이브리드 이미지 생성];
        K --> L[10. AI 이미지 생성 완료];
        L --> M[11. Frontend: 최종 결과 표시];
        H -- "레이아웃 저장" --> N[12. Backend-Cloud: 레이아웃 데이터 저장];
        M -- "결과 저장" --> N;
    end
```

**주요 흐름 설명:**

1.  **경로 1 (측정 우선):** 사용자가 직접 방 사진을 올리고 측정하는 전체 과정을 거칩니다. 측정된 3D 공간에 가구를 배치한 후, 그 상태에서 AI 생성을 요청하거나 레이아웃을 저장할 수 있습니다.
2.  **경로 2 (AI 우선):** 사용자가 기존에 저장된 레이아웃을 불러오거나 샘플을 사용하여 바로 AI 인테리어 생성 단계로 진입할 수 있습니다.
3.  **공통 흐름:** 두 경로는 최종적으로 'AI 인테리어 생성' 및 '레이아웃 저장' 기능으로 이어집니다. AI 생성은 클라우드 백엔드를 통해 처리되며, 레이아웃 저장은 사용자의 계정에 데이터를 영구적으로 보관합니다.

---

## 7. 프로그램 - 목록

프로젝트의 전체 기능을 모듈별로 세분화하고 체계적인 번호를 부여하여 관리합니다.

| 기능 분류 | 기능번호 | 기능 명 | 담당 모듈 |
| :--- | :--- | :--- | :--- |
| **RM (Room Measure)** | RM-01-01 | 이미지 업로드 및 전송 | Frontend |
| | RM-01-02 | 광각 왜곡 보정 | Backend-Local |
| | RM-01-03 | 깊이 맵 생성 | Backend-Local |
| | RM-01-04 | AI 방 경계 자동 탐지 | Backend-Local |
| | RM-01-05 | 4포인트 수동 측정 | Frontend |
| | RM-01-06 | 방 크기 최종 계산 | Backend-Local |
| **FE (Frontend)** | FE-02-01 | 3D 공간 렌더링 (Three.js) | Frontend |
| | FE-02-02 | 가구 라이브러리 표시 | Frontend |
| | FE-02-03 | 가구 드래그앤드롭 배치 | Frontend |
| | FE-02-04 | 가구 충돌 감지 | Frontend |
| | FE-02-05 | 3D 뷰 스크린샷 캡처 | Frontend |
| **AI (AI Generation)** | AI-03-01 | 하이브리드 이미지 생성 | Backend-Cloud |
| | AI-03-02 | 스타일 기반 프롬프트 빌더 | Backend-Cloud |
| | AI-03-03 | 외부 AI 서비스 연동 (Vertex, Replicate) | Backend-Cloud |
| | AI-03-04 | AI 생성 결과 후처리 | Backend-Cloud |
| **SYS (System)** | SYS-04-01 | 사용자 회원가입/로그인 | Backend-Cloud |
| | SYS-04-02 | JWT 토큰 기반 인증 | Backend-Cloud |
| | SYS-04-03 | 레이아웃 데이터 저장 (PostgreSQL) | Backend-Cloud |
| | SYS-04-04 | 레이아웃 데이터 조회/관리 | Backend-Cloud |
| | SYS-04-05 | AI 생성 히스토리 저장 (MongoDB) | Backend-Cloud |

---

## 8. 핵심소스코드

프로젝트의 핵심 기능을 대표하는 네 가지 주요 모듈의 소스코드입니다.

### 1) 공간 측정의 핵심: AI 기반 자동 탐지 및 폴백(Fallback)
*   **파일**: `room-measure/backend-local/main.py`
*   **설명**: AI 모델(`detect_room_with_ai`)을 우선적으로 사용하여 방의 경계를 탐지하고, 만약 AI가 탐지에 실패하면 전통적인 이미지 처리 방식(`simulate_roomnet_detection`)으로 자동 전환되는 안정적인 로직입니다.

```python
@app.post("/auto-detect-room")
async def auto_detect_room(file: UploadFile = File(...), confidence_threshold: float = Query(0.7)):
    # ... 파일 처리 로직 ...
    try:
        # 1. AI 기반 방 감지 우선 시도
        result = detect_room_with_ai(temp_image_path, confidence_threshold)
        if result and result.get("success"):
            return result
        else:
            # 2. AI 실패 시, 대체(Fallback) 로직 수행
            fallback_result = simulate_roomnet_detection(temp_image_path, confidence_threshold)
            if fallback_result and fallback_result.get("success"):
                return fallback_result
            else:
                raise HTTPException(status_code=422, detail="방 경계 자동 감지 실패")
    finally:
        os.unlink(temp_image_path)
```

### 2) 3D 인터랙션의 핵심: 드래그앤드롭 가구 배치
*   **파일**: `room-measure/frontend/src/components/3D/DraggableFurniture.jsx`
*   **설명**: React와 Three.js 환경에서 사용자의 마우스 입력을 받아 3D 공간 좌표로 변환하고, 가구가 방 경계를 벗어나지 않도록 위치를 제한하며 실시간으로 렌더링하는 핵심 UI 로직입니다.

```javascript
import { useDrag } from '@use-gesture/react';
import * as THREE from 'three';

export default function DraggableFurniture({ furniture, position, onPositionChange, roomBounds }) {
  const bind = useDrag(({ active, event }) => {
    if (active) {
      // 마우스 좌표를 3D 공간 좌표로 변환
      const vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z;
      const pos = camera.position.clone().add(dir.multiplyScalar(distance));
      
      // 방 경계 내로 위치 제한 (Clamping)
      const clampedX = Math.max(-roomBounds.width/2, Math.min(roomBounds.width/2, pos.x));
      const clampedZ = Math.max(-roomBounds.depth/2, Math.min(roomBounds.depth/2, pos.z));
      
      onPositionChange([clampedX, position[1], clampedZ]); // 부모 컴포넌트로 위치 업데이트
    }
  });
  
  return <mesh position={position} {...bind()}><boxGeometry args={furniture.size} /> ... </mesh>;
}
```

### 3) AI 실사화의 핵심: 하이브리드 이미지 생성
*   **파일**: `image-realistic/backend/main.py`
*   **설명**: 이 프로젝트의 핵심 아이디어로, JSON의 **구조적 정확성**과 3D 캡처의 **스타일 힌트**를 결합합니다. 2D 레이아웃 위에 Canny Edge를 겹쳐 AI가 가구 배치를 절대 망가뜨리지 않도록 유도하는 '하이브리드 입력 이미지'를 생성합니다.

```python
def create_hybrid_input_image(scene_json_str: str, capture_bytes: bytes, output_size=(1024, 1024)) -> bytes:
    scene_model = Scene.model_validate(json.loads(scene_json_str)['scene'])
    
    # 1. JSON으로 구조적 2D 레이아웃 생성
    layout_bytes = generate_layout_from_json(scene_model, img_size=output_size)
    
    # 2. 3D 캡처로 스타일 힌트(Canny Edge) 추출
    canny_bytes = canny_from_bytes(capture_bytes)
    
    # 3. 두 이미지를 오버레이하여 최종 AI 입력 생성
    hybrid_image_bytes = overlay_images(layout_bytes, canny_bytes, alpha=0.5)
    
    return hybrid_image_bytes
```

### 4) AI 지능의 핵심: 동적 프롬프트 빌더
*   **파일**: `image-realistic/backend/prompt_builder.py`
*   **설명**: 사용자가 선택한 스타일과 3D 씬에 배치된 가구 목록을 바탕으로, AI가 최상의 결과물을 생성할 수 있도록 동적으로 프롬프트를 조합하고 구성하는 모듈입니다.

```python
def build_prompt(style_key: str, mode: str, furniture_list: list) -> (str, str):
    # 기본 스타일 프롬프트
    base_prompt = f"A high-quality, photorealistic image of a room with a {style_key} interior style."
    
    # 가구 목록 추가
    if furniture_list:
        base_prompt += " The room contains: " + ", ".join(furniture_list) + "."
        
    # 배치 보존 모드에 따른 지시어 추가
    if mode == 'strict':
        base_prompt += " Strictly preserve the layout, size, and position of all furniture."
    
    # 부정 프롬프트 (원치 않는 결과 방지)
    negative_prompt = "cartoon, drawing, ugly, deformed, blurry, low quality"
    
    return base_prompt, negative_prompt
```
