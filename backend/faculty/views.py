from datetime import date, datetime, time
import logging
from django.db.models import Q, Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from adminpanel.permissions import IsAdminRole
from academics.models import AcademicClass, Subject, Timetable, TimetablePeriod
from devices.models import ClassDevice, Classroom

from .models import Faculty, FacultyCourse, FacultyClassAssignment
from .serializers import (
    FacultyCourseAssignmentSerializer,
    FacultyClassAssignmentSerializer,
    FacultyListSerializer,
    FacultyRegistrationSerializer,
    FacultySerializer,
    FacultyUpdateSerializer,
)

logger = logging.getLogger(__name__)


class IsFacultyRole(BasePermission):
    """Allow only authenticated users whose application role is FACULTY."""

    message = "Faculty access is required."

    def has_permission(self, request, view):
        logger.info(f"IsFacultyRole check - user: {request.user}, role: {getattr(request.user, 'role', 'N/A')}, authenticated: {getattr(request.user, 'is_authenticated', 'N/A')}")
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "FACULTY"
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


class FacultyDashboardAPIView(APIView):
    """Return dashboard data for the authenticated faculty user."""

    permission_classes = [IsFacultyRole]

    def get(self, request):
        logger.info(f"FacultyDashboardAPIView called - user: {request.user}, role: {getattr(request.user, 'role', 'N/A')}, authenticated: {getattr(request.user, 'is_authenticated', 'N/A')}")
        # Get the faculty profile for the authenticated user
        try:
            faculty = Faculty.objects.select_related("user").get(user=request.user, is_active=True)
            logger.info(f"Faculty found: {faculty.full_name} (ID: {faculty.id})")
        except Faculty.DoesNotExist:
            logger.warning(f"Faculty profile not found for user: {request.user.email if request.user else 'anonymous'}")
            return Response(
                {"detail": "Faculty profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        today = date.today()
        current_time = datetime.now().time()
        today_day = today.strftime("%A")  # e.g., "Monday"

        # Get all active timetables for classes this faculty teaches
        faculty_course_ids = faculty.course_assignments.filter(is_active=True).values_list("course_id", flat=True)

        # Get active timetables for these courses' classes
        active_timetables = Timetable.objects.filter(
            is_active=True,
            is_archived=False,
            academic_class__course_id__in=faculty_course_ids,
            academic_class__is_active=True,
        ).select_related("academic_class__course", "academic_class__semester")

        # Get today's periods for this faculty
        today_periods = TimetablePeriod.objects.filter(
            timetable__in=active_timetables,
            day=today_day,
            faculty=faculty,
        ).select_related(
            "timetable__academic_class__course",
            "timetable__academic_class__semester",
            "subject",
            "timetable__academic_class",
        ).order_by("start_time")

        # Get classroom/room info for each period via ClassDevice
        class_device_map = {}
        academic_class_ids = set(p.timetable.academic_class_id for p in today_periods)
        if academic_class_ids:
            class_devices = ClassDevice.objects.filter(
                division_id__in=academic_class_ids,
                is_active=True,
            ).select_related("classroom", "division")
            for cd in class_devices:
                class_device_map[cd.division_id] = cd.classroom.room_no if cd.classroom else None

        # Build today's sessions list
        todays_sessions = []
        current_session = None
        upcoming_session = None

        for period in today_periods:
            academic_class = period.timetable.academic_class
            room_no = class_device_map.get(academic_class.id)

            session_data = {
                "id": period.id,
                "time": f"{period.start_time.strftime('%I:%M %p')} - {period.end_time.strftime('%I:%M %p')}",
                "start_time": period.start_time.isoformat(),
                "end_time": period.end_time.isoformat(),
                "class": academic_class.class_code,
                "class_name": f"{academic_class.course.name} - {academic_class.semester.name} - {academic_class.division}",
                "subject": period.subject.name,
                "subject_code": period.subject.code,
                "room": room_no,
                "status": self._get_session_status(period.start_time, period.end_time, current_time),
            }
            todays_sessions.append(session_data)

            # Determine current and upcoming sessions
            session_status = session_data["status"]
            if session_status == "In Progress" and current_session is None:
                current_session = session_data
            elif session_status == "Upcoming" and upcoming_session is None:
                upcoming_session = session_data

        # Get class teacher assignment
        class_teacher_info = None
        try:
            assignment = faculty.class_teacher_assignment
            if assignment and assignment.is_active:
                ac = assignment.academic_class
                class_teacher_info = {
                    "class_code": ac.class_code,
                    "course_name": ac.course.name,
                    "semester_name": ac.semester.name,
                    "division": ac.division,
                    "display": f"{ac.course.name} - {ac.semester.name} - {ac.division}",
                }
        except FacultyClassAssignment.DoesNotExist:
            pass

        # Today's classes count (unique academic classes)
        todays_classes_count = len(set(p.timetable.academic_class_id for p in today_periods))

        # Quick attendance status - placeholder since attendance models not implemented
        attendance_stats = {
            "present": 0,
            "late": 0,
            "absent": 0,
            "ad": 0,
        }

        return Response(
            {
                "faculty": {
                    "id": faculty.id,
                    "employee_id": faculty.employee_id,
                    "full_name": faculty.full_name,
                    "email": faculty.user.email,
                },
                "todays_classes_count": todays_classes_count,
                "current_session": current_session,
                "upcoming_session": upcoming_session,
                "class_teacher": class_teacher_info,
                "todays_sessions": todays_sessions,
                "attendance_stats": attendance_stats,
                "date": today.isoformat(),
            },
            status=status.HTTP_200_OK,
        )

    def _get_session_status(self, start_time, end_time, current_time):
        """Determine session status based on current time."""
        if current_time < start_time:
            return "Upcoming"
        elif start_time <= current_time <= end_time:
            return "In Progress"
        else:
            return "Completed"