import os
import joblib
import pandas as pd
import numpy as np
from django.conf import settings

class ModelLoader:
    _instance = None
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            model_path = os.path.join(settings.BASE_DIR, 'models', 'xgboost_model.joblib')
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model file not found at {model_path}")
            cls._model = joblib.load(model_path)
        return cls._model

    @classmethod
    def engineer_features(cls, df: pd.DataFrame) -> pd.DataFrame:
        df_feat = df.copy()

        df_feat['temp_range'] = df_feat['maxtemp'] - df_feat['mintemp']
        df_feat['dewpoint_depression'] = df_feat['temparature'] - df_feat['dewpoint']
        df_feat['sunshine_cloud_ratio'] = df_feat['sunshine'] / (df_feat['cloud'] + 1.0)
        df_feat['humidity_cloud_interaction'] = (df_feat['humidity'] / 100.0) * (df_feat['cloud'] / 100.0)
        df_feat['temp_dewpoint_ratio'] = df_feat['dewpoint'] / (df_feat['temparature'] + 1.0)
        df_feat['wind_power'] = df_feat['windspeed'] * df_feat['pressure']
        df_feat['sunshine_humidity_diff'] = df_feat['sunshine'] - (df_feat['humidity'] / 10.0)

        # Cyclical encoding for day (seasonality)
        df_feat['day_sin'] = np.sin(2 * np.pi * df_feat['day'] / 365.0)
        df_feat['day_cos'] = np.cos(2 * np.pi * df_feat['day'] / 365.0)

        # Reorder columns to match model's expected features
        expected_features = [
            'day', 'pressure', 'maxtemp', 'temparature', 'mintemp', 'dewpoint', 'humidity',
            'cloud', 'sunshine', 'winddirection', 'windspeed', 'temp_range',
            'dewpoint_depression', 'sunshine_cloud_ratio', 'humidity_cloud_interaction',
            'temp_dewpoint_ratio', 'wind_power', 'sunshine_humidity_diff', 'day_sin', 'day_cos'
        ]
        return df_feat[expected_features]

    @classmethod
    def predict(cls, input_dict: dict) -> dict:
        """
        Takes a dictionary of raw input features, executes feature engineering,
        runs the XGBoost model prediction, and returns probabilities.
        """
        model = cls.get_model()
        df_raw = pd.DataFrame([input_dict])
        df_processed = cls.engineer_features(df_raw)

        prediction = model.predict(df_processed)[0]
        
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(df_processed)[0]
            rain_prob = float(probabilities[1])
            no_rain_prob = float(probabilities[0])
        else:
            rain_prob = 1.0 if prediction == 1 else 0.0
            no_rain_prob = 1.0 - rain_prob

        return {
            'prediction': int(prediction),
            'will_rain': bool(prediction == 1),
            'rain_probability': round(rain_prob * 100, 2),
            'no_rain_probability': round(no_rain_prob * 100, 2)
        }
