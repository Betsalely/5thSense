from django.contrib import admin
from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from core.views import UserRegistrationView

urlpatterns = [
    path('api/users/register/', UserRegistrationView.as_view(), name='api-user-register'),
    path('api/users/login/', obtain_auth_token, name='api-user-login'),
]