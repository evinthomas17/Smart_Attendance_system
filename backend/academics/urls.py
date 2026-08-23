from django.urls import path

from .views import (
    AcademicClassListAPIView,
    CourseListAPIView,
    DepartmentListAPIView,
    SemesterListAPIView,
)

urlpatterns = [
    path("departments/", DepartmentListAPIView.as_view(), name="department-list"),
    path("courses/", CourseListAPIView.as_view(), name="course-list"),
    path("semesters/", SemesterListAPIView.as_view(), name="semester-list"),
    path("classes/", AcademicClassListAPIView.as_view(), name="class-list"),
]