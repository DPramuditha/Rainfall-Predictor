import os
import sys
from pathlib import Path

# Setup Django environment so FastAPI can import ModelLoader and Django settings
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rainfall_project.settings')
import django
django.setup()

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from predictor.ml_model import ModelLoader
from predictor.models import RainfallPrediction

# Initialize FastAPI App
app = FastAPI(
    title="Rainfall Predictor ML Microservice",
    description="High-performance async REST API microservice for real-time Rainfall Prediction using XGBoost and Keras Deep Neural Networks.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for cross-origin requests (e.g. Django frontend or mobile callers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RainfallPredictionRequest(BaseModel):
    day: float = Field(180.0, description="Day of the year (1-365)", ge=1, le=365)
    pressure: float = Field(1013.2, description="Atmospheric pressure (hPa)", ge=800, le=1100)
    maxtemp: float = Field(30.0, description="Maximum daily temperature (°C)")
    temparature: float = Field(25.5, description="Average temperature (°C)")
    mintemp: float = Field(21.0, description="Minimum daily temperature (°C)")
    dewpoint: float = Field(22.0, description="Dew point temperature (°C)")
    humidity: float = Field(80.0, description="Relative humidity (%)", ge=0, le=100)
    cloud: float = Field(65.0, description="Cloud cover percentage (%)", ge=0, le=100)
    sunshine: float = Field(5.0, description="Sunshine duration (hours)", ge=0, le=24)
    winddirection: float = Field(180.0, description="Wind direction (degrees)", ge=0, le=360)
    windspeed: float = Field(12.5, description="Wind speed (km/h)", ge=0)
    model_choice: Optional[str] = Field(
        default="xgboost",
        description="Target ML Model: 'xgboost' or 'neural_network'"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "day": 180,
                "pressure": 1013.2,
                "maxtemp": 30.0,
                "temparature": 25.5,
                "mintemp": 21.0,
                "dewpoint": 22.0,
                "humidity": 80.0,
                "cloud": 65.0,
                "sunshine": 5.0,
                "winddirection": 180.0,
                "windspeed": 12.5,
                "model_choice": "xgboost"
            }
        }
    }

class RainfallPredictionResponse(BaseModel):
    prediction: int = Field(..., description="Binary classification (1 = Rain, 0 = No Rain)")
    will_rain: bool = Field(..., description="True if rainfall is predicted")
    rain_probability: float = Field(..., description="Rainfall likelihood percentage (0-100%)")
    no_rain_probability: float = Field(..., description="No-rain likelihood percentage (0-100%)")
    model_used: str = Field(..., description="Canonical model key ('xgboost' or 'neural_network')")
    model_display_name: str = Field(..., description="Human-readable model name")

@app.get("/", tags=["Health & Info"])
async def root():
    """
    Health check and microservice metadata endpoint.
    """
    return {
        "service": "Rainfall Predictor ML Microservice",
        "status": "online",
        "version": "1.0.0",
        "framework": "FastAPI",
        "docs_url": "/docs",
        "supported_models": ["xgboost", "neural_network"]
    }

@app.get("/api/predictions/", tags=["Predictions"])
@app.get("//api/predictions/", tags=["Predictions"])
@app.get("/api/v1/predictions", tags=["Predictions"])
def get_predictions_history():
    """
    Returns all stored prediction records from PostgreSQL database.
    Running as sync def allows Django ORM to execute safely in FastAPI threadpool.
    """
    try:
        records = list(RainfallPrediction.objects.all().order_by('created_at')[:100])
        data = []
        for item in records:
            data.append({
                'id': item.id,
                'day': item.day,
                'pressure': item.pressure,
                'temparature': item.temparature,
                'maxtemp': item.maxtemp,
                'mintemp': item.mintemp,
                'dewpoint': item.dewpoint,
                'humidity': item.humidity,
                'cloud': item.cloud,
                'sunshine': item.sunshine,
                'winddirection': item.winddirection,
                'windspeed': item.windspeed,
                'prediction': item.prediction,
                'will_rain': item.will_rain,
                'rain_probability': item.rain_probability,
                'no_rain_probability': item.no_rain_probability,
                'model_used': item.model_used,
                'model_display_name': item.model_display_name,
                'created_at': item.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'label': f"#{item.id} ({item.created_at.strftime('%H:%M')})"
            })
        return {"success": True, "count": len(data), "predictions": data}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database Error: {str(e)}"
        )

@app.post("/api/v1/predict", response_model=RainfallPredictionResponse, tags=["Predictions"])
async def predict_rainfall(payload: RainfallPredictionRequest):
    """
    Real-time ML Rainfall Prediction Endpoint.
    Accepts meteorological inputs and calculates probability using XGBoost or Keras Deep Learning models.
    """
    try:
        input_dict = payload.model_dump()
        target_model = input_dict.pop("model_choice", "xgboost") or "xgboost"

        result = ModelLoader.predict(input_dict, model_name=target_model)

        return RainfallPredictionResponse(
            prediction=int(result["prediction"]),
            will_rain=bool(result["will_rain"]),
            rain_probability=float(result["rain_probability"]),
            no_rain_probability=float(result["no_rain_probability"]),
            model_used=str(result["model_used"]),
            model_display_name=str(result["model_display_name"])
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction Error: {str(e)}"
        )
