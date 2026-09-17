from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import LoginAPIView, CustomTokenObtainPairView, CurrentUserAPIView, LogoutAPIView

urlpatterns = [
    path("login/", LoginAPIView.as_view(), name="login"),
    path("token/", CustomTokenObtainPairView.as_view(), name="token-obtain"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", CurrentUserAPIView.as_view(), name="current-user"),
    path("logout/", LogoutAPIView.as_view(), name="logout"),
]
