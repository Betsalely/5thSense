from django.contrib import admin
from django.urls import path
from core.views import UserRegistrationView, AuthToken

urlpatterns = [
    path('api/users/register/', UserRegistrationView.as_view(), name='api-user-register'),
    path('api/users/login/', AuthToken.as_view(), name='api-user-login'),
]

