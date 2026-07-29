import json
import logging
import urllib.request
import urllib.error
from django.shortcuts import render
from django.http import JsonResponse
from .ml_model import ModelLoader
from .models import RainfallPrediction

import os

logger = logging.getLogger(__name__)

FASTAPI_URL = os.environ.get("FASTAPI_URL", "http://127.0.0.1:8001/api/v1/predict")

def _call_fastapi_predict(parsed_data: dict, selected_model: str) -> tuple[dict | None, str | None]:
    """
    Proxy prediction request to the FastAPI ML microservice.
    Returns (result_dict, error_string).
    """
    payload = dict(parsed_data)
    payload["model_choice"] = selected_model
    data_bytes = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        FASTAPI_URL,
        data=data_bytes,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=3) as resp:
            if resp.status == 200:
                body = json.loads(resp.read().decode("utf-8"))
                return body, None
    except Exception as e:
        logger.warning(f"FastAPI microservice call failed ({e}). Falling back to local ModelLoader.")

    return None, "FastAPI microservice unreachable"

def get_predictions_api(request):
    """
    Returns all saved predictions from the database in JSON format.
    Used by Shadcn Interactive Area Chart.
    """
    predictions = RainfallPrediction.objects.all().order_by('created_at')[:100]
    data = []
    for item in predictions:
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
    return JsonResponse({
        'success': True,
        'count': len(data),
        'predictions': data
    })

def index(request):
    """
    Renders the Rainfall Predictor home page with the prediction form.
    Handles POST requests for AJAX/form predictions, saves results into the database,
    and returns response payload with DB integration.
    """
    result = None
    errors = None
    selected_model = 'xgboost'
    form_data = {
        'day': 180,
        'pressure': 1013.2,
        'maxtemp': 30.0,
        'temparature': 25.5,
        'mintemp': 21.0,
        'dewpoint': 22.0,
        'humidity': 80.0,
        'cloud': 65.0,
        'sunshine': 5.0,
        'winddirection': 180.0,
        'windspeed': 12.5,
    }

    if request.method == 'POST':
        # Support both JSON payload and standard form submit
        if request.content_type == 'application/json':
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON'}, status=400)
        else:
            data = request.POST

        selected_model = data.get('model_choice', 'xgboost')

        try:
            parsed_data = {
                'day': float(data.get('day', 180)),
                'pressure': float(data.get('pressure', 1013.2)),
                'maxtemp': float(data.get('maxtemp', 30.0)),
                'temparature': float(data.get('temparature', 25.5)),
                'mintemp': float(data.get('mintemp', 21.0)),
                'dewpoint': float(data.get('dewpoint', 22.0)),
                'humidity': float(data.get('humidity', 80.0)),
                'cloud': float(data.get('cloud', 65.0)),
                'sunshine': float(data.get('sunshine', 5.0)),
                'winddirection': float(data.get('winddirection', 180.0)),
                'windspeed': float(data.get('windspeed', 12.5)),
            }
            form_data = parsed_data

            # Try calling FastAPI ML microservice first
            fastapi_result, _ = _call_fastapi_predict(parsed_data, selected_model)
            if fastapi_result:
                result = fastapi_result
            else:
                # Fallback to local ModelLoader execution
                result = ModelLoader.predict(parsed_data, model_name=selected_model)

            # SAVE PREDICTION INTO DATABASE
            try:
                record = RainfallPrediction.objects.create(
                    day=parsed_data['day'],
                    pressure=parsed_data['pressure'],
                    maxtemp=parsed_data['maxtemp'],
                    temparature=parsed_data['temparature'],
                    mintemp=parsed_data['mintemp'],
                    dewpoint=parsed_data['dewpoint'],
                    humidity=parsed_data['humidity'],
                    cloud=parsed_data['cloud'],
                    sunshine=parsed_data['sunshine'],
                    winddirection=parsed_data['winddirection'],
                    windspeed=parsed_data['windspeed'],
                    prediction=int(result.get('prediction', 0)),
                    will_rain=bool(result.get('will_rain', False)),
                    rain_probability=float(result.get('rain_probability', 0.0)),
                    no_rain_probability=float(result.get('no_rain_probability', 0.0)),
                    model_used=str(result.get('model_used', selected_model)),
                    model_display_name=str(result.get('model_display_name', 'XGBoost ML Model'))
                )
                result['id'] = record.id
                result['created_at'] = record.created_at.strftime('%Y-%m-%d %H:%M:%S')
                result['label'] = f"#{record.id} ({record.created_at.strftime('%H:%M')})"
            except Exception as db_err:
                logger.error(f"Error saving prediction to database: {db_err}")

            if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json':
                return JsonResponse({'success': True, 'result': result})

        except Exception as e:
            errors = str(e)
            if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json':
                return JsonResponse({'success': False, 'error': errors}, status=400)

    return render(request, 'predictor/index.html', {
        'form_data': form_data,
        'result': result,
        'errors': errors,
        'selected_model': selected_model
    })
