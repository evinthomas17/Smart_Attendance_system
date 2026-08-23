from django.urls import path

from .views import AdminDashboardAPIView, CreateFacultyAPIView, CreateStudentAPIView

urlpatterns = [
    path("dashboard/", AdminDashboardAPIView.as_view(), name="admin-dashboard"),
    path("students/", CreateStudentAPIView.as_view(), name="admin-create-student"),
    path("faculty/", CreateFacultyAPIView.as_view(), name="admin-create-faculty"),
]
