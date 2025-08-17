"""
AI 영상 생성 스크립트 (v3 - GOOGLE_API_KEY 사용)

이 스크립트는 Gemini API(Veo 모델)를 사용하여 프롬프트로부터 영상을 생성합니다.

[사전 준비]
1. 필요한 라이브러리를 설치합니다:
   pip install google-genai python-dotenv

2. 프로젝트 루트에 .env 파일을 만들고 API 키를 추가합니다:
   GOOGLE_API_KEY="YOUR_API_KEY"

[사용 방법]
- 기본 프롬프트로 영상 생성 (프로젝트 루트에서 실행):
  python scripts/generate_video_final.py
"""
import time
import os
import argparse
import sys
from google import genai
from google.genai import types
from dotenv import load_dotenv

# --- .env 파일 로드 ---
try:
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dotenv_path = os.path.join(project_root, '.env')
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path)
        print("✅ .env 파일에서 API 키를 성공적으로 로드했습니다.")
    else:
        print("⚠️  경고: .env 파일을 찾을 수 없습니다. 시스템 환경 변수를 사용합니다.")
except Exception as e:
    print(f".env 파일 로드 중 오류 발생: {e}")

# --- 기본 설정 ---
MODEL = "veo-2.0-generate-001" # 정확한 전체 모델 이름으로 수정
DEFAULT_BASE_FILENAME = "generated_video"
DEFAULT_PROMPT = """
Create an 8-second, cinematic, top-down video showing furniture rearranging itself inside a single room. The camera is fixed and does not move.

The video's only purpose is to show the animation of a furniture set moving from "Layout A" to "Layout B".

The video starts with a bed and a desk in a complete, static "Layout A". After a few seconds, the SAME bed and desk smoothly glide to new positions, forming a second, completely different, and logical "Layout B".

The video ends when the furniture has settled into "Layout B".

It is critical that the entire video takes place within the same four walls. Do not show multiple rooms or a split-screen. The goal is to show a single space transforming.
"""
# --- 설정 끝 ---

def generate_video(prompt, base_filename):
    """주어진 프롬프트와 파일 이름으로 영상을 생성합니다."""
    
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("❌ 오류: GOOGLE_API_KEY가 설정되지 않았습니다.")
        print('.env 파일에 GOOGLE_API_KEY="YOUR_API_KEY" 형식으로 키를 추가하거나, 시스템 환경 변수를 설정해 주세요.')
        return

    try:
        print("🔄 Gemini 클라이언트를 초기화하는 중...")
        client = genai.Client(api_key=api_key)
        print("✅ 클라이언트 초기화 성공.")
    except Exception as e:
        print(f"❌ 클라이언트 초기화 중 심각한 오류 발생: {e}")
        sys.exit(1)

    video_config = types.GenerateVideosConfig(
        aspect_ratio="16:9",
        number_of_videos=1,
        duration_seconds=8,
        person_generation="ALLOW_ALL",
    )

    print("\n🔄 영상 생성을 요청했습니다. 작업이 완료될 때까지 잠시 기다려 주세요...")
    print(f"   사용된 프롬프트: \"{prompt[:80].strip()}...\"")
    
    operation = client.models.generate_videos(
        model=MODEL,
        prompt=prompt,
        config=video_config,
    )

    while not operation.done:
        print("   영상이 아직 생성되지 않았습니다. 10초 후에 다시 확인합니다...")
        time.sleep(10)
        try:
            operation = client.operations.get(operation)
        except Exception as e:
            print(f"   상태 확인 중 오류 발생: {e}")
            time.sleep(20)

    result = operation.result
    if not result or not result.generated_videos:
        print("❌ 오류가 발생했거나 생성된 영상이 없습니다.")
        return

    print(f"\n✅ {len(result.generated_videos)}개의 영상이 생성되었습니다.")

    for generated_video in result.generated_videos:
        output_filename = f"{base_filename}.mp4"
        counter = 1
        while os.path.exists(output_filename):
            output_filename = f"{base_filename}_{counter}.mp4"
            counter += 1
        
        print(f"   영상을 다운로드 중입니다: {generated_video.video.uri}")
        client.files.download(file=generated_video.video)
        generated_video.video.save(output_filename)
        print(f"✅ '{output_filename}' 파일로 성공적으로 저장했습니다.")

def main():
    parser = argparse.ArgumentParser(
        description="Gemini API를 사용하여 영상을 생성합니다.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument(
        "-p", "--prompt",
        type=str,
        default=DEFAULT_PROMPT,
        help="영상 생성을 위한 프롬프트.\n지정하지 않으면 기본 프롬프트가 사용됩니다."
    )
    parser.add_argument(
        "-o", "--output",
        type=str,
        default=DEFAULT_BASE_FILENAME,
        help="저장될 영상의 기본 파일 이름.\n지정하지 않으면 'generated_video'가 사용됩니다."
    )
    args = parser.parse_args()

    generate_video(args.prompt, args.output)

if __name__ == "__main__":
    main()
