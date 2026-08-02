import json
from unittest.mock import patch, MagicMock
from django.test import TestCase, Client
from django.urls import reverse
from predictor.models import RainfallPrediction
from predictor.views import _call_fastapi_predict

class PredictorViewsTest(TestCase):
    """
    Integration & Unit tests for predictor Django views and API endpoints.
    """

    def setUp(self):
        self.client = Client()
        self.valid_form_data = {
            'day': '180',
            'pressure': '1013.2',
            'maxtemp': '30.0',
            'temparature': '25.5',
            'mintemp': '21.0',
            'dewpoint': '22.0',
            'humidity': '80.0',
            'cloud': '65.0',
            'sunshine': '5.0',
            'winddirection': '180.0',
            'windspeed': '12.5',
            'model_choice': 'xgboost'
        }

    def test_index_get(self):
        """Test GET request to index view renders home page template."""
        response = self.client.get(reverse('predictor:index'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'predictor/index.html')
        self.assertIn('form_data', response.context)
        self.assertEqual(response.context['selected_model'], 'xgboost')

    @patch('predictor.views._call_fastapi_predict')
    def test_index_post_form_submit(self, mock_fastapi):
        """Test standard HTML form POST prediction request."""
        # Force FastAPI mock call to return None so local ModelLoader is executed
        mock_fastapi.return_value = (None, "FastAPI unreachable")

        response = self.client.post(reverse('predictor:index'), self.valid_form_data)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'predictor/index.html')
        self.assertIsNotNone(response.context['result'])

        # Verify DB record was saved
        self.assertEqual(RainfallPrediction.objects.count(), 1)
        record = RainfallPrediction.objects.first()
        self.assertEqual(record.day, 180.0)
        self.assertEqual(record.model_used, 'xgboost')

    @patch('predictor.views._call_fastapi_predict')
    def test_index_post_json_ajax(self, mock_fastapi):
        """Test JSON / AJAX POST prediction request."""
        mock_fastapi.return_value = (None, "FastAPI unreachable")

        json_data = {
            'day': 200,
            'pressure': 1010.5,
            'maxtemp': 32.0,
            'temparature': 27.0,
            'mintemp': 22.0,
            'dewpoint': 21.0,
            'humidity': 75.0,
            'cloud': 50.0,
            'sunshine': 7.0,
            'winddirection': 210.0,
            'windspeed': 10.0,
            'model_choice': 'neural_network'
        }

        response = self.client.post(
            reverse('predictor:index'),
            data=json.dumps(json_data),
            content_type='application/json',
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )

        self.assertEqual(response.status_code, 200)
        res_json = response.json()
        self.assertTrue(res_json['success'])
        self.assertIn('result', res_json)
        self.assertIn('prediction', res_json['result'])

        # Verify DB record saved with neural_network model
        self.assertEqual(RainfallPrediction.objects.count(), 1)

    def test_index_post_invalid_json(self):
        """Test sending malformed JSON payload returns 400 Bad Request."""
        response = self.client.post(
            reverse('predictor:index'),
            data="invalid json string {{{",
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid JSON', response.json()['error'])

    def test_index_post_invalid_data_type(self):
        """Test sending invalid numeric values returns 400 error for AJAX."""
        invalid_data = dict(self.valid_form_data)
        invalid_data['pressure'] = 'not-a-number'

        response = self.client.post(
            reverse('predictor:index'),
            data=json.dumps(invalid_data),
            content_type='application/json',
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()['success'])

    def test_get_predictions_api(self):
        """Test fetching prediction history API."""
        # Create 3 predictions in DB
        RainfallPrediction.objects.create(day=10.0, rain_probability=10.0)
        RainfallPrediction.objects.create(day=20.0, rain_probability=50.0)
        RainfallPrediction.objects.create(day=30.0, rain_probability=90.0)

        response = self.client.get('/api/predictions/')
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertTrue(data['success'])
        self.assertEqual(data['count'], 3)
        self.assertEqual(len(data['predictions']), 3)

        # Check fields in history record
        first_item = data['predictions'][0]
        self.assertIn('id', first_item)
        self.assertIn('rain_probability', first_item)
        self.assertIn('created_at', first_item)
        self.assertIn('label', first_item)

    def test_delete_single_prediction_api(self):
        """Test deleting a single prediction record by ID."""
        item = RainfallPrediction.objects.create(day=100.0)
        item_id = item.id

        response = self.client.post(f'/api/predictions/delete/{item_id}/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        self.assertFalse(RainfallPrediction.objects.filter(id=item_id).exists())

    def test_delete_single_prediction_api_not_found(self):
        """Test deleting a non-existent prediction record returns 404."""
        response = self.client.post('/api/predictions/delete/999999/')
        self.assertEqual(response.status_code, 404)
        self.assertFalse(response.json()['success'])

    def test_clear_all_predictions_api(self):
        """Test bulk clearing all prediction records."""
        RainfallPrediction.objects.create(day=10.0)
        RainfallPrediction.objects.create(day=20.0)
        self.assertEqual(RainfallPrediction.objects.count(), 2)

        response = self.client.post(
            '/api/predictions/delete/',
            data=json.dumps({'action': 'clear_all'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        self.assertEqual(RainfallPrediction.objects.count(), 0)

    def test_delete_prediction_api_method_not_allowed(self):
        """Test GET request to delete API returns 405 Method Not Allowed."""
        response = self.client.get('/api/predictions/delete/1/')
        self.assertEqual(response.status_code, 405)

    @patch('urllib.request.urlopen')
    def test_call_fastapi_predict_success(self, mock_urlopen):
        """Test _call_fastapi_predict proxy helper on 200 success response."""
        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_resp.read.return_value = json.dumps({
            'prediction': 1,
            'will_rain': True,
            'rain_probability': 85.0,
            'no_rain_probability': 15.0,
            'model_used': 'xgboost',
            'model_display_name': 'XGBoost ML Model'
        }).encode('utf-8')
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        parsed_data = {'day': 180, 'pressure': 1013.2}
        result, error = _call_fastapi_predict(parsed_data, 'xgboost')

        self.assertIsNone(error)
        self.assertEqual(result['prediction'], 1)
        self.assertTrue(result['will_rain'])

    @patch('urllib.request.urlopen')
    def test_call_fastapi_predict_failure(self, mock_urlopen):
        """Test _call_fastapi_predict fallback when FastAPI throws exception."""
        mock_urlopen.side_effect = Exception("Connection refused")

        parsed_data = {'day': 180, 'pressure': 1013.2}
        result, error = _call_fastapi_predict(parsed_data, 'xgboost')

        self.assertIsNone(result)
        self.assertEqual(error, "FastAPI microservice unreachable")
