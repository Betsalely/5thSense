from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework import status,generics
from django.shortcuts import get_object_or_404
from .utils import find_shortest_path
from .models import Map, Destinations
from .serializers import MapSerializer, DestinationsSerializer
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

class MapPathfindingView(APIView):
    # Find the shortest path between two provided coordinates
    permission_classes = [AllowAny]

    def get(self, request, pk):
        map_instance = get_object_or_404(Map, pk=pk)

        try:
            # Store start and end coordinates
            start_x = int(request.query_params.get('start_x'))
            start_y = int(request.query_params.get('start_y'))
            end_x = int(request.query_params.get('end_x'))
            end_y = int(request.query_params.get('end_y'))
        except (TypeError, ValueError):
            # Make sure that coordinates provided are valid integers
            return Response({'error', 'Start and end coordinates provided are invalid'}, status=status.HTTP_400_BAD_REQUEST)

        start_coordinate = [start_x, start_y]
        end_coordinate = [end_x, end_y]

        # Find the shortest path
        result = find_shortest_path(map_instance.grid_data, start_coordinate, end_coordinate)

        if isinstance(result, dict) and "error" in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'map_id': map_instance.id,
            'start': start_coordinate,
            'end': end_coordinate,
            'path': result,
            'total_steps': len(result) - 1,
        }, status=status.HTTP_200_OK)

class DestinationsListCreateView(generics.ListCreateAPIView):
    # List destinations
    serializer_class = DestinationsSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrMapOwner]

    def get_queryset(self):
        user = self.request.user
        if user.user_role == 'superadmin':
            return DestinationsSerializer.objects.all()
        return Destinations.objects.filter(created_by=user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)