from django.urls import path

from .views import (
    StudentDetailAPIView,
    StudentFaceDataListAPIView,
    StudentListCreateAPIView,
    StudentRegistrationWithFaceAPIView,
    StudentSearchAPIView,
)

urlpatterns = [
    path("", StudentListCreateAPIView.as_view(), name="student-list-create"),
    path("register/", StudentRegistrationWithFaceAPIView.as_view(), name="student-register-face"),
    path("search/", StudentSearchAPIView.as_view(), name="student-search"),
    path("<int:pk>/", StudentDetailAPIView.as_view(), name="student-detail"),
    path("<int:pk>/face-data/", StudentFaceDataListAPIView.as_view(), name="student-face-data"),
]