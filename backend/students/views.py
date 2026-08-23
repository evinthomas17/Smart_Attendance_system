from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from adminpanel.permissions import IsAdminRole

from .models import Student
from .serializers import (
    StudentFaceDataSerializer,
    StudentRegistrationSerializer,
    StudentSerializer,
    StudentUpdateSerializer,
)


class StudentListCreateAPIView(ListCreateAPIView):
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        queryset = Student.objects.filter(is_active=True).select_related(
            "user", "class_group__course__department", "class_group__semester"
        )
        class_id = self.request.query_params.get("class_id")
        search_query = self.request.query_params.get("search", "").strip()
        if class_id:
            queryset = queryset.filter(class_group_id=class_id)
        if search_query:
            queryset = queryset.filter(
                Q(student_id__icontains=search_query)
                | Q(full_name__icontains=search_query)
                | Q(user__email__icontains=search_query)
            )
        return queryset

    def get_serializer_class(self):
        if self.request.method == "POST":
            return StudentRegistrationSerializer
        return StudentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        return Response(StudentSerializer(student).data, status=status.HTTP_201_CREATED)


class StudentDetailAPIView(RetrieveUpdateAPIView):
    permission_classes = [IsAdminRole]
    queryset = Student.objects.select_related(
        "user", "class_group__course__department", "class_group__semester"
    )

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return StudentUpdateSerializer
        return StudentSerializer


class StudentSearchAPIView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        students = Student.objects.filter(is_active=True).select_related(
            "user", "class_group__course__department", "class_group__semester"
        )
        if query:
            students = students.filter(
                Q(student_id__icontains=query)
                | Q(full_name__icontains=query)
                | Q(user__email__icontains=query)
            )
        return Response(StudentSerializer(students, many=True).data)


class StudentFaceDataListAPIView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request, pk):
        student = get_object_or_404(Student, pk=pk)
        return Response(StudentFaceDataSerializer(student.face_data.all(), many=True).data)