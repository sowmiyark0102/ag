"""
Demonstration weather-downscaling model.

Trains a small RandomForestRegressor on synthetic seed data at import time so
the service works immediately with no external training pipeline or dataset
required. This is intentionally labelled as a DEMONSTRATION MODEL throughout -
replace `_build_synthetic_training_data` and retrain on real historical
observations (IMD / NASA POWER / Open-Meteo) before using in production.
"""

import numpy as np
from sklearn.ensemble import RandomForestRegressor

from app.schemas.weather import WeatherPredictionResponse, FeatureImportance

FEATURE_NAMES = [
    "regional_temperature_c",
    "regional_rainfall_mm",
    "regional_humidity_pct",
    "wind_kmh",
    "elevation_m",
    "latitude",
]


def _build_synthetic_training_data(n=400, seed=42):
    rng = np.random.default_rng(seed)
    regional_temp = rng.uniform(22, 38, n)
    regional_rain = rng.uniform(0, 80, n)
    humidity = rng.uniform(40, 95, n)
    wind = rng.uniform(2, 40, n)
    elevation = rng.uniform(0, 400, n)
    latitude = rng.uniform(8, 20, n)

    X = np.column_stack([regional_temp, regional_rain, humidity, wind, elevation, latitude])

    # Synthetic relationship: local temperature cools slightly with elevation,
    # local rainfall is regional rainfall adjusted by humidity/wind, plus noise.
    local_temp = regional_temp - elevation * 0.004 + rng.normal(0, 0.6, n)
    local_rain = regional_rain * (0.7 + humidity / 300) - wind * 0.05 + rng.normal(0, 3, n)
    local_rain = np.clip(local_rain, 0, None)

    y_temp = local_temp
    y_rain = local_rain
    return X, y_temp, y_rain


_X_train, _y_temp_train, _y_rain_train = _build_synthetic_training_data()

_temp_model = RandomForestRegressor(n_estimators=80, max_depth=6, random_state=42)
_temp_model.fit(_X_train, _y_temp_train)

_rain_model = RandomForestRegressor(n_estimators=80, max_depth=6, random_state=42)
_rain_model.fit(_X_train, _y_rain_train)


def predict_weather(payload) -> WeatherPredictionResponse:
    features = np.array(
        [
            [
                payload.regional_temperature_c,
                payload.regional_rainfall_mm,
                payload.regional_humidity_pct,
                payload.wind_kmh,
                payload.elevation_m or 50.0,
                payload.latitude,
            ]
        ]
    )

    panchayat_temp = float(_temp_model.predict(features)[0])
    panchayat_rain = float(_rain_model.predict(features)[0])

    # Simple, transparent rain-probability heuristic derived from predicted rainfall.
    rain_probability = float(min(95, max(5, panchayat_rain * 2.2)))

    importances = _rain_model.feature_importances_
    feature_importance = sorted(
        [FeatureImportance(feature=f, importance=round(float(i), 3)) for f, i in zip(FEATURE_NAMES, importances)],
        key=lambda fi: fi.importance,
        reverse=True,
    )

    return WeatherPredictionResponse(
        panchayat_temperature_c=round(panchayat_temp, 1),
        panchayat_rainfall_mm=round(panchayat_rain, 1),
        rain_probability_pct=round(rain_probability, 1),
        feature_importance=feature_importance,
    )
