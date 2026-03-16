"""Pydantic models for alerts, configuration, and API responses."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class AlertType(str, Enum):
    WEAPON_DETECTED = "WEAPON_DETECTED"
    UNUSUAL_GATHERING = "UNUSUAL_GATHERING"
    LOITERING_DETECTED = "LOITERING_DETECTED"


class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int


class AlertDetail(BaseModel):
    object: Optional[str] = None
    bbox: Optional[BoundingBox] = None
    person_count: Optional[int] = None
    duration_seconds: Optional[float] = None


class Alert(BaseModel):
    type: AlertType
    confidence: float
    timestamp: str
    camera_id: str
    details: Optional[AlertDetail] = None


class RestrictedZone(BaseModel):
    name: str
    x1: int
    y1: int
    x2: int
    y2: int


class DetectionConfig(BaseModel):
    confidence_threshold: float = 0.5
    crowd_threshold: int = 5
    loiter_seconds: float = 30.0
    restricted_zones: list[RestrictedZone] = []


class VideoUploadResponse(BaseModel):
    status: str
    filename: str
    message: str
