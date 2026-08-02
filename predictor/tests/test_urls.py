from django.test import TestCase
from django.urls import reverse, resolve
from predictor import views

class PredictorURLsTest(TestCase):
    """
    Unit tests for Django URL configuration and resolution in predictor app.
    """

    def test_index_url_resolves(self):
        """Test index URL resolves to index view."""
        url = reverse('predictor:index')
        self.assertEqual(url, '/')
        resolver = resolve(url)
        self.assertEqual(resolver.func, views.index)

    def test_predictions_api_url_resolves(self):
        """Test predictions_api URL resolves to get_predictions_api view."""
        url = reverse('predictor:predictions_api')
        self.assertEqual(url, '/api/predictions/')
        resolver = resolve(url)
        self.assertEqual(resolver.func, views.get_predictions_api)

    def test_delete_prediction_api_url_resolves(self):
        """Test delete_prediction_api URL with pk resolves to delete_prediction_api view."""
        url = reverse('predictor:delete_prediction_api', kwargs={'pk': 42})
        self.assertEqual(url, '/api/predictions/delete/42/')
        resolver = resolve(url)
        self.assertEqual(resolver.func, views.delete_prediction_api)

    def test_clear_predictions_api_url_resolves(self):
        """Test clear_predictions_api URL resolves to delete_prediction_api view."""
        url = reverse('predictor:clear_predictions_api')
        self.assertEqual(url, '/api/predictions/delete/')
        resolver = resolve(url)
        self.assertEqual(resolver.func, views.delete_prediction_api)
