from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Map
from .serializers import MapSerializer
from .permissions import IsSuperAdminOrMapOwner

class MapListCreateView(generics.ListCreateAPIView):
    # List maps or create a map
    serializer_class = MapSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrMapOwner]

    def get_queryset(self):
        user = self.request.user
        if user.user_role == 'superadmin':
            return Map.objects.all()
        return Map.objects.filter(created_by=user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class MapDetailView(generics.RetrieveUpdateDestroyAPIView):
    # Edit or delete a map
    queryset = Map.objects.all()
    serializer_class = MapSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrMapOwner]