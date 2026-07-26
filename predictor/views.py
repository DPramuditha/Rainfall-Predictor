import json
from django.shortcuts import render
from django.http import JsonResponse
from .ml_model import ModelLoader

def index(request):
    """
    Renders the Rainfall Predictor home page with the prediction form.
    Handles POST requests for AJAX/form predictions with model selection support.
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
            result = ModelLoader.predict(parsed_data, model_name=selected_model)

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
