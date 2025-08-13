#!/bin/bash

# EC2 배포 스크립트
echo "🚀 Room Measure Cloud 배포 시작..."

# 1. 이미지 빌드
echo "📦 Docker 이미지 빌드 중..."
docker build -t room-measure-cloud .

# 2. 기존 컨테이너 정지 및 제거
echo "🛑 기존 컨테이너 정리 중..."
docker stop room-measure-cloud 2>/dev/null || true
docker rm room-measure-cloud 2>/dev/null || true

# 3. .env 파일 확인
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없습니다. .env.example을 복사하여 설정해주세요."
    cp .env.example .env
    echo "📝 .env 파일을 편집한 후 다시 실행해주세요."
    exit 1
fi

# 4. 새 컨테이너 실행
echo "🎉 새 컨테이너 실행 중..."
docker run -d \
    --name room-measure-cloud \
    -p 3000:3000 \
    --env-file .env \
    --restart unless-stopped \
    room-measure-cloud

# 5. 헬스체크
echo "🔍 서비스 상태 확인 중..."
sleep 5
curl -f http://localhost:3000/health || echo "❌ 헬스체크 실패"

echo "✅ 배포 완료! http://localhost:3000에서 서비스 확인 가능"