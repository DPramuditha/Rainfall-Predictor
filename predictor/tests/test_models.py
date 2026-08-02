from django.test import TestCase
from django.utils import timezone
from predictor.models import RainfallPrediction

class RainfallPredictionModelTest(TestCase):
    """
    Unit tests for the RainfallPrediction database model.
    """

    def setUp(self):
        self.prediction_rain = RainfallPrediction.objects.create(
            day=180.0,
            pressure=1012.0,
            maxtemp=32.0,
            temparature=28.0,
            mintemp=24.0,
            dewpoint=23.5,
            humidity=85.0,
            cloud=90.0,
            sunshine=2.0,
            winddirection=200.0,
            windspeed=15.0,
            prediction=1,
            will_rain=True,
            rain_probability=88.5,
            no_rain_probability=11.5,
            model_used='xgboost',
            model_display_name='XGBoost ML Model'
        )

        self.prediction_no_rain = RainfallPrediction.objects.create(
            day=100.0,
            pressure=1018.0,
            maxtemp=28.0,
            temparature=22.0,
            mintemp=18.0,
            dewpoint=12.0,
            humidity=40.0,
            cloud=10.0,
            sunshine=10.0,
            winddirection=90.0,
            windspeed=8.0,
            prediction=0,
            will_rain=False,
            rain_probability=12.0,
            no_rain_probability=88.0,
            model_used='neural_network',
            model_display_name='Neural Network (Keras DL)'
        )

    def test_model_field_defaults(self):
        """Test default values when creating model with minimal arguments."""
        item = RainfallPrediction.objects.create()
        self.assertEqual(item.day, 180.0)
        self.assertEqual(item.pressure, 1013.2)
        self.assertEqual(item.maxtemp, 30.0)
        self.assertEqual(item.temparature, 25.5)
        self.assertEqual(item.mintemp, 21.0)
        self.assertEqual(item.dewpoint, 22.0)
        self.assertEqual(item.humidity, 80.0)
        self.assertEqual(item.cloud, 65.0)
        self.assertEqual(item.sunshine, 5.0)
        self.assertEqual(item.winddirection, 180.0)
        self.assertEqual(item.windspeed, 12.5)
        self.assertEqual(item.prediction, 0)
        self.assertFalse(item.will_rain)
        self.assertEqual(item.rain_probability, 0.0)
        self.assertEqual(item.no_rain_probability, 0.0)
        self.assertEqual(item.model_used, 'xgboost')
        self.assertEqual(item.model_display_name, 'XGBoost ML Model')
        self.assertIsNotNone(item.created_at)

    def test_model_custom_fields(self):
        """Test that custom values are stored accurately."""
        self.assertTrue(self.prediction_rain.will_rain)
        self.assertEqual(self.prediction_rain.prediction, 1)
        self.assertEqual(self.prediction_rain.rain_probability, 88.5)
        self.assertEqual(self.prediction_no_rain.prediction, 0)
        self.assertFalse(self.prediction_no_rain.will_rain)

    def test_string_representation(self):
        """Test __str__ representation for Rain and No Rain predictions."""
        str_rain = str(self.prediction_rain)
        str_no_rain = str(self.prediction_no_rain)

        self.assertIn("Rain", str_rain)
        self.assertIn("88.5%", str_rain)
        self.assertIn("No Rain", str_no_rain)
        self.assertIn("12.0%", str_no_rain)

    def test_ordering(self):
        """Test default ordering by -created_at (newest first)."""
        predictions = list(RainfallPrediction.objects.all())
        self.assertEqual(predictions[0], self.prediction_no_rain)
        self.assertEqual(predictions[1], self.prediction_rain)
