from rest_framework import serializers

from .models import AcademicClass, Course, Department, Semester, Subject


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