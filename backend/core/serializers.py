from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

# Serializer for the user account creation model
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(style={'input_type': 'password'}, write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'user_role')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email',''), # In case that the email is empty
            password=validated_data['password'],
            user_role=validated_data.get('user_role', 'admin') # Default to admin
        )
        return user