"""
AgriCast AI - ML/AI service (FastAPI)

Smart India Hackathon 2026 Prototype - SIH26074

This service demonstrates the weather-downscaling and crop-risk prediction
architecture described in the AgriCast AI brief. It ships with a transparent,
clearly-labelled demonstration model (a small RandomForestRegressor trained on
synthetic seed data) rather than any claim of a production-accuracy model.

Run:
    uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schemas.weather import WeatherPredictionRequest, WeatherPredictionResponse
from app.schemas.risk import RiskPredictionRequest, RiskPredictionResponse
from app.services.downscaling_model import predict_weather
from app.services.risk_model import predict_risk

app = FastAPI(
    title="AgriCast AI - ML Service",
    description="Weather downscaling and crop-risk demonstration models for the AgriCast AI SIH 2026 prototype.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to the deployed frontend/backend origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"success": True, "message": "AgriCast AI ML service is running.", "mode": "DEMONSTRATION MODEL"}


@app.post("/predict/weather", response_model=WeatherPredictionResponse)
def predict_weather_endpoint(payload: WeatherPredictionRequest):
    return predict_weather(payload)


@app.post("/predict/risk", response_model=RiskPredictionResponse)
def predict_risk_endpoint(payload: RiskPredictionRequest):
    return predict_risk(payload)
