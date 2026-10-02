from pydantic import BaseModel, Field
from typing import Optional


class WeatherPredictionRequest(BaseModel):
    regional_temperature_c: float = Field(..., description="Coarse/regional temperature input")
    regional_rainfall_mm: float = Field(..., description="Coarse/regional rainfall input")
    regional_humidity_pct: float
    wind_kmh: float
    elevation_m: Optional[float] = 50.0
    latitude: float
    longitude: float
    season: Optional[str] = "monsoon"


class FeatureImportance(BaseModel):
    feature: str
    importance: float


class WeatherPredictionResponse(BaseModel):
    panchayat_temperature_c: float
    panchayat_rainfall_mm: float
    rain_probability_pct: float
    model_label: str = "DEMONSTRATION MODEL"
    feature_importance: list[FeatureImportance]
