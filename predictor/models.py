from django.db import models

class RainfallPrediction(models.Model):
    day = models.FloatField(default=180.0)
    pressure = models.FloatField(default=1013.2)
    maxtemp = models.FloatField(default=30.0)
    temparature = models.FloatField(default=25.5)
    mintemp = models.FloatField(default=21.0)
    dewpoint = models.FloatField(default=22.0)
    humidity = models.FloatField(default=80.0)
    cloud = models.FloatField(default=65.0)
    sunshine = models.FloatField(default=5.0)
    winddirection = models.FloatField(default=180.0)
    windspeed = models.FloatField(default=12.5)
    
    prediction = models.IntegerField(default=0)
    will_rain = models.BooleanField(default=False)
    rain_probability = models.FloatField(default=0.0)
    no_rain_probability = models.FloatField(default=0.0)
    model_used = models.CharField(max_length=50, default='xgboost')
    model_display_name = models.CharField(max_length=100, default='XGBoost ML Model')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Prediction #{self.id} - {'Rain' if self.will_rain else 'No Rain'} ({self.rain_probability}%) on {self.created_at.strftime('%Y-%m-%d %H:%M')}"
