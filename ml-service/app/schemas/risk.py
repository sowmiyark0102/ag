from pydantic import BaseModel
from typing import Optional


class RiskPredictionRequest(BaseModel):
    crop: str
    crop_stage: str
    temperature_c: float
    humidity_pct: float
    rainfall_mm: float
    wind_kmh: float


class RiskPredictionResponse(BaseModel):
    risk_level: str
    risk_type: str
    reason: str
    model_label: str = "DEMONSTRATION MODEL"
