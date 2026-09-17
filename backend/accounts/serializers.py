from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["email"] = user.email
        # Add custom claims to refresh token payload as well for token refresh
        token.payload["role"] = user.role
        token.payload["email"] = user.email
        token.payload["user_id"] = user.id
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "email": self.user.email,
            "role": self.user.role,
        }
        return data


class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken(attrs["refresh"])
        data["user"] = {
            "id": refresh.payload.get("user_id"),
            "email": refresh.payload.get("email"),
            "role": refresh.payload.get("role"),
        }
        return data