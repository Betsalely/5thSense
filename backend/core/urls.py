from django.contrib import admin
from django.urls import path

from core.views import UserRegistrationView

urlpatterns = [
    path('api/users/register/', UserRegistrationView.as_view(), name='api-user-register'),
]