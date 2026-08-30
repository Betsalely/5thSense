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

# Serializer for user management
class UserManagementSerializer(serializers.ModelSerializer):
    # Write Only True for security and protecting the user's privacy
    password = serializers.CharField(style={'input_type': 'password'}, write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id','username', 'email','user_role','password')

    def update(self, instance, validated_data):
        # Hash the password for security
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance