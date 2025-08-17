from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class Point3D(BaseModel):
    x: float
    y: float
    z: float


class FurniturePosition3D(BaseModel):
    id: str
    type: str
    position: Point3D
    rotation: List[float]
    size: List[float]


class FurniturePosition2D(BaseModel):
    id: str
    type: str
    x: float
    y: float
    rotation: float
    size: List[float]


class FurnitureCoordinateConversionRequest(BaseModel):
    furniture_2d: List[FurniturePosition2D]
    room_size: dict


class FurnitureCoordinateConversionResponse(BaseModel):
    furniture_3d: List[FurniturePosition3D]


class UserSignup(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class RoomLayoutData(BaseModel):
    scene: dict
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None