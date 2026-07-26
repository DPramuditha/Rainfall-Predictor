import os
import joblib
import pandas as pd
import numpy as np
from django.conf import settings

import logging
logger = logging.getLogger(__name__)

# Suppress TF C++ log messages & set Keras backend
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['KERAS_BACKEND'] = 'tensorflow'

_keras_patched = False

def _get_keras_module():
    try:
        import tensorflow as tf
        if hasattr(tf, 'keras') and tf.keras is not None:
            return tf.keras
    except Exception:
        pass

    try:
        import keras
        return keras
    except Exception:
        pass

    try:
        import tensorflow.keras as keras
        return keras
    except Exception:
        pass

    return None

def _apply_keras_patches():
    global _keras_patched
    if _keras_patched:
        return
    try:
        keras_mod = _get_keras_module()
        if keras_mod is None:
            return

        try:
            if hasattr(keras_mod.layers, 'BatchNormalization'):
                BN = keras_mod.layers.BatchNormalization
                orig_bn_init = BN.__init__
                def patched_bn_init(self, *args, **kwargs):
                    kwargs.pop('renorm', None)
                    kwargs.pop('renorm_clipping', None)
                    kwargs.pop('renorm_momentum', None)
                    kwargs.pop('quantization_config', None)
                    orig_bn_init(self, *args, **kwargs)
                BN.__init__ = patched_bn_init
        except Exception:
            pass

        try:
            if hasattr(keras_mod.layers, 'Dense'):
                Dense = keras_mod.layers.Dense
                orig_dense_init = Dense.__init__
                def patched_dense_init(self, *args, **kwargs):
                    kwargs.pop('quantization_config', None)
                    orig_dense_init(self, *args, **kwargs)
                Dense.__init__ = patched_dense_init
        except Exception:
            pass

        try:
            if hasattr(keras_mod.initializers, 'GlorotUniform'):
                Glorot = keras_mod.initializers.GlorotUniform
                orig_glorot_init = Glorot.__init__
                def patched_glorot_init(self, *args, **kwargs):
                    kwargs.pop('input_axes', None)
                    kwargs.pop('output_axes', None)
                    orig_glorot_init(self, *args, **kwargs)
                Glorot.__init__ = patched_glorot_init
        except Exception:
            pass

        _keras_patched = True
    except Exception as e:
        pass

class ModelLoader:
    _models = {}
    _nn_means = np.array([182.5, 1013.2, 28.0, 24.0, 18.0, 17.0, 70.0, 50.0, 6.0, 180.0, 12.0, 10.0, 7.0, 0.12, 0.35, 0.70, 12000.0, -1.0, 0.0, 0.0])
    _nn_stds  = np.array([105.0,   10.0,  6.0,  5.0,  5.0,  5.0, 20.0, 30.0, 4.0, 100.0,  8.0,  4.0,  4.0, 0.10, 0.25, 0.20,  8000.0,  4.0, 0.7, 0.7])

    @classmethod
    def get_model(cls, model_name: str = 'xgboost'):
        model_name = model_name.lower().strip()
        if model_name not in cls._models or cls._models[model_name] is None:
            if model_name in ['neural_network', 'nn', 'keras']:
                _apply_keras_patches()
                keras_mod = _get_keras_module()
                if keras_mod is None:
                    raise ImportError("TensorFlow / Keras module is not available in the active environment.")
                model_path = os.path.join(settings.BASE_DIR, 'models', 'neural_network_model.keras')
                if not os.path.exists(model_path):
                    raise FileNotFoundError(f"Keras Neural Network model file not found at {model_path}")
                cls._models['neural_network'] = keras_mod.models.load_model(model_path, compile=False)
            else:
                model_path = os.path.join(settings.BASE_DIR, 'models', 'xgboost_model.joblib')
                if not os.path.exists(model_path):
                    raise FileNotFoundError(f"XGBoost model file not found at {model_path}")
                cls._models['xgboost'] = joblib.load(model_path)

        key = 'neural_network' if (model_name in ['neural_network', 'nn', 'keras']) else 'xgboost'
        return cls._models[key]

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
    def predict(cls, input_dict: dict, model_name: str = 'xgboost') -> dict:
        """
        Executes feature engineering, runs prediction using specified model (xgboost or neural_network),
        and returns prediction results payload. Falls back safely if a model is unavailable.
        """
        is_nn = model_name.lower().strip() in ['neural_network', 'nn', 'keras']
        actual_model_name = 'neural_network' if is_nn else 'xgboost'
        display_name = 'Neural Network (Keras DL)' if is_nn else 'XGBoost ML Model'

        df_raw = pd.DataFrame([input_dict])
        df_processed = cls.engineer_features(df_raw)

        if is_nn:
            try:
                model = cls.get_model('neural_network')
                # Standardize input features for Neural Network dense layers
                scaled_inputs = (df_processed.values - cls._nn_means) / cls._nn_stds
                nn_out = model.predict(scaled_inputs, verbose=0)
                rain_prob = float(nn_out[0][0])
                no_rain_prob = 1.0 - rain_prob
                prediction = 1 if rain_prob >= 0.5 else 0
            except Exception as e:
                logger.error("Neural Network prediction error: %s", e)
                # Fallback gracefully to XGBoost if Neural Network is unavailable
                model = cls.get_model('xgboost')
                prediction = int(model.predict(df_processed)[0])
                probabilities = model.predict_proba(df_processed)[0] if hasattr(model, 'predict_proba') else [1.0 - prediction, float(prediction)]
                rain_prob = float(probabilities[1])
                no_rain_prob = float(probabilities[0])
                display_name = 'XGBoost ML Model (Fallback)'
                actual_model_name = 'xgboost'
        else:
            model = cls.get_model('xgboost')
            prediction = int(model.predict(df_processed)[0])
            if hasattr(model, 'predict_proba'):
                probabilities = model.predict_proba(df_processed)[0]
                rain_prob = float(probabilities[1])
                no_rain_prob = float(probabilities[0])
            else:
                rain_prob = 1.0 if prediction == 1 else 0.0
                no_rain_prob = 1.0 - rain_prob

        return {
            'model_used': actual_model_name,
            'model_display_name': display_name,
            'prediction': int(prediction),
            'will_rain': bool(prediction == 1),
            'rain_probability': round(rain_prob * 100, 2),
            'no_rain_probability': round(no_rain_prob * 100, 2)
        }
