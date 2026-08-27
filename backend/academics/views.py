from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework import status

from adminpanel.permissions import IsAdminRole

from .models import AcademicClass, Course, Department, Semester, Subject
from .serializers import (
    AcademicClassSerializer,
    CourseSerializer,
    DepartmentSerializer,
    SemesterSerializer,
    SubjectSerializer,
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


class SubjectListCreateAPIView(ListCreateAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = SubjectSerializer

    def get_queryset(self):
        queryset = Subject.objects.filter(is_active=True).select_related(
            "course__department", "semester"
        )
        course_id = self.request.query_params.get("course")
        semester_id = self.request.query_params.get("semester")
        search = self.request.query_params.get("search")
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if semester_id:
            queryset = queryset.filter(semester_id=semester_id)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset

    def create(self, request, *args, **kwargs):
        # Support both single subject and bulk creation
        subjects_data = request.data
        if isinstance(subjects_data, list):
            serializer = self.get_serializer(data=subjects_data, many=True)
        else:
            serializer = self.get_serializer(data=subjects_data)
        
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class SubjectRetrieveUpdateDestroyAPIView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = SubjectSerializer
    lookup_field = "id"

    def get_queryset(self):
        return Subject.objects.filter(is_active=True).select_related(
            "course__department", "semester"
        )