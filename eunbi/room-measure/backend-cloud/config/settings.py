import os
from pathlib import Path
from dotenv import load_dotenv

# 환경변수 로드
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# JWT 설정
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-here")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# PostgreSQL 설정
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")
POSTGRES_DB = os.getenv("POSTGRES_DB", "user_auth")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

# MongoDB 설정
MONGO_HOST = os.getenv("MONGO_HOST", "13.55.21.100")
MONGO_DB = "room_measure"

# 로깅 설정
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = "room_measure_cloud.log"

# 디버그 출력
if __name__ == "__main__":
    print(f"POSTGRES_HOST: {POSTGRES_HOST}")
    print(f"POSTGRES_USER: {POSTGRES_USER}")
    print(f"POSTGRES_DB: {POSTGRES_DB}")
    print(f"MONGO_HOST: {MONGO_HOST}")