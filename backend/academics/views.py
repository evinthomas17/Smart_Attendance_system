from rest_framework.generics import ListAPIView

from adminpanel.permissions import IsAdminRole

from .models import AcademicClass, Course, Department, Semester
from .serializers import (
    AcademicClassSerializer,
    CourseSerializer,
    DepartmentSerializer,
    SemesterSerializer,
)


class DepartmentListAPIView(ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = DepartmentSerializer

    def get_queryset(self):
        return Department.objects.filter(is_active=True)


class CourseListAPIView(ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = CourseSerializer

    def get_queryset(self):
        queryset = Course.objects.filter(is_active=True).select_related("department")
        department_id = self.request.query_params.get("department")
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        return queryset


class SemesterListAPIView(ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = SemesterSerializer

    def get_queryset(self):
        queryset = Semester.objects.filter(is_active=True).select_related("course")
        course_id = self.request.query_params.get("course")
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset


class AcademicClassListAPIView(ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = AcademicClassSerializer

    def get_queryset(self):
        queryset = AcademicClass.objects.filter(is_active=True).select_related(
            "course__department", "semester"
        )
        course_id = self.request.query_params.get("course")
        semester_id = self.request.query_params.get("semester")
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if semester_id:
            queryset = queryset.filter(semester_id=semester_id)
        return queryset