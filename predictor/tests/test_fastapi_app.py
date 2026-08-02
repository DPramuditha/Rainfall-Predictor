from django.test import TransactionTestCase
from fastapi.testclient import TestClient
from api.main import app
from predictor.models import RainfallPrediction

class FastAPIMicroserviceTest(TransactionTestCase):
    """
    Unit & Integration tests for FastAPI ML microservice endpoints.
    """

    def setUp(self):
        self.client = TestClient(app)
        self.valid_payload = {
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

    def tearDown(self):
        from django.db import connections
        connections.close_all()
        super().tearDown()

    def test_health_check_endpoint(self):
        """Test GET / health check endpoint returns 200 OK and service metadata."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["service"], "Rainfall Predictor ML Microservice")
        self.assertEqual(data["status"], "online")
        self.assertIn("supported_models", data)

    def test_predict_xgboost(self):
        """Test POST /api/v1/predict with XGBoost model choice."""
        response = self.client.post("/api/v1/predict", json=self.valid_payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("prediction", data)
        self.assertIn("will_rain", data)
        self.assertIn("rain_probability", data)
        self.assertIn("no_rain_probability", data)
        self.assertEqual(data["model_used"], "xgboost")

    def test_predict_neural_network(self):
        """Test POST /api/v1/predict with Neural Network model choice."""
        payload = dict(self.valid_payload)
        payload["model_choice"] = "neural_network"

        response = self.client.post("/api/v1/predict", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn(data["prediction"], [0, 1])
        self.assertIn(data["model_used"], ["neural_network", "xgboost"])

    def test_predict_out_of_range_day(self):
        """Test Pydantic validation failure for day out of range (e.g. 400 > 365)."""
        invalid_payload = dict(self.valid_payload)
        invalid_payload["day"] = 400.0  # ge=1, le=365

        response = self.client.post("/api/v1/predict", json=invalid_payload)
        self.assertEqual(response.status_code, 422)  # Unprocessable Entity

    def test_predict_out_of_range_pressure(self):
        """Test Pydantic validation failure for pressure out of range (e.g. 500 < 800)."""
        invalid_payload = dict(self.valid_payload)
        invalid_payload["pressure"] = 500.0  # ge=800, le=1100

        response = self.client.post("/api/v1/predict", json=invalid_payload)
        self.assertEqual(response.status_code, 422)

    def test_predict_out_of_range_humidity(self):
        """Test Pydantic validation failure for humidity > 100%."""
        invalid_payload = dict(self.valid_payload)
        invalid_payload["humidity"] = 150.0  # ge=0, le=100

        response = self.client.post("/api/v1/predict", json=invalid_payload)
        self.assertEqual(response.status_code, 422)

    def test_get_predictions_history(self):
        """Test GET /api/v1/predictions retrieving DB history."""
        RainfallPrediction.objects.create(day=50.0, rain_probability=20.0)
        RainfallPrediction.objects.create(day=60.0, rain_probability=70.0)

        response = self.client.get("/api/v1/predictions")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertTrue(data["success"])
        self.assertEqual(data["count"], 2)
        self.assertEqual(len(data["predictions"]), 2)
