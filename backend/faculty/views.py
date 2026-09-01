from django.db.models import Q, Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from adminpanel.permissions import IsAdminRole

from .models import Faculty, FacultyCourse, FacultyClassAssignment
from .serializers import (
    FacultyCourseAssignmentSerializer,
    FacultyClassAssignmentSerializer,
    FacultyListSerializer,
    FacultyRegistrationSerializer,
    FacultySerializer,
    FacultyUpdateSerializer,
)


class FacultyListCreateAPIView(ListCreateAPIView):
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        queryset = (
            Faculty.objects.filter(is_active=True)
            .select_related("user")
            .prefetch_related(
                Prefetch(
                    "course_assignments",
                    queryset=FacultyCourse.objects.filter(is_active=True).select_related("course"),
                    to_attr="active_course_assignments",
                )
            )
        )
        course_id = self.request.query_params.get("course")
        search_query = self.request.query_params.get("search", "").strip()

        if course_id:
            queryset = queryset.filter(course_assignments__course_id=course_id, course_assignments__is_active=True)
        if search_query:
            queryset = queryset.filter(
                Q(full_name__icontains=search_query) | Q(user__email__icontains=search_query)
            )
        return queryset.distinct()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return FacultyRegistrationSerializer
        return FacultyListSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["course_id"] = self.request.query_params.get("course")
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        faculty = serializer.save()
        return Response(FacultySerializer(faculty).data, status=status.HTTP_201_CREATED)


class FacultyDetailAPIView(RetrieveUpdateAPIView):
    permission_classes = [IsAdminRole]
    queryset = Faculty.objects.select_related("user").prefetch_related("course_assignments__course__department")

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return FacultyUpdateSerializer
        return FacultySerializer

    def delete(self, request, *args, **kwargs):
        """Hard delete faculty and their associated user account."""
        faculty = self.get_object()
        user = faculty.user
        faculty.delete()
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FacultyCourseAssignmentsAPIView(APIView):
    """Manage course assignments for a specific faculty member."""
    permission_classes = [IsAdminRole]

    def get(self, request, pk):
        faculty = get_object_or_404(Faculty, pk=pk)
        assignments = faculty.course_assignments.filter(is_active=True).select_related("course__department")
        from .serializers import FacultyCourseSerializer
        serializer = FacultyCourseSerializer(assignments, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        faculty = get_object_or_404(Faculty, pk=pk)
        serializer = FacultyCourseAssignmentSerializer(data=request.data, context={"faculty": faculty})
        serializer.is_valid(raise_exception=True)
        assignment = serializer.save()
        from .serializers import FacultyCourseSerializer
        return Response(FacultyCourseSerializer(assignment).data, status=status.HTTP_201_CREATED)


class FacultyCourseAssignmentDetailAPIView(APIView):
    """Remove a course assignment from a faculty member."""
    permission_classes = [IsAdminRole]

    def delete(self, request, pk, assignment_id):
        faculty = get_object_or_404(Faculty, pk=pk)
        assignment = get_object_or_404(FacultyCourse, pk=assignment_id, faculty=faculty)
        assignment.is_active = False
        assignment.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FacultyClassAssignmentAPIView(APIView):
    """Manage class teacher assignment for a specific faculty member."""
    permission_classes = [IsAdminRole]

    def get(self, request, pk):
        """Get the class teacher assignment for a faculty."""
        faculty = get_object_or_404(Faculty, pk=pk)
        assignment = faculty.class_teacher_assignment
        if assignment and assignment.is_active:
            serializer = FacultyClassAssignmentSerializer(assignment)
            return Response(serializer.data)
        return Response(None, status=status.HTTP_200_OK)

    def post(self, request, pk):
        """Assign or update class teacher assignment."""
        faculty = get_object_or_404(Faculty, pk=pk)
        data = request.data.copy()
        data['faculty'] = faculty.id
        serializer = FacultyClassAssignmentSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        assignment = serializer.save()
        return Response(FacultyClassAssignmentSerializer(assignment).data, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        """Remove class teacher assignment."""
        faculty = get_object_or_404(Faculty, pk=pk)
        assignment = faculty.class_teacher_assignment
        if assignment and assignment.is_active:
            assignment.is_active = False
            assignment.save()
        return Response(status=status.HTTP_204_NO_CONTENT)