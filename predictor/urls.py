from django.urls import path
from . import views

app_name = 'predictor'

urlpatterns = [
    path('', views.index, name='index'),
    path('api/predictions/', views.get_predictions_api, name='predictions_api'),
    path('api/predictions', views.get_predictions_api),
    path('api/predictions/delete/<int:pk>/', views.delete_prediction_api, name='delete_prediction_api'),
    path('api/predictions/delete/', views.delete_prediction_api, name='clear_predictions_api'),
]
