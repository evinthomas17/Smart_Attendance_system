from django.db import transaction
from rest_framework import serializers

from .models import AcademicClass, Course, Department, Semester, Subject, Timetable, TimetablePeriod
from faculty.models import Faculty


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name", "code", "description", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class CourseSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    department_code = serializers.CharField(source="department.code", read_only=True)

    class Meta:
        model = Course
        fields = [
            "id",
            "name",
            "code",
            "department",
            "department_name",
            "department_code",
            "duration_semesters",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SemesterSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source="course.name", read_only=True)
    course_code = serializers.CharField(source="course.code", read_only=True)

    class Meta:
        model = Semester
        fields = [
            "id",
            "course",
            "course_name",
            "course_code",
            "semester_number",
            "name",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AcademicClassSerializer(serializers.ModelSerializer):
    department = serializers.CharField(source="course.department.name", read_only=True)
    department_code = serializers.CharField(source="course.department.code", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    course_code = serializers.CharField(source="course.code", read_only=True)
    semester_name = serializers.CharField(source="semester.name", read_only=True)
    semester_number = serializers.IntegerField(source="semester.semester_number", read_only=True)

    class Meta:
        model = AcademicClass
        fields = [
            "id",
            "course",
            "semester",
            "department",
            "department_code",
            "course_name",
            "course_code",
            "semester_name",
            "semester_number",
            "division",
            "class_code",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SubjectSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source="course.name", read_only=True)
    course_code = serializers.CharField(source="course.code", read_only=True)
    semester_name = serializers.CharField(source="semester.name", read_only=True)
    semester_number = serializers.IntegerField(source="semester.semester_number", read_only=True)
    department_name = serializers.CharField(source="course.department.name", read_only=True)
    department_code = serializers.CharField(source="course.department.code", read_only=True)

    class Meta:
        model = Subject
        fields = [
            "id",
            "name",
            "code",
            "course",
            "course_name",
            "course_code",
            "semester",
            "semester_name",
            "semester_number",
            "department_name",
            "department_code",
            "credits",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        course = attrs.get("course")
        semester = attrs.get("semester")
        if course and semester and semester.course_id != course.id:
            raise serializers.ValidationError(
                {"semester": "The selected semester must belong to the selected course."}
            )
        return attrs


class TimetablePeriodSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    subject_code = serializers.CharField(source="subject.code", read_only=True)
    faculty_name = serializers.CharField(source="faculty.full_name", read_only=True)
    faculty_employee_id = serializers.CharField(source="faculty.employee_id", read_only=True)

    class Meta:
        model = TimetablePeriod
        fields = [
            "id",
            "day",
            "period_number",
            "subject",
            "subject_name",
            "subject_code",
            "faculty",
            "faculty_name",
            "faculty_employee_id",
            "start_time",
            "end_time",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TimetableSerializer(serializers.ModelSerializer):
    academic_class_code = serializers.CharField(source="academic_class.class_code", read_only=True)
    academic_class_id = serializers.IntegerField(source="academic_class.id", read_only=True)
    department_name = serializers.CharField(source="academic_class.course.department.name", read_only=True)
    course_name = serializers.CharField(source="academic_class.course.name", read_only=True)
    semester_name = serializers.CharField(source="academic_class.semester.name", read_only=True)
    division = serializers.CharField(source="academic_class.division", read_only=True)
    periods = TimetablePeriodSerializer(many=True, read_only=True)

    class Meta:
        model = Timetable
        fields = [
            "id",
            "academic_class",
            "academic_class_id",
            "academic_class_code",
            "department_name",
            "course_name",
            "semester_name",
            "division",
            "academic_year",
            "number_of_periods",
            "is_active",
            "periods",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TimetableCreateSerializer(serializers.ModelSerializer):
    periods = TimetablePeriodSerializer(many=True, write_only=True)
    academic_class = serializers.IntegerField(write_only=True)

    class Meta:
        model = Timetable
        fields = [
            "id",
            "academic_class",
            "academic_year",
            "number_of_periods",
            "periods",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        periods_data = attrs.get("periods", [])
        number_of_periods = attrs.get("number_of_periods")
        academic_class_id = attrs.get("academic_class")

        if not academic_class_id:
            raise serializers.ValidationError({"academic_class": "Academic class is required."})

        try:
            academic_class = AcademicClass.objects.get(id=academic_class_id, is_active=True)
        except AcademicClass.DoesNotExist:
            raise serializers.ValidationError({"academic_class": "Invalid academic class."})

        if Timetable.objects.filter(academic_class=academic_class, academic_year=attrs.get("academic_year"), is_active=True).exists():
            raise serializers.ValidationError({"academic_class": "A timetable already exists for this class and academic year."})

        if number_of_periods and number_of_periods < 1:
            raise serializers.ValidationError({"number_of_periods": "Number of periods must be at least 1."})

        if not periods_data:
            raise serializers.ValidationError({"periods": "At least one period is required."})

        days_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        expected_periods = number_of_periods * len(days_order)
        if len(periods_data) != expected_periods:
            raise serializers.ValidationError({
                "periods": f"Expected {expected_periods} periods ({number_of_periods} periods x 5 days), got {len(periods_data)}."
            })

        for period_data in periods_data:
            subject = period_data.get("subject")
            faculty = period_data.get("faculty")
            day = period_data.get("day")
            period_number = period_data.get("period_number")
            start_time = period_data.get("start_time")
            end_time = period_data.get("end_time")

            if not subject:
                raise serializers.ValidationError({"periods": "Subject is required for all periods."})
            if not faculty:
                raise serializers.ValidationError({"periods": "Faculty is required for all periods."})
            if not day:
                raise serializers.ValidationError({"periods": "Day is required for all periods."})
            if not period_number:
                raise serializers.ValidationError({"periods": "Period number is required for all periods."})
            if not start_time:
                raise serializers.ValidationError({"periods": "Start time is required for all periods."})
            if not end_time:
                raise serializers.ValidationError({"periods": "End time is required for all periods."})

            if start_time and end_time and start_time >= end_time:
                raise serializers.ValidationError({"periods": "End time must be after start time for all periods."})

            if isinstance(subject, Subject):
                subject_id = subject.id
            else:
                subject_id = subject

            if isinstance(faculty, Faculty):
                faculty_id = faculty.id
            else:
                faculty_id = faculty

            try:
                subject_obj = Subject.objects.get(id=subject_id, is_active=True)
                if subject_obj.course_id != academic_class.course_id or subject_obj.semester_id != academic_class.semester_id:
                    raise serializers.ValidationError({"periods": f"Subject {subject_obj.name} does not belong to the selected course/semester."})
            except Subject.DoesNotExist:
                raise serializers.ValidationError({"periods": f"Subject with id {subject_id} does not exist."})

            try:
                faculty_obj = Faculty.objects.get(id=faculty_id, is_active=True)
                if not faculty_obj.course_assignments.filter(course_id=academic_class.course_id, is_active=True).exists():
                    raise serializers.ValidationError({"periods": f"Faculty {faculty_obj.full_name} is not assigned to the selected course."})
            except Faculty.DoesNotExist:
                raise serializers.ValidationError({"periods": f"Faculty with id {faculty_id} does not exist."})

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        periods_data = validated_data.pop("periods")
        academic_class_id = validated_data.pop("academic_class")
        academic_class = AcademicClass.objects.get(id=academic_class_id)

        timetable = Timetable.objects.create(academic_class=academic_class, **validated_data)

        for period_data in periods_data:
            TimetablePeriod.objects.create(timetable=timetable, **period_data)

        return timetable


class TimetableListSerializer(serializers.ModelSerializer):
    academic_class_code = serializers.CharField(source="academic_class.class_code", read_only=True)
    academic_class_id = serializers.IntegerField(source="academic_class.id", read_only=True)
    department_name = serializers.CharField(source="academic_class.course.department.name", read_only=True)
    course_name = serializers.CharField(source="academic_class.course.name", read_only=True)
    semester_name = serializers.CharField(source="academic_class.semester.name", read_only=True)
    division = serializers.CharField(source="academic_class.division", read_only=True)
    periods_count = serializers.IntegerField(source="periods.count", read_only=True)

    class Meta:
        model = Timetable
        fields = [
            "id",
            "academic_class",
            "academic_class_id",
            "academic_class_code",
            "department_name",
            "course_name",
            "semester_name",
            "division",
            "academic_year",
            "number_of_periods",
            "is_active",
            "periods_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]