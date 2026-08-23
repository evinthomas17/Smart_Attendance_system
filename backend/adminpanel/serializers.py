from rest_framework import serializers

from accounts.models import User


class ManagedAccountSerializer(serializers.Serializer):
    """Base input for administrator-created user accounts."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value


class StudentRegistrationSerializer(ManagedAccountSerializer):
    def create(self, validated_data):
        return User.objects.create_user(role="STUDENT", **validated_data)


class FacultyRegistrationSerializer(ManagedAccountSerializer):
    def create(self, validated_data):
        return User.objects.create_user(role="FACULTY", **validated_data)


class ManagedAccountResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    role = serializers.CharField()
