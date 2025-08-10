#!/usr/bin/env python3
"""
합성 엔드포인트 테스트 스크립트
"""
import requests
import json

# 테스트용 JSON 데이터
test_scene = {
    "description": "Simple bedroom layout",
    "room": {
        "width": 4.0,
        "depth": 3.0,
        "height": 2.5
    },
    "objects": [
        {
            "name": "bed",
            "type": "bed",
            "position": [1.0, 0.0, 1.5],
            "rotation_y": 0.0,
            "size": [2.0, 0.5, 1.0]
        },
        {
            "name": "desk",
            "type": "desk",
            "position": [3.0, 0.0, 0.5],
            "rotation_y": 0.0,
            "size": [1.0, 0.8, 0.6]
        }
    ]
}

def test_composite_endpoint():
    """합성 엔드포인트 테스트"""
    url = "http://localhost:8000/api/realistic-room-composite"
    
    # 더미 이미지 파일 생성 (1x1 픽셀 PNG)
    dummy_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x01\x00\x00\x00\x007n\xf9$\x00\x00\x00\nIDAT\x08\x1dc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
    
    # multipart/form-data로 요청
    files = {
        'capture': ('test.png', dummy_png, 'image/png')
    }
    
    data = {
        'scene_json': json.dumps(test_scene),
        'style': 'scandinavian',
        'control': 'canny',
        'alpha': 0.6,
        'provider': 'vertex',
        'mode': 'strict'
    }
    
    try:
        print("🧪 합성 엔드포인트 테스트 시작...")
        response = requests.post(url, files=files, data=data, timeout=10)
        
        if response.status_code == 200:
            print("✅ 엔드포인트 구현 성공!")
            print(f"📊 응답 크기: {len(response.content)} bytes")
            result = response.json()
            print(f"🖼️  이미지 개수: {len(result.get('images', []))}")
        else:
            print(f"❌ HTTP {response.status_code}: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("🔌 서버가 실행되지 않음 (포트 8000)")
    except Exception as e:
        print(f"❌ 테스트 실패: {e}")

if __name__ == "__main__":
    test_composite_endpoint()