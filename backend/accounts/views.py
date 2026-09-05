from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

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
