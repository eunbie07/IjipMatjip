import psycopg2
from psycopg2.extras import RealDictCursor
from pymongo import MongoClient
import json
import os
from datetime import datetime
from config.settings import (
    POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, 
    POSTGRES_DB, POSTGRES_PORT, MONGO_HOST, MONGO_DB
)
import logging

logger = logging.getLogger(__name__)


class DatabaseService:
    """PostgreSQL 데이터베이스 서비스"""
    
    def __init__(self):
        self.connection = None
        self.connect()
    
    def connect(self):
        try:
            self.connection = psycopg2.connect(
                host=POSTGRES_HOST,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                database=POSTGRES_DB,
                port=POSTGRES_PORT,
                cursor_factory=RealDictCursor
            )
            self.connection.autocommit = True
            print("PostgreSQL 데이터베이스 연결 성공")
        except Exception as e:
            print(f"데이터베이스 연결 실패: {e}")
            self.connection = None
    
    def get_connection(self):
        if not self.connection or self.connection.closed:
            self.connect()
        return self.connection


class MongoDBService:
    """MongoDB 서비스"""
    
    def __init__(self):
        self.mongo_url = f"mongodb://{MONGO_HOST}:27017"
        self.db_name = MONGO_DB
        self.client = None
        self.db = None
        self.room_layouts_collection = None
        self.connect()
    
    def connect(self):
        try:
            self.client = MongoClient(self.mongo_url)
            self.db = self.client[self.db_name]
            self.room_layouts_collection = self.db.room_layouts
            print("MongoDB 연결 성공")
            return True
        except Exception as e:
            print(f"MongoDB 연결 실패: {e}")
            self.client = None
            self.db = None
            self.room_layouts_collection = None
            return False
    
    def is_connected(self):
        return self.room_layouts_collection is not None
    
    def save_room_layout(self, layout_data: dict):
        if not self.is_connected():
            return False, None
        
        try:
            layout_data["saved_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            layout_data["format_version"] = "2.0.0"
            
            result = self.room_layouts_collection.insert_one(layout_data)
            logger.info(f"MongoDB에 저장 완료: {result.inserted_id}")
            return True, str(result.inserted_id)
        except Exception as e:
            logger.error(f"MongoDB 저장 오류: {e}")
            return False, None


class SimpleStorageService:
    """JSON 파일 기반 스토리지 서비스 (백업용)"""
    
    def __init__(self):
        self.storage_file = "room_layouts.json"
        self.data = self.load_data()
    
    def load_data(self):
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return []
        except Exception:
            return []
    
    def save_data(self):
        try:
            with open(self.storage_file, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, ensure_ascii=False, indent=2, default=str)
            return True
        except Exception:
            return False
    
    def save_room_layout(self, layout_data: dict):
        layout_data['created_at'] = datetime.now().isoformat()
        layout_data['updated_at'] = datetime.now().isoformat()
        self.data.append(layout_data)
        return self.save_data()
    
    def get_all_layouts(self):
        return self.data
    
    def get_layout_by_id(self, layout_id: str):
        for layout in self.data:
            if layout.get('scene', {}).get('room', {}).get('id') == layout_id:
                return layout
        return None