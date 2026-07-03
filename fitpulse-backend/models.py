from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class Profile(BaseModel):
    id: str
    role: str
    full_name: str
    trainer_id: Optional[str] = None
    weight: Optional[float] = None
    target_weight: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    plan: Optional[str] = None
    fees_paid: Optional[float] = 0

class WeightLog(BaseModel):
    date: date
    weight: float
    sleep: Optional[float] = 0
    water: Optional[float] = 0
    calories: Optional[int] = 0
    note: Optional[str] = ""

class ProgressPhoto(BaseModel):
    date: date
    url: str
    note: Optional[str] = ""

class MessageCreate(BaseModel):
    receiver_id: str
    text: str
