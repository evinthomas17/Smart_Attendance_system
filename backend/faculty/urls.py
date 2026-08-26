from django.urls import path

from .views import (
    FacultyCourseAssignmentDetailAPIView,
    FacultyCourseAssignmentsAPIView,
    FacultyDetailAPIView,
    FacultyListCreateAPIView,
)

urlpatterns = [
    path("", FacultyListCreateAPIView.as_view(), name="faculty-list-create"),
    path("<int:pk>/", FacultyDetailAPIView.as_view(), name="faculty-detail"),
    path("<int:pk>/courses/", FacultyCourseAssignmentsAPIView.as_view(), name="faculty-course-assignments"),
    path("<int:pk>/courses/<int:assignment_id>/", FacultyCourseAssignmentDetailAPIView.as_view(), name="faculty-course-assignment-detail"),
]