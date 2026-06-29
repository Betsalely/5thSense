from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .permissions import IsSuperAdminUser
from .serializers import UserRegistrationSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    # Make sure that the user is both authenticated and a Super Admin
    permission_classes = [IsAuthenticated, IsSuperAdminUser]
    serializer_class = UserRegistrationSerializer

