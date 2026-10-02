"""
Demonstration crop-risk classifier.

Rule-based, transparent, and clearly labelled - this mirrors the logic in the
Node.js cropRiskEngine so the ML service can be swapped in without changing
the contract. Replace with a trained classifier (e.g. on labelled agronomic
outcome data) before treating this as more than a demonstration.
"""

from app.schemas.risk import RiskPredictionResponse


def predict_risk(payload) -> RiskPredictionResponse:
    if payload.rainfall_mm >= 50:
        return RiskPredictionResponse(
            risk_level="HIGH",
            risk_type="HEAVY_RAIN",
            reason="Rainfall is significantly above normal for this crop stage.",
        )
    if payload.humidity_pct >= 85 and 22 <= payload.temperature_c <= 32:
        return RiskPredictionResponse(
            risk_level="MODERATE",
            risk_type="DISEASE_FAVOURABLE_WEATHER",
            reason="High humidity and moderate temperature may favour fungal disease development.",
        )
    if payload.wind_kmh >= 35:
        return RiskPredictionResponse(
            risk_level="MODERATE",
            risk_type="STRONG_WIND",
            reason="Wind speed is high enough to pose a lodging risk.",
        )
    if payload.temperature_c >= 36:
        return RiskPredictionResponse(
            risk_level="MODERATE",
            risk_type="HEAT_STRESS",
            reason="Daytime temperature is high enough to stress the crop at this stage.",
        )

    return RiskPredictionResponse(
        risk_level="LOW",
        risk_type="NONE",
        reason="Current conditions do not indicate an elevated crop risk.",
    )
