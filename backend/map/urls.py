from django.urls import path
from .views import MapListCreateView, MapDetailView

urlpatterns = [
    path('api/maps/', MapListCreateView.as_view(), name='map-list-create'),
    path('api/maps/<int:pk>/', MapDetailView.as_view(), name='map-detail'),
]