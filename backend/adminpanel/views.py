from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from academics.models import Course, Department
from devices.models import Device
from faculty.models import Faculty

from .permissions import IsAdminRole
from .serializers import (
    FacultyRegistrationSerializer,
    ManagedAccountResponseSerializer,
    StudentRegistrationSerializer,
)


class AdminDashboardAPIView(APIView):
    """Return current database totals for the admin dashboard."""

    permission_classes = [IsAdminRole]

    def get(self, request):
        return Response(
            {
                "departments": Department.objects.count(),
                "courses": Course.objects.count(),
                "devices": Device.objects.filter(
                    status=Device.Status.ACTIVE,
                    classrooms__class_devices__isnull=False,
                )
                .distinct()
                .count(),
                "faculty": Faculty.objects.count(),
            },
            status=status.HTTP_200_OK,
        )


class CreateStudentAPIView(APIView):
    """Create a STUDENT user account."""

    permission_classes = [IsAdminRole]

    def post(self, request):
        serializer = StudentRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student_user = serializer.save()

        return Response(
            ManagedAccountResponseSerializer(student_user).data,
            status=status.HTTP_201_CREATED,
        )


class CreateFacultyAPIView(APIView):
    """Create a FACULTY user account."""

    permission_classes = [IsAdminRole]

    def post(self, request):
        serializer = FacultyRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        faculty_user = serializer.save()

        return Response(
            ManagedAccountResponseSerializer(faculty_user).data,
            status=status.HTTP_201_CREATED,
        )