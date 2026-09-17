from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import LoginSerializer, CustomTokenObtainPairSerializer


class LoginAPIView(APIView):
    """Authenticate an email/password pair and return a JWT token pair."""

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():

            email = serializer.validated_data["email"]
            password = serializer.validated_data["password"]

            user = authenticate(
                request,
                email=email,
                password=password
            )

            if user is not None:
                refresh = RefreshToken.for_user(user)
                refresh["role"] = user.role
                refresh["email"] = user.email
                # Add custom claims to refresh token payload as well for token refresh
                refresh.payload["role"] = user.role
                refresh.payload["email"] = user.email
                refresh.payload["user_id"] = user.id

                return Response(
                    {
                        "success": True,
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                        "user": {
                        "id": user.id,
                        "email": user.email,
                        "role": user.role,
                        }
                    },
                    status=status.HTTP_200_OK
                )

            return Response(
                {
                    "success": False,
                    "message": "Invalid email or password"
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class CurrentUserAPIView(APIView):
    """Return the current authenticated user's info."""
    
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {
                "id": user.id,
                "email": user.email,
                "role": user.role,
            },
            status=status.HTTP_200_OK
        )


class LogoutAPIView(APIView):
    """Blacklist the refresh token to log out the user."""
    
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"detail": "Refresh token is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"detail": "Successfully logged out."},
                status=status.HTTP_200_OK
            )
        except TokenError:
            return Response(
                {"detail": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception:
            return Response(
                {"detail": "Invalid token."},
                status=status.HTTP_400_BAD_REQUEST
            )
