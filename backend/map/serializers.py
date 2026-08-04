from rest_framework import serializers
from .models import Map

class MapSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    class Meta:
        model = Map
        fields = '__all__'