from django.db import transaction
from django.utils import timezone
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from adminpanel.permissions import IsAdminRole

from .models import AcademicClass, Course, Department, Semester, Subject, Timetable, TimetablePeriod
from .serializers import (
    AcademicClassSerializer,
    CourseSerializer,
    DepartmentSerializer,
    SemesterSerializer,
    SubjectSerializer,
    TimetableSerializer,
    TimetableCreateSerializer,
    TimetableListSerializer,
    TimetablePeriodSerializer,
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

    def _generate_unique_subject_code(self, course_id, semester_id, subject_name, index):
        course_prefix = "SUB"
        if course_id:
            course = Course.objects.filter(id=course_id).only("code").first()
            if course and course.code:
                course_prefix = "".join(ch for ch in course.code.upper() if ch.isalpha())[:6] or "SUB"

        semester_number = 0
        if semester_id:
            semester = Semester.objects.filter(id=semester_id).only("semester_number").first()
            if semester:
                semester_number = semester.semester_number

        name_key = "".join(ch for ch in (subject_name or "SUB") if ch.isalnum())[:4].upper() or "SUB"
        base_code = f"{course_prefix}{int(course_id or 0):03d}{int(semester_number):02d}{name_key}"
        candidate = f"{base_code}{index:02d}"

        counter = index + 1
        while Subject.objects.filter(code=candidate).exists():
            candidate = f"{base_code}{counter:02d}"
            counter += 1

        return candidate

    def _prepare_subjects_data(self, subjects_data):
        if isinstance(subjects_data, list):
            prepared = []
            for index, subject in enumerate(subjects_data):
                payload = dict(subject) if isinstance(subject, dict) else {}
                if not payload.get("code"):
                    payload["code"] = self._generate_unique_subject_code(
                        payload.get("course"),
                        payload.get("semester"),
                        payload.get("name", ""),
                        index,
                    )
                prepared.append(payload)
            return prepared

        payload = dict(subjects_data) if isinstance(subjects_data, dict) else {}
        if not payload.get("code"):
            payload["code"] = self._generate_unique_subject_code(
                payload.get("course"),
                payload.get("semester"),
                payload.get("name", ""),
                0,
            )
        return payload

    def create(self, request, *args, **kwargs):
        subjects_data = request.data
        if isinstance(subjects_data, list):
            prepared_data = self._prepare_subjects_data(subjects_data)
            serializer = self.get_serializer(data=prepared_data, many=True)
        else:
            prepared_data = self._prepare_subjects_data(subjects_data)
            serializer = self.get_serializer(data=prepared_data)

        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
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


class TimetableListCreateAPIView(ListCreateAPIView):
    permission_classes = [IsAdminRole]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TimetableCreateSerializer
        return TimetableListSerializer

    def get_queryset(self):
        queryset = Timetable.objects.filter(is_active=True, is_archived=False).select_related(
            "academic_class__course__department", "academic_class__semester"
        )
        academic_class_id = self.request.query_params.get("class_id")
        timetable_type = self.request.query_params.get("type")
        if academic_class_id:
            queryset = queryset.filter(academic_class_id=academic_class_id)
        if timetable_type:
            queryset = queryset.filter(timetable_type=timetable_type)
        return queryset


class TimetableDetailAPIView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request, pk):
        try:
            timetable = Timetable.objects.select_related(
                "academic_class__course__department", "academic_class__semester"
            ).prefetch_related(
                "periods__subject", "periods__faculty__user"
            ).get(pk=pk)
        except Timetable.DoesNotExist:
            return Response({"detail": "Timetable not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            serializer = TimetableSerializer(timetable)
            return Response(serializer.data)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception("Error serializing timetable %s: %s", pk, e)
            return Response(
                {"detail": "Error retrieving timetable data.", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request, pk):
        try:
            timetable = Timetable.objects.select_related(
                "academic_class__course__department", "academic_class__semester"
            ).prefetch_related("periods").get(pk=pk)
        except Timetable.DoesNotExist:
            return Response({"detail": "Timetable not found."}, status=status.HTTP_404_NOT_FOUND)

        if timetable.is_archived:
            return Response({"detail": "Cannot update archived timetable."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TimetableCreateSerializer(timetable, data=request.data, partial=False)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    timetable = serializer.save()
                timetable.refresh_from_db()
                return Response(TimetableSerializer(timetable).data)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.exception("Error updating timetable %s: %s", pk, e)
                return Response(
                    {"detail": "Error updating timetable.", "error": str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        try:
            timetable = Timetable.objects.select_related(
                "academic_class__course__department", "academic_class__semester"
            ).prefetch_related("periods").get(pk=pk)
        except Timetable.DoesNotExist:
            return Response({"detail": "Timetable not found."}, status=status.HTTP_404_NOT_FOUND)

        if timetable.is_archived:
            return Response({"detail": "Cannot update archived timetable."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TimetableCreateSerializer(timetable, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    timetable = serializer.save()
                timetable.refresh_from_db()
                return Response(TimetableSerializer(timetable).data)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.exception("Error patching timetable %s: %s", pk, e)
                return Response(
                    {"detail": "Error updating timetable.", "error": str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            timetable = Timetable.objects.get(pk=pk)
        except Timetable.DoesNotExist:
            return Response({"detail": "Timetable not found."}, status=status.HTTP_404_NOT_FOUND)

        if timetable.is_archived:
            return Response({"detail": "Archived timetables cannot be deleted. Use permanent delete if absolutely necessary."}, status=status.HTTP_400_BAD_REQUEST)

        if timetable.timetable_type == "TEMPORARY" and timetable.valid_until and timetable.valid_until < timezone.now().date():
            return Response({"detail": "Expired temporary timetable should be archived, not deleted."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            timetable.is_active = False
            timetable.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception("Error deleting timetable %s: %s", pk, e)
            return Response(
                {"detail": "Error deleting timetable.", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TimetableArchiveListAPIView(ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = TimetableListSerializer

    def get_queryset(self):
        queryset = Timetable.objects.filter(is_archived=True).select_related(
            "academic_class__course__department", "academic_class__semester"
        )
        academic_class_id = self.request.query_params.get("class_id")
        timetable_type = self.request.query_params.get("type")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if academic_class_id:
            queryset = queryset.filter(academic_class_id=academic_class_id)
        if timetable_type:
            queryset = queryset.filter(timetable_type=timetable_type)
        if date_from:
            queryset = queryset.filter(archived_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(archived_at__lte=date_to)
        return queryset


class AcademicClassSubjectsAPIView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        class_id = request.query_params.get("class_id")
        if not class_id:
            return Response({"detail": "class_id parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            academic_class = AcademicClass.objects.select_related("course", "semester").get(
                id=class_id, is_active=True
            )
        except AcademicClass.DoesNotExist:
            return Response({"detail": "Academic class not found."}, status=status.HTTP_404_NOT_FOUND)

        subjects = Subject.objects.filter(
            course=academic_class.course,
            semester=academic_class.semester,
            is_active=True
        ).order_by("name")

        serializer = SubjectSerializer(subjects, many=True)
        return Response(serializer.data)


class AcademicClassFacultyAPIView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        class_id = request.query_params.get("class_id")
        if not class_id:
            return Response({"detail": "class_id parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            academic_class = AcademicClass.objects.select_related("course").get(
                id=class_id, is_active=True
            )
        except AcademicClass.DoesNotExist:
            return Response({"detail": "Academic class not found."}, status=status.HTTP_404_NOT_FOUND)

        from faculty.models import Faculty, FacultyCourse
        faculty_list = Faculty.objects.filter(
            is_active=True,
            course_assignments__course=academic_class.course,
            course_assignments__is_active=True
        ).select_related("user").distinct().order_by("full_name")

        data = [
            {
                "id": f.id,
                "employee_id": f.employee_id,
                "full_name": f.full_name,
                "email": f.user.email,
            }
            for f in faculty_list
        ]
        return Response(data)