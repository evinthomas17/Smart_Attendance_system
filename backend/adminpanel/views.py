from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsAdminRole
from .serializers import (
    FacultyRegistrationSerializer,
    ManagedAccountResponseSerializer,
    StudentRegistrationSerializer,
)


class AdminDashboardAPIView(APIView):
    """Admin-only dashboard placeholders until the remaining domain apps exist."""

    permission_classes = [IsAdminRole]

    def get(self, request):
        return Response(
            {
                "departments": None,
                "courses": None,
                "devices": None,
                "faculty": None,
            },
            status=status.HTTP_200_OK,
        )


class CreateStudentAPIView(APIView):
    """Create a STUDENT user account. The Student profile app is added later."""

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
    """Create a FACULTY user account. The Faculty profile app is added later."""

    permission_classes = [IsAdminRole]

    def post(self, request):
        serializer = FacultyRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        faculty_user = serializer.save()
        return Response(
            ManagedAccountResponseSerializer(faculty_user).data,
            status=status.HTTP_201_CREATED,
        )
