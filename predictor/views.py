from django.shortcuts import render

def index(request):
    """
    Renders the Rainfall Predictor homepage.
    """
    return render(request, 'predictor/index.html')
