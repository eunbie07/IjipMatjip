# JIRA TASKS - 방 사진 기반 2D 평면도 자동 생성 프로젝트

## EPIC-1: AI 기반 분석 파이프라인 구성

### TASK-001: YOLOv11 모델 환경 구축
- **Description**: YOLOv11 사전 학습된 모델 로딩 및 추론 테스트 환경 구축
- **Acceptance Criteria**:
  - YOLOv11 모델 로딩 성공
  - 샘플 이미지로 추론 테스트 완료
  - 가구 감지 결과 확인 가능
- **Story Points**: 3
- **Assignee**: AI 담당자
- **Priority**: High
- **Sprint**: 1주차 (7/8-7/12)
- **Start Date**: 2025-07-08
- **Due Date**: 2025-07-09

### TASK-002: FastAPI 서버 기본 구조 설계
- **Description**: `/api/layout/detect` 엔드포인트 기본 스켈레톤 구성
- **Acceptance Criteria**:
  - FastAPI 프로젝트 구조 설정
  - 기본 라우터 및 엔드포인트 생성
  - API 문서 자동 생성 확인
- **Story Points**: 2
- **Assignee**: 백엔드 담당자
- **Priority**: High
- **Sprint**: 1주차 (7/8-7/12)
- **Start Date**: 2025-07-08
- **Due Date**: 2025-07-09

### TASK-003: 프론트엔드 파일 업로드 컴포넌트 구현
- **Description**: 사진 업로드 드래그앤드롭 UI 및 층고 입력 필드 구현
- **Acceptance Criteria**:
  - 드래그앤드롭 기능 동작
  - 이미지 미리보기 기능
  - 층고 입력 필드 및 유효성 검사
- **Story Points**: 5
- **Assignee**: 프론트엔드 담당자
- **Priority**: High
- **Sprint**: 1주차 (7/8-7/12)
- **Start Date**: 2025-07-08
- **Due Date**: 2025-07-11

### TASK-004: 이미지 업로드 API 연동
- **Description**: 프론트엔드와 백엔드 간 이미지 업로드 API 연동
- **Acceptance Criteria**:
  - 이미지 파일 업로드 성공
  - 서버에서 이미지 수신 및 저장
  - 업로드 상태 피드백
- **Story Points**: 3
- **Assignee**: 풀스택 담당자
- **Priority**: Medium
- **Sprint**: 1주차 (7/8-7/12)
- **Start Date**: 2025-07-10
- **Due Date**: 2025-07-12

## EPIC-2: MiDaS 기반 실측 거리 추정 기능 구현

### TASK-005: MiDaS 모델 통합 및 깊이 추정
- **Description**: MiDaS 모델을 이용한 깊이 맵 생성 기능 구현
- **Acceptance Criteria**:
  - MiDaS 모델 로딩 및 추론 성공
  - 입력 이미지에 대한 깊이 맵 생성
  - 깊이 데이터 정규화 및 후처리
- **Story Points**: 8
- **Assignee**: AI 담당자
- **Priority**: High
- **Sprint**: 2주차 (7/14-7/18)
- **Start Date**: 2025-07-14
- **Due Date**: 2025-07-17

### TASK-006: 3D 좌표 변환 함수 구현
- **Description**: MiDaS depth 값을 3D 좌표로 변환하는 함수 개발
- **Acceptance Criteria**:
  - `to_3d_point()` 함수 구현
  - 픽셀 좌표와 깊이값을 3D 좌표로 변환
  - 카메라 파라미터 기반 변환 로직
- **Story Points**: 5
- **Assignee**: AI 담당자
- **Priority**: High
- **Sprint**: 2주차 (7/14-7/18)
- **Start Date**: 2025-07-15
- **Due Date**: 2025-07-17

### TASK-007: 방 크기 추정 API 구현
- **Description**: `/estimate-room-size` API 엔드포인트 구현
- **Acceptance Criteria**:
  - 4개 지점(바닥, 천장, 좌/우 벽) 입력 처리
  - 3D 거리 계산 및 스케일 보정
  - 기존 2D 방식 대비 개선율 계산
- **Story Points**: 8
- **Assignee**: 백엔드 담당자
- **Priority**: High
- **Sprint**: 2주차 (7/14-7/18)
- **Start Date**: 2025-07-14
- **Due Date**: 2025-07-18

### TASK-008: 깊이 기반 거리 계산 UI
- **Description**: 사용자가 클릭한 지점의 깊이 정보 표시 및 거리 계산 UI
- **Acceptance Criteria**:
  - 이미지 클릭 시 좌표 및 깊이값 표시
  - 실시간 거리 계산 결과 표시
  - 2D vs 3D 방식 비교 시각화
- **Story Points**: 6
- **Assignee**: 프론트엔드 담당자
- **Priority**: Medium
- **Sprint**: 2주차 (7/14-7/18)
- **Start Date**: 2025-07-16
- **Due Date**: 2025-07-18

### TASK-009: 스케일 보정 알고리즘 개발
- **Description**: 실제 층고 기준 스케일 보정 알고리즘 구현
- **Acceptance Criteria**:
  - 사용자 입력 층고값 기반 보정
  - 기준 객체 크기 보정 로직
  - 보정 전후 정확도 비교
- **Story Points**: 5
- **Assignee**: AI 담당자
- **Priority**: Medium
- **Sprint**: 2주차 (7/14-7/18)
- **Start Date**: 2025-07-17
- **Due Date**: 2025-07-18

## EPIC-3: 정확도 향상 및 안정화 작업

### TASK-010: 다양한 이미지 테스트 및 검증
- **Description**: 다양한 방 이미지로 정확도 검증 및 벤치마킹
- **Acceptance Criteria**:
  - 최소 50장 이상의 테스트 이미지 수집
  - 실제값 대비 예측값 정확도 측정
  - 오차 분석 및 개선점 도출
- **Story Points**: 8
- **Assignee**: AI 담당자
- **Priority**: High
- **Sprint**: 3주차 (7/21-7/25)
- **Start Date**: 2025-07-21
- **Due Date**: 2025-07-24

### TASK-011: 에러 핸들링 및 예외 처리
- **Description**: 시스템 전반의 에러 핸들링 및 예외 처리 구현
- **Acceptance Criteria**:
  - API 레벨 에러 처리
  - 프론트엔드 에러 상태 관리
  - 사용자 친화적 에러 메시지
- **Story Points**: 5
- **Assignee**: 풀스택 담당자
- **Priority**: Medium
- **Sprint**: 3주차 (7/21-7/25)
- **Start Date**: 2025-07-22
- **Due Date**: 2025-07-24

### TASK-012: 성능 최적화
- **Description**: AI 모델 추론 속도 및 전체 시스템 성능 최적화
- **Acceptance Criteria**:
  - 모델 추론 시간 50% 단축
  - 메모리 사용량 최적화
  - 동시 처리 가능한 요청 수 증대
- **Story Points**: 6
- **Assignee**: AI 담당자
- **Priority**: Medium
- **Sprint**: 3주차 (7/21-7/25)
- **Start Date**: 2025-07-23
- **Due Date**: 2025-07-25

### TASK-013: 로깅 및 모니터링 시스템 구축
- **Description**: 시스템 로깅 및 모니터링 체계 구축
- **Acceptance Criteria**:
  - 구조화된 로그 시스템 구현
  - 주요 메트릭 수집 및 모니터링
  - 알림 시스템 연동
- **Story Points**: 4
- **Assignee**: 백엔드 담당자
- **Priority**: Low
- **Sprint**: 3주차 (7/21-7/25)
- **Start Date**: 2025-07-24
- **Due Date**: 2025-07-25

## EPIC-4: 팀 통합 작업 및 웹애플리케이션 완성

### TASK-014: 컴포넌트 통합 및 코드 리뷰
- **Description**: 팀원별 개발 컴포넌트 통합 및 코드 리뷰
- **Acceptance Criteria**:
  - 모든 컴포넌트 충돌 없이 통합
  - 코드 스타일 가이드 적용
  - 팀 코드 리뷰 완료
- **Story Points**: 8
- **Assignee**: 팀 전체
- **Priority**: High
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-07-28
- **Due Date**: 2025-07-29

### TASK-037: 개발 컴포넌트 코드 리뷰 (7/29 추가)
- **Description**: 팀원별로 개발한 컴포넌트에 대한 종합적인 코드 리뷰 실시
- **Acceptance Criteria**:
  - 모든 개발 컴포넌트의 코드 품질 검토
  - 코딩 컨벤션 및 스타일 가이드 준수 여부 확인
  - 성능 및 보안 이슈 점검
  - 리팩토링 필요 사항 도출
- **Story Points**: 6
- **Assignee**: 팀 전체
- **Priority**: High
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-07-29
- **Due Date**: 2025-07-29

### TASK-015: 전체 애플리케이션 네비게이션 구성
- **Description**: 전체 앱의 네비게이션 구조 및 라우팅 시스템 완성
- **Acceptance Criteria**:
  - React Router 기반 라우팅 구현
  - 네비게이션 메뉴 및 브레드크럼
  - 페이지 간 데이터 전달 로직
- **Story Points**: 5
- **Assignee**: 프론트엔드 담당자
- **Priority**: High
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-07-29
- **Due Date**: 2025-07-30

### TASK-038: 전체 애플리케이션 네비게이션 구조 완성 (7/29 상세)
- **Description**: 통합된 웹애플리케이션의 전체 네비게이션 시스템 구현
- **Acceptance Criteria**:
  - 메인 네비게이션 메뉴 구조 설계 및 구현
  - 페이지 간 라우팅 로직 완성
  - 브레드크럼 및 사이드바 네비게이션 추가
  - 사용자 권한에 따른 네비게이션 제어
- **Story Points**: 8
- **Assignee**: 프론트엔드 담당자
- **Priority**: High
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-07-29
- **Due Date**: 2025-07-29

### TASK-039: 백엔드 분리 아키텍처 구현 (7/29 추가)
- **Description**: backend-cloud와 backend-local로 백엔드 시스템 분리
- **Acceptance Criteria**:
  - backend-cloud: 사용자 인증 및 데이터 저장 서비스 (포트 3000)
  - backend-local: AI 이미지 처리 서비스 (포트 3010)
  - 분리된 백엔드 간 통신 인터페이스 구현
  - 로드밸런싱 및 서비스 디스커버리 설정
- **Story Points**: 10
- **Assignee**: 백엔드 담당자
- **Priority**: High
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-07-29
- **Due Date**: 2025-07-29

### TASK-040: 공통 스타일 가이드 적용 및 CSS 통합 (7/29 추가)
- **Description**: 전체 애플리케이션에 일관된 디자인 시스템 적용
- **Acceptance Criteria**:
  - 공통 CSS 변수 및 테마 시스템 구축
  - 컴포넌트별 스타일 가이드 통일
  - 반응형 디자인 규칙 적용
  - 디자인 토큰 기반 스타일 시스템 구현
- **Story Points**: 7
- **Assignee**: 프론트엔드 담당자
- **Priority**: Medium
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-07-29
- **Due Date**: 2025-07-29

### TASK-016: 상태 관리 시스템 통합
- **Description**: Redux 또는 Context API 기반 전역 상태 관리
- **Acceptance Criteria**:
  - 전역 상태 관리 구조 설계
  - 컴포넌트 간 상태 공유
  - 상태 변화 로직 최적화
- **Story Points**: 6
- **Assignee**: 프론트엔드 담당자
- **Priority**: High
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-07-29
- **Due Date**: 2025-07-30

### TASK-017: API 통합 및 데이터 플로우 검증
- **Description**: 프론트엔드-백엔드 API 통합 및 데이터 플로우 검증
- **Acceptance Criteria**:
  - 모든 API 엔드포인트 연동 완료
  - 데이터 전송/수신 검증
  - API 에러 처리 및 로딩 상태 관리
- **Story Points**: 8
- **Assignee**: 풀스택 담당자
- **Priority**: High
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-07-30
- **Due Date**: 2025-07-31

### TASK-041: 하이브리드 아키텍처 구현 (7/30 추가)
- **Description**: 로컬 AI + 클라우드 데이터의 하이브리드 아키텍처 구현
- **Acceptance Criteria**:
  - backend-local (포트 3010): AI 이미지 처리 서비스 구성
  - backend-cloud (포트 3000): 사용자 인증 및 데이터 저장 구성
  - 프론트엔드-백엔드 API 통신 검증
  - CORS 설정 및 크로스 오리진 통신 구현
- **Story Points**: 12
- **Assignee**: 풀스택 담당자
- **Priority**: High
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-07-30
- **Due Date**: 2025-07-30

### TASK-018: UI/UX 일관성 및 반응형 디자인
- **Description**: 전체 애플리케이션 UI/UX 일관성 확보 및 반응형 디자인 적용
- **Acceptance Criteria**:
  - 공통 디자인 시스템 적용
  - 모바일/태블릿/데스크톱 반응형 지원
  - 접근성(Accessibility) 기본 요구사항 충족
- **Story Points**: 10
- **Assignee**: 프론트엔드 담당자
- **Priority**: Medium
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-07-31
- **Due Date**: 2025-08-01

### TASK-042: Three.js 기반 3D 방 시각화 구현 (7/31 추가)
- **Description**: Three.js를 이용한 3D 방 시각화 시스템 구현
- **Acceptance Criteria**:
  - Three.js 3D 렌더링 엔진 구성
  - 방 구조 3D 모델링 및 시각화
  - 카메라 컨트롤 및 조명 설정
  - 성능 최적화 (LOD, 메모리 관리)
- **Story Points**: 15
- **Assignee**: 프론트엔드 담당자
- **Priority**: High
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-07-31
- **Due Date**: 2025-07-31

### TASK-043: 가구 드래그앤드롭 기능 개발 (7/31 추가)
- **Description**: 3D 환경에서 가구 배치 및 드래그앤드롭 시스템 구현
- **Acceptance Criteria**:
  - 가구 모델 라이브러리 구성
  - 3D 공간에서 가구 배치 인터페이스
  - 드래그앤드롭 상호작용 구현
  - 충돌 감지 및 배치 제약 조건
- **Story Points**: 12
- **Assignee**: 프론트엔드 담당자
- **Priority**: High
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-07-31
- **Due Date**: 2025-07-31

### TASK-044: 실시간 공간 활용도 분석 기능 (7/31 추가)
- **Description**: 가구 배치에 따른 실시간 공간 활용도 분석 시스템
- **Acceptance Criteria**:
  - 공간 활용률 계산 알고리즘 구현
  - 실시간 통계 및 시각화
  - 최적 배치 제안 시스템
  - 사용자 인터페이스 통합
- **Story Points**: 8
- **Assignee**: AI 담당자
- **Priority**: Medium
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-07-31
- **Due Date**: 2025-07-31

### TASK-045: AI 모델 정확도 최적화 (7/31 추가)
- **Description**: YOLO v11, MiDaS 모델의 정확도 및 성능 최적화
- **Acceptance Criteria**:
  - 모델 추론 속도 향상 (50% 이상)
  - 가구 감지 정확도 개선
  - 깊이 추정 정밀도 향상
  - 메모리 사용량 최적화
- **Story Points**: 10
- **Assignee**: AI 담당자
- **Priority**: High
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-07-31
- **Due Date**: 2025-07-31

### TASK-019: E2E 테스트 구현
- **Description**: 전체 사용자 플로우에 대한 E2E 테스트 구현
- **Acceptance Criteria**:
  - 주요 사용자 시나리오 테스트 케이스 작성
  - Cypress 또는 Playwright 기반 자동화 테스트
  - CI/CD 파이프라인 테스트 연동
- **Story Points**: 6
- **Assignee**: QA 담당자
- **Priority**: Medium
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-08-01
- **Due Date**: 2025-08-01

### TASK-046: 전체 시스템 통합 테스트 (8/1 추가)
- **Description**: 완성된 시스템의 종합적인 통합 테스트 실시
- **Acceptance Criteria**:
  - 모든 기능의 정상 동작 확인
  - 사용자 플로우 검증 (이미지 업로드 → AI 분석 → 3D 시각화)
  - 성능 테스트 및 성능 기준 충족
  - 보안 취약점 점검 완료
- **Story Points**: 10
- **Assignee**: QA 담당자
- **Priority**: High
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-08-01
- **Due Date**: 2025-08-01

### TASK-047: 성능 최적화 (8/1 추가)
- **Description**: AI 처리 속도, 3D 렌더링 성능 최적화
- **Acceptance Criteria**:
  - AI 처리 속도 50% 이상 향상
  - 3D 렌더링 프레임율 60fps 유지
  - 메모리 사용량 최적화
  - 로딩 시간 단축
- **Story Points**: 8
- **Assignee**: 풀스택 담당자
- **Priority**: High
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-08-01
- **Due Date**: 2025-08-01

### TASK-048: 배포 준비 (8/1 추가)
- **Description**: Docker, Kubernetes 설정 및 배포 환경 준비
- **Acceptance Criteria**:
  - Docker 컨테이너 이미지 최적화
  - Kubernetes 배포 매니페스트 작성
  - 환경변수 및 시크릿 관리
  - 배포 자동화 스크립트 작성
- **Story Points**: 6
- **Assignee**: DevOps 담당자
- **Priority**: High
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-08-01
- **Due Date**: 2025-08-01

### TASK-049: 팀 통합 작업 마무리 (8/1 추가)
- **Description**: 4주차 스프린트의 팀 통합 작업 최종 점검 및 마무리
- **Acceptance Criteria**:
  - 모든 컴포넌트 통합 완료 확인
  - 팀원 간 코드 충돌 해결
  - 통합 문서화 완성
  - 다음 스프린트 준비 완료
- **Story Points**: 4
- **Assignee**: 팀 전체
- **Priority**: Medium
- **Sprint**: 4주차 (7/28-8/1)
- **Start Date**: 2025-08-01
- **Due Date**: 2025-08-01

## EPIC-5: Docker 기반 배포 환경 구축 및 CI/CD 구성

### TASK-020: Dockerfile 작성 및 컨테이너화
- **Description**: 프론트엔드/백엔드 각각의 Dockerfile 작성 및 컨테이너 이미지 생성
- **Acceptance Criteria**:
  - React 프론트엔드 Dockerfile 작성
  - FastAPI 백엔드 Dockerfile 작성
  - 멀티스테이지 빌드로 이미지 크기 최적화
- **Story Points**: 5
- **Assignee**: DevOps 담당자
- **Priority**: High
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-04
- **Due Date**: 2025-08-05

### TASK-050: 새 깃 레포지토리 생성 및 브랜치 구조 설정 (8/4 추가)
- **Description**: 통합 우선 전략에 따른 새로운 레포지토리 및 브랜치 구조 설정
- **Acceptance Criteria**:
  - 새 깃 레포지토리 생성
  - dev-eunbi 브랜치: backend-cloud, frontend 코드 관리
  - main 브랜치: frontend-main 통합 홈페이지 기본 구조
  - 브랜치 보호 규칙 및 권한 설정
- **Story Points**: 4
- **Assignee**: DevOps 담당자
- **Priority**: High
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-04
- **Due Date**: 2025-08-04

### TASK-051: dev-eunbi 브랜치 Dockerfile 작성 (8/4 추가)
- **Description**: backend-cloud, frontend 서비스의 Dockerfile 작성
- **Acceptance Criteria**:
  - backend-cloud Dockerfile 최적화
  - frontend Dockerfile 멀티스테이지 빌드
  - 컨테이너 이미지 크기 최소화
  - 보안 취약점 스캔 통과
- **Story Points**: 6
- **Assignee**: DevOps 담당자
- **Priority**: High
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-04
- **Due Date**: 2025-08-04

### TASK-052: 통합 홈페이지 기본 구조 생성 (8/4 추가)
- **Description**: main 브랜치에서 frontend-main 통합 홈페이지 구조 설정
- **Acceptance Criteria**:
  - 통합 홈페이지 라우팅 구조 설계
  - 각 팀 서비스 링크 및 네비게이션
  - 공통 헤더/푸터 컴포넌트
  - 반응형 레이아웃 기본 구조
- **Story Points**: 8
- **Assignee**: 프론트엔드 담당자
- **Priority**: High
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-04
- **Due Date**: 2025-08-04

### TASK-053: integration-files/teamApi.js 작성 (8/4 추가)
- **Description**: 팀 간 API 연동을 위한 통합 인터페이스 모듈 작성
- **Acceptance Criteria**:
  - 각 팀 API 엔드포인트 정의
  - 공통 API 호출 인터페이스
  - 에러 처리 및 로깅
  - API 문서화
- **Story Points**: 5
- **Assignee**: 백엔드 담당자
- **Priority**: High
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-04
- **Due Date**: 2025-08-04

### TASK-054: 포트 분리 전략 확정 (8/4 추가)
- **Description**: 은비 서비스(4000)와 통합 서비스(4010) 포트 분리
- **Acceptance Criteria**:
  - 은비 서비스: 포트 4000 설정
  - 통합 서비스: 포트 4010 설정
  - 포트 충돌 방지 및 관리
  - 환경별 포트 설정 분리
- **Story Points**: 3
- **Assignee**: DevOps 담당자
- **Priority**: Medium
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-04
- **Due Date**: 2025-08-04

### TASK-021: Docker Compose 환경 구성
- **Description**: 로컬 개발 및 테스트를 위한 Docker Compose 파일 작성
- **Acceptance Criteria**:
  - 프론트엔드, 백엔드, 데이터베이스 서비스 정의
  - 환경변수 및 볼륨 마운트 설정
  - 네트워크 구성 및 서비스 간 통신 확인
- **Story Points**: 4
- **Assignee**: DevOps 담당자
- **Priority**: High
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-04
- **Due Date**: 2025-08-05

### TASK-022: GitHub Actions CI/CD 파이프라인 구축
- **Description**: 자동화된 빌드, 테스트, 배포 파이프라인 구성
- **Acceptance Criteria**:
  - 코드 푸시 시 자동 빌드 및 테스트
  - Docker 이미지 자동 빌드 및 레지스트리 푸시
  - 환경별 자동 배포 워크플로우
- **Story Points**: 8
- **Assignee**: DevOps 담당자
- **Priority**: High
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-05
- **Due Date**: 2025-08-06

### TASK-055: 각 팀 서비스 인터페이스 파악 및 정리 (8/5 추가)
- **Description**: 팀원들과의 웹페이지 통합을 위한 각 팀 서비스 인터페이스 분석
- **Acceptance Criteria**:
  - 각 팀의 API 명세서 수집 및 분석
  - 데이터 포맷 및 통신 프로토콜 정리
  - 통합 지점 및 의존성 매핑
  - 호환성 이슈 사전 식별
- **Story Points**: 6
- **Assignee**: 시스템 분석가
- **Priority**: High
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-05
- **Due Date**: 2025-08-05

### TASK-056: 통합 환경 설정 및 기본 구조 설계 (8/5 추가)
- **Description**: 팀 통합을 위한 전체 환경 설정 및 아키텍처 설계
- **Acceptance Criteria**:
  - 마이크로서비스 아키텍처 설계
  - 서비스 간 통신 프로토콜 정의
  - 공통 데이터베이스 스키마 설계
  - 인증/권한 관리 시스템 통합
- **Story Points**: 10
- **Assignee**: 시스템 아키텍트
- **Priority**: High
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-05
- **Due Date**: 2025-08-05

### TASK-057: 코드 스타일 가이드 및 컨벤션 통일 (8/5 추가)
- **Description**: 팀 간 코드 일관성을 위한 스타일 가이드 및 컨벤션 수립
- **Acceptance Criteria**:
  - 프론트엔드 코드 스타일 가이드 통일
  - 백엔드 API 명명 규칙 표준화
  - Git 커밋 메시지 컨벤션 정의
  - 코드 리뷰 체크리스트 작성
- **Story Points**: 4
- **Assignee**: 팀 리드
- **Priority**: Medium
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-05
- **Due Date**: 2025-08-05

### TASK-023: Container Registry 설정
- **Description**: Docker Hub 또는 AWS ECR 등 컨테이너 레지스트리 설정
- **Acceptance Criteria**:
  - 레지스트리 계정 및 권한 설정
  - CI/CD에서 이미지 자동 푸시
  - 이미지 버전 관리 및 태깅 전략
- **Story Points**: 3
- **Assignee**: DevOps 담당자
- **Priority**: Medium
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-05
- **Due Date**: 2025-08-06

### TASK-024: 클라우드 환경 배포
- **Description**: AWS, GCP, Azure 중 하나의 클라우드 환경에 배포
- **Acceptance Criteria**:
  - 클라우드 인스턴스 생성 및 설정
  - 도메인 연결 및 SSL 인증서 적용
  - 로드밸런서 및 CDN 설정
- **Story Points**: 10
- **Assignee**: DevOps 담당자
- **Priority**: High
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-06
- **Due Date**: 2025-08-07

### TASK-025: 모니터링 및 로깅 시스템 구성
- **Description**: 애플리케이션 모니터링 및 로그 수집 시스템 구축
- **Acceptance Criteria**:
  - Prometheus + Grafana 모니터링 대시보드
  - ELK Stack 또는 클라우드 로깅 서비스 연동
  - 알림 및 경고 시스템 설정
- **Story Points**: 6
- **Assignee**: DevOps 담당자
- **Priority**: Medium
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-07
- **Due Date**: 2025-08-08

### TASK-058: API 엔드포인트 통합 및 라우팅 설정 (8/6 추가)
- **Description**: 팀 간 API 통합 및 라우팅 시스템 구현
- **Acceptance Criteria**:
  - API Gateway 구성 및 라우팅 규칙 설정
  - 각 팀 서비스 API 엔드포인트 통합
  - 로드밸런싱 및 헬스체크 구현
  - API 버전 관리 시스템 구축
- **Story Points**: 10
- **Assignee**: 백엔드 담당자
- **Priority**: High
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-06
- **Due Date**: 2025-08-06

### TASK-059: 통합된 웹페이지 기능 테스트 (8/6 추가)
- **Description**: 통합 환경에서의 웹페이지 기능 검증 및 테스트
- **Acceptance Criteria**:
  - 각 팀 서비스 간 통신 테스트
  - 통합 UI/UX 플로우 검증
  - 크로스 브라우저 호환성 테스트
  - 성능 및 부하 테스트
- **Story Points**: 8
- **Assignee**: QA 담당자
- **Priority**: High
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-06
- **Due Date**: 2025-08-06

### TASK-060: 통합 환경에서의 버그 수정 및 최적화 (8/6 추가)
- **Description**: 통합 과정에서 발견된 버그 수정 및 시스템 최적화
- **Acceptance Criteria**:
  - 통합 환경 버그 이슈 트래킹 및 수정
  - 메모리 사용량 및 성능 최적화
  - 종속성 관리 및 충돌 해결
  - 사용자 경험 개선
- **Story Points**: 12
- **Assignee**: 풀스택 담당자
- **Priority**: High
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-06
- **Due Date**: 2025-08-07

### TASK-061: 전체 통합 시스템 종합 테스트 (8/7 추가)
- **Description**: 완성된 통합 시스템의 종합적인 테스트 및 검증
- **Acceptance Criteria**:
  - 모든 팀 서비스 통합 상태 확인
  - 엔드투엔드 사용자 시나리오 테스트
  - 성능 벤치마크 및 기준 충족
  - 보안 점검 및 취약점 스캔
- **Story Points**: 10
- **Assignee**: QA 담당자
- **Priority**: High
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-07
- **Due Date**: 2025-08-07

### TASK-062: 사용자 시나리오별 기능 검증 (8/7 추가)
- **Description**: 실제 사용자 관점에서의 시나리오별 기능 검증
- **Acceptance Criteria**:
  - 주요 사용자 여정(User Journey) 매핑
  - 시나리오별 테스트 케이스 실행
  - 사용성(Usability) 테스트 수행
  - 피드백 수집 및 개선사항 도출
- **Story Points**: 8
- **Assignee**: UX 담당자
- **Priority**: Medium
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-07
- **Due Date**: 2025-08-07

### TASK-063: Docker Compose 파일 완성 및 로컬 테스트 (8/8 추가)
- **Description**: 통합 환경의 Docker Compose 파일 완성 및 로컬 테스트
- **Acceptance Criteria**:
  - 모든 서비스를 포함한 Docker Compose 파일 작성
  - 로컬 환경에서의 전체 시스템 구동 테스트
  - 환경변수 및 설정 파일 관리
  - 개발자 가이드 문서 작성
- **Story Points**: 6
- **Assignee**: DevOps 담당자
- **Priority**: High
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-08
- **Due Date**: 2025-08-08

### TASK-064: GitHub Actions CI/CD 파이프라인 구축 (8/8 추가)
- **Description**: Docker 이미지 자동 빌드 및 Docker Hub 푸시 설정
- **Acceptance Criteria**:
  - GitHub Actions 워크플로우 파일 작성
  - Docker 이미지 자동 빌드 파이프라인
  - Docker Hub 자동 푸시 설정
  - 브랜치별 배포 전략 구현
- **Story Points**: 8
- **Assignee**: DevOps 담당자
- **Priority**: High
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-08
- **Due Date**: 2025-08-08

### TASK-065: 5주차 회고 및 성과 정리 (8/8 추가)
- **Description**: 웹페이지 통합 + Docker CI/CD 완성 성과 및 6주차 계획
- **Acceptance Criteria**:
  - 5주차 스프린트 목표 달성도 평가
  - 팀 통합 과정에서의 교훈 정리
  - Docker CI/CD 구축 성과 문서화
  - 6주차 Kubernetes 전환 계획 수립
- **Story Points**: 4
- **Assignee**: 프로젝트 매니저
- **Priority**: Medium
- **Sprint**: 5주차 (8/4-8/8)
- **Start Date**: 2025-08-08
- **Due Date**: 2025-08-08

## EPIC-6: Kubernetes 도입 및 고급 배포 환경 구축

### TASK-026: Kubernetes 클러스터 환경 구축
- **Description**: K8s 클러스터 생성 및 기본 설정 (EKS/GKE/AKS)
- **Acceptance Criteria**:
  - 관리형 K8s 서비스 클러스터 생성
  - kubectl 접근 권한 설정
  - 기본 네임스페이스 및 RBAC 설정
- **Story Points**: 6
- **Assignee**: DevOps 담당자
- **Priority**: High
- **Sprint**: 6주차 (8/11-8/15)
- **Start Date**: 2025-08-11
- **Due Date**: 2025-08-12

### TASK-027: Kubernetes 매니페스트 작성
- **Description**: Deployment, Service, ConfigMap, Secret 등 K8s 리소스 정의
- **Acceptance Criteria**:
  - 애플리케이션 Deployment 매니페스트
  - Service 및 Ingress 리소스 정의
  - ConfigMap/Secret으로 환경 설정 분리
- **Story Points**: 8
- **Assignee**: DevOps 담당자
- **Priority**: High
- **Sprint**: 6주차 (8/11-8/15)
- **Start Date**: 2025-08-11
- **Due Date**: 2025-08-13

### TASK-028: Horizontal Pod Autoscaler 구성
- **Description**: CPU/메모리 기반 오토스케일링 설정
- **Acceptance Criteria**:
  - HPA 리소스 정의 및 적용
  - 부하 테스트를 통한 스케일링 검증
  - 리소스 제한 및 요청 최적화
- **Story Points**: 5
- **Assignee**: DevOps 담당자
- **Priority**: Medium
- **Sprint**: 6주차 (8/11-8/15)
- **Start Date**: 2025-08-12
- **Due Date**: 2025-08-13

### TASK-029: Ingress 및 네트워크 정책 설정
- **Description**: 외부 트래픽 라우팅 및 네트워크 보안 정책 구성
- **Acceptance Criteria**:
  - NGINX Ingress Controller 설정
  - SSL 인증서 자동 갱신 (cert-manager)
  - NetworkPolicy로 Pod 간 통신 제어
- **Story Points**: 6
- **Assignee**: DevOps 담당자
- **Priority**: Medium
- **Sprint**: 6주차 (8/11-8/15)
- **Start Date**: 2025-08-13
- **Due Date**: 2025-08-14

### TASK-030: 무중단 배포 전략 구현
- **Description**: Rolling Update, Blue-Green 배포 전략 구현
- **Acceptance Criteria**:
  - Rolling Update 전략 설정 및 테스트
  - Blue-Green 배포 스크립트 작성
  - 배포 실패 시 자동 롤백 설정
- **Story Points**: 7
- **Assignee**: DevOps 담당자
- **Priority**: Medium
- **Sprint**: 6주차 (8/11-8/15)
- **Start Date**: 2025-08-14
- **Due Date**: 2025-08-15

### TASK-031: 고급 모니터링 및 관측성
- **Description**: Prometheus, Grafana, Jaeger를 이용한 종합 모니터링
- **Acceptance Criteria**:
  - K8s 클러스터 메트릭 수집
  - 애플리케이션 성능 모니터링
  - 분산 추적 및 서비스 메시 구성
- **Story Points**: 8
- **Assignee**: DevOps 담당자
- **Priority**: Low
- **Sprint**: 6주차 (8/11-8/15)
- **Start Date**: 2025-08-15
- **Due Date**: 2025-08-15

## EPIC-7: 최종 발표 준비 및 프로젝트 완성

### TASK-032: 발표 자료 및 시연 준비
- **Description**: 8월 22일 최종 발표를 위한 PPT 및 시연 준비
- **Acceptance Criteria**:
  - 프로젝트 개요 및 기술 스택 소개 슬라이드
  - 핵심 기능 시연 시나리오 작성
  - 라이브 데모 환경 준비 및 백업 계획
- **Story Points**: 10
- **Assignee**: 팀 전체
- **Priority**: High
- **Sprint**: 7주차 (8/18-8/22)
- **Start Date**: 2025-08-18
- **Due Date**: 2025-08-20

### TASK-033: 프로젝트 성과 지표 정리
- **Description**: 개발 과정에서의 성과 지표 및 통계 데이터 정리
- **Acceptance Criteria**:
  - 정확도 개선 수치 및 성능 벤치마크
  - 개발 일정 및 마일스톤 달성률
  - 기술적 도전과제 및 해결 과정
- **Story Points**: 5
- **Assignee**: 프로젝트 매니저
- **Priority**: High
- **Sprint**: 7주차 (8/18-8/22)
- **Start Date**: 2025-08-18
- **Due Date**: 2025-08-19

### TASK-034: 기술 문서 및 사용자 가이드 작성
- **Description**: 프로젝트 기술 문서 및 사용자 매뉴얼 작성
- **Acceptance Criteria**:
  - README.md 파일 업데이트
  - API 문서 (Swagger/OpenAPI)
  - 사용자 가이드 및 설치 매뉴얼
- **Story Points**: 6
- **Assignee**: 기술 작가
- **Priority**: Medium
- **Sprint**: 7주차 (8/18-8/22)
- **Start Date**: 2025-08-19
- **Due Date**: 2025-08-20

### TASK-035: 최종 시스템 통합 테스트
- **Description**: 전체 시스템의 통합 테스트 및 성능 검증
- **Acceptance Criteria**:
  - 모든 기능의 정상 동작 확인
  - 부하 테스트 및 성능 기준 충족
  - 보안 취약점 점검 완료
- **Story Points**: 8
- **Assignee**: QA 담당자
- **Priority**: High
- **Sprint**: 7주차 (8/18-8/22)
- **Start Date**: 2025-08-20
- **Due Date**: 2025-08-21

### TASK-036: 향후 발전 계획 수립
- **Description**: 프로젝트 완료 후 향후 발전 방향 및 로드맵 작성
- **Acceptance Criteria**:
  - 기능 확장 계획 수립
  - 기술 부채 및 개선 사항 정리
  - 상용화 및 사업화 검토
- **Story Points**: 3
- **Assignee**: 프로덕트 오너
- **Priority**: Low
- **Sprint**: 7주차 (8/18-8/22)
- **Start Date**: 2025-08-21
- **Due Date**: 2025-08-22

---

## 📊 Summary

**총 Task 수**: 65개 (기존 36개 + 7월 29일부터 추가 29개)
**총 Story Points**: 456점 (기존 218점 + 추가 238점)
**예상 소요 기간**: 7주 (7 Sprints)

### Epic별 Story Points 분포 및 일정:
- **EPIC-1 (1주차, 7/8-7/12)**: 13점 (2.9%) - AI 기반 분석 파이프라인 구성
- **EPIC-2 (2주차, 7/14-7/18)**: 32점 (7.0%) - MiDaS 기반 실측 거리 추정 기능 구현
- **EPIC-3 (3주차, 7/21-7/25)**: 23점 (5.0%) - 정확도 향상 및 안정화 작업
- **EPIC-4 (4주차, 7/28-8/1)**: 158점 (34.6%) - 팀 통합 작업 및 웹애플리케이션 완성 *(7/29-8/1 대폭 확장)*
- **EPIC-5 (5주차, 8/4-8/8)**: 159점 (34.9%) - 팀 통합 우선 전략 + Docker CI/CD 구성 *(전면 재구성)*
- **EPIC-6 (6주차, 8/11-8/15)**: 40점 (8.8%) - Kubernetes 도입 및 고급 배포 환경 구축
- **EPIC-7 (7주차, 8/18-8/22)**: 31점 (6.8%) - 최종 발표 준비 및 프로젝트 완성

### 우선순위별 분포:
- **High Priority**: 42개 Task (기존 20개 + 추가 22개)
- **Medium Priority**: 20개 Task (기존 13개 + 추가 7개)  
- **Low Priority**: 3개 Task (변경 없음)

### 7월 29일부터 추가된 주요 태스크 (29개):
**4주차 (7/29-8/1) 추가 태스크**: 12개
- 개발 컴포넌트 코드 리뷰, 네비게이션 구조 완성, 백엔드 분리, CSS 통합
- 하이브리드 아키텍처, Three.js 3D 시각화, 가구 드래그앤드롭, AI 최적화 등

**5주차 (8/4-8/8) 전면 재구성**: 17개 
- 통합 우선 전략 기반으로 기존 Docker 태스크 확장
- 깃 레포지토리 분리, 팀 통합 작업, API 통합, 시스템 테스트 등