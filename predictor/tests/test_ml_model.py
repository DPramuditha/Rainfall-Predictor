import unittest
from unittest.mock import patch, MagicMock
import pandas as pd
import numpy as np
from django.test import TestCase
from predictor.ml_model import ModelLoader

class MLModelLoaderTest(TestCase):
    """
    Unit tests for ModelLoader, feature engineering, model loading, and inference.
    """

    def setUp(self):
        self.sample_input = {
            'day': 180.0,
            'pressure': 1013.2,
            'maxtemp': 30.0,
            'temparature': 25.5,
            'mintemp': 21.0,
            'dewpoint': 22.0,
            'humidity': 80.0,
            'cloud': 65.0,
            'sunshine': 5.0,
            'winddirection': 180.0,
            'windspeed': 12.5
        }

    def test_engineer_features(self):
        """Test feature engineering calculations and column structure."""
        df_input = pd.DataFrame([self.sample_input])
        df_engineered = ModelLoader.engineer_features(df_input)

        expected_columns = [
            'day', 'pressure', 'maxtemp', 'temparature', 'mintemp', 'dewpoint', 'humidity',
            'cloud', 'sunshine', 'winddirection', 'windspeed', 'temp_range',
            'dewpoint_depression', 'sunshine_cloud_ratio', 'humidity_cloud_interaction',
            'temp_dewpoint_ratio', 'wind_power', 'sunshine_humidity_diff', 'day_sin', 'day_cos'
        ]

        # Verify all expected columns exist and match order
        self.assertEqual(list(df_engineered.columns), expected_columns)

        # Verify feature calculations
        row = df_engineered.iloc[0]
        self.assertAlmostEqual(row['temp_range'], 30.0 - 21.0)
        self.assertAlmostEqual(row['dewpoint_depression'], 25.5 - 22.0)
        self.assertAlmostEqual(row['sunshine_cloud_ratio'], 5.0 / (65.0 + 1.0))
        self.assertAlmostEqual(row['humidity_cloud_interaction'], (80.0 / 100.0) * (65.0 / 100.0))
        self.assertAlmostEqual(row['temp_dewpoint_ratio'], 22.0 / (25.5 + 1.0))
        self.assertAlmostEqual(row['wind_power'], 12.5 * 1013.2)
        self.assertAlmostEqual(row['sunshine_humidity_diff'], 5.0 - (80.0 / 10.0))

        # Verify cyclical seasonality encoding
        expected_sin = np.sin(2 * np.pi * 180.0 / 365.0)
        expected_cos = np.cos(2 * np.pi * 180.0 / 365.0)
        self.assertAlmostEqual(row['day_sin'], expected_sin)
        self.assertAlmostEqual(row['day_cos'], expected_cos)

    def test_get_xgboost_model(self):
        """Test retrieving the trained XGBoost model."""
        model = ModelLoader.get_model('xgboost')
        self.assertIsNotNone(model)

    def test_get_neural_network_model(self):
        """Test retrieving the trained Keras Neural Network model."""
        try:
            model = ModelLoader.get_model('neural_network')
            self.assertIsNotNone(model)
        except (ImportError, FileNotFoundError) as e:
            # Skip if TF/Keras is missing or model file is absent in test runner env
            self.skipTest(f"Neural Network model unavailable: {e}")

    def test_predict_xgboost(self):
        """Test end-to-end prediction using XGBoost."""
        result = ModelLoader.predict(self.sample_input, model_name='xgboost')

        self.assertIn('prediction', result)
        self.assertIn('will_rain', result)
        self.assertIn('rain_probability', result)
        self.assertIn('no_rain_probability', result)
        self.assertIn('model_used', result)
        self.assertIn('model_display_name', result)

        self.assertEqual(result['model_used'], 'xgboost')
        self.assertIn('XGBoost', result['model_display_name'])
        self.assertIn(result['prediction'], [0, 1])
        self.assertIsInstance(result['will_rain'], bool)
        self.assertAlmostEqual(result['rain_probability'] + result['no_rain_probability'], 100.0, delta=0.2)

    def test_predict_neural_network_or_fallback(self):
        """Test prediction using Neural Network or verify fallback to XGBoost."""
        result = ModelLoader.predict(self.sample_input, model_name='neural_network')

        self.assertIn(result['prediction'], [0, 1])
        self.assertIn(result['model_used'], ['neural_network', 'xgboost'])
        self.assertAlmostEqual(result['rain_probability'] + result['no_rain_probability'], 100.0, delta=0.2)

    @patch.object(ModelLoader, 'get_model')
    def test_predict_nn_fallback_on_exception(self, mock_get_model):
        """Test that if Neural Network throws an exception, predict falls back to XGBoost cleanly."""
        # Mock get_model to fail for neural_network, but succeed for xgboost
        real_xgb_model = ModelLoader.get_model('xgboost')

        def side_effect(model_name):
            if model_name == 'neural_network':
                raise Exception("Simulated Keras model failure")
            return real_xgb_model

        mock_get_model.side_effect = side_effect

        result = ModelLoader.predict(self.sample_input, model_name='neural_network')

        self.assertEqual(result['model_used'], 'xgboost')
        self.assertIn('Fallback', result['model_display_name'])
        self.assertIn(result['prediction'], [0, 1])
