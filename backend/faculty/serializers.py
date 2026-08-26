from django.db import transaction
from rest_framework import serializers

from accounts.models import User
from academics.models import Course, Department
from .models import Faculty, FacultyCourse


class FacultyCourseSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source="course.name", read_only=True)
    course_code = serializers.CharField(source="course.code", read_only=True)
    department_name = serializers.CharField(source="course.department.name", read_only=True)
    department_code = serializers.CharField(source="course.department.code", read_only=True)

    class Meta:
        model = FacultyCourse
        fields = [
            "id",
            "course",
            "course_name",
            "course_code",
            "department_name",
            "department_code",
            "assigned_at",
            "is_active",
        ]
        read_only_fields = ["id", "assigned_at"]


class FacultySerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    courses = FacultyCourseSerializer(source="course_assignments", many=True, read_only=True)

    class Meta:
        model = Faculty
        fields = [
            "id",
            "employee_id",
            "full_name",
            "email",
            "phone",
            "is_active",
            "courses",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "email", "created_at", "updated_at"]


class FacultyListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for faculty list view."""
    email = serializers.EmailField(source="user.email", read_only=True)
    department = serializers.SerializerMethodField()
    course = serializers.SerializerMethodField()
    teaching_courses = serializers.SerializerMethodField()

    class Meta:
        model = Faculty
        fields = [
            "id",
            "employee_id",
            "full_name",
            "email",
            "phone",
            "department",
            "course",
            "teaching_courses",
        ]
        read_only_fields = fields

    def get_department(self, faculty):
        """Get the department name for the current course context."""
        course_id = self.context.get("course_id")
        if course_id:
            assignment = faculty.course_assignments.filter(course_id=course_id, is_active=True).first()
            if assignment:
                return assignment.course.department.name
        # Fallback to first active assignment
        assignment = faculty.course_assignments.filter(is_active=True).first()
        return assignment.course.department.name if assignment else None

    def get_course(self, faculty):
        """Get the course name for the current course context."""
        course_id = self.context.get("course_id")
        if course_id:
            assignment = faculty.course_assignments.filter(course_id=course_id, is_active=True).first()
            if assignment:
                return assignment.course.name
        assignment = faculty.course_assignments.filter(is_active=True).first()
        return assignment.course.name if assignment else None

    def get_teaching_courses(self, faculty):
        """Get all teaching courses for this faculty."""
        # Use prefetched active_course_assignments if available, otherwise query
        assignments = getattr(faculty, "active_course_assignments", None)
        if assignments is None:
            assignments = faculty.course_assignments.filter(is_active=True).select_related("course")
        return [
            {
                "id": assignment.course.id,
                "name": assignment.course.name,
                "code": assignment.course.code,
                "department_id": assignment.course.department_id,
            }
            for assignment in assignments
        ]


class FacultyRegistrationSerializer(serializers.ModelSerializer):
    """Admin-only input for creating a Faculty and its authentication account."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    phone = serializers.CharField(max_length=15)
    department = serializers.IntegerField(write_only=True, required=True, help_text="Department ID")
    courses = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=True,
        help_text="List of course IDs the faculty will teach"
    )

    class Meta:
        model = Faculty
        fields = [
            "employee_id",
            "full_name",
            "email",
            "password",
            "phone",
            "department",
            "courses",
        ]
        extra_kwargs = {
            "employee_id": {"required": False},
        }

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_employee_id(self, value):
        if value and Faculty.objects.filter(employee_id__iexact=value).exists():
            raise serializers.ValidationError("A faculty with this Employee ID already exists.")
        return value

    def validate_courses(self, value):
        if not value:
            raise serializers.ValidationError("At least one course must be selected.")
        # Verify all courses exist and are active
        existing_courses = Course.objects.filter(id__in=value, is_active=True)
        if existing_courses.count() != len(value):
            raise serializers.ValidationError("One or more selected courses are invalid.")
        return value

    def validate(self, attrs):
        # Cross-field validation: ensure courses belong to the department
        department_id = attrs.get("department")
        course_ids = attrs.get("courses", [])
        
        if department_id and course_ids:
            # Check that all courses belong to the specified department
            dept_courses = Course.objects.filter(
                id__in=course_ids, 
                department_id=department_id, 
                is_active=True
            )
            if dept_courses.count() != len(course_ids):
                raise serializers.ValidationError({
                    "courses": "One or more selected courses do not belong to the specified department."
                })
        return attrs

    def validate_phone(self, value):
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("Phone number must be exactly 10 digits.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        email = validated_data.pop("email")
        password = validated_data.pop("password")
        course_ids = validated_data.pop("courses")

        user = User.objects.create_user(
            email=email,
            password=password,
            role="FACULTY",
        )

        # Remove department from validated_data as Faculty model doesn't have department field
        validated_data.pop("department", None)

        # Auto-generate employee_id if not provided
        employee_id = validated_data.get("employee_id")
        if not employee_id:
            # Generate employee_id based on the next available number
            last_faculty = Faculty.objects.order_by("-id").first()
            next_num = (last_faculty.id + 1) if last_faculty else 1
            employee_id = f"F{next_num:03d}"
            validated_data["employee_id"] = employee_id

        faculty = Faculty.objects.create(user=user, **validated_data)

        # Create course assignments
        for course_id in course_ids:
            FacultyCourse.objects.create(faculty=faculty, course_id=course_id)

        return faculty


class FacultyUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a Faculty (partial updates supported)."""

    email = serializers.EmailField(required=False)
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, min_length=6, allow_blank=True)
    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    courses = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of course IDs the faculty will teach"
    )

    class Meta:
        model = Faculty
        fields = [
            "employee_id",
            "full_name",
            "email",
            "phone",
            "password",
            "confirm_password",
            "courses",
        ]
        extra_kwargs = {
            "employee_id": {"required": False, "read_only": True},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # self.instance is already set by DRF's base serializer

    def validate_email(self, value):
        if value and self.instance:
            # Allow the same email as the current faculty
            if User.objects.filter(email__iexact=value).exclude(pk=self.instance.user.pk).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        elif value and not self.instance:
            if User.objects.filter(email__iexact=value).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_courses(self, value):
        if value is not None:
            if not value:
                raise serializers.ValidationError("At least one course must be selected.")
            # Verify all courses exist and are active
            existing_courses = Course.objects.filter(id__in=value, is_active=True)
            if existing_courses.count() != len(value):
                raise serializers.ValidationError("One or more selected courses are invalid.")
        return value

    def validate(self, attrs):
        password = attrs.get("password", "")
        confirm_password = attrs.get("confirm_password", "")
        
        # Password validation - only if password is provided
        if password or confirm_password:
            if not password:
                raise serializers.ValidationError({"password": "Password is required when changing password."})
            if password and len(password) < 6:
                raise serializers.ValidationError({"password": "Password must be at least 6 characters."})
            if password != confirm_password:
                raise serializers.ValidationError({"confirm_password": "Password and Confirm Password do not match."})
        
        # Cross-field validation: ensure courses belong to the department
        # Get the faculty's current department from their first active course assignment
        if self.instance:
            current_assignment = self.instance.course_assignments.filter(is_active=True).first()
            if current_assignment:
                department_id = current_assignment.course.department_id
                course_ids = attrs.get("courses", [])
                
                if course_ids:
                    dept_courses = Course.objects.filter(
                        id__in=course_ids, 
                        department_id=department_id, 
                        is_active=True
                    )
                    if dept_courses.count() != len(course_ids):
                        raise serializers.ValidationError({
                            "courses": "One or more selected courses do not belong to the faculty's department."
                        })
        return attrs

    def validate_phone(self, value):
        if value and (not value.isdigit() or len(value) != 10):
            raise serializers.ValidationError("Phone number must be exactly 10 digits.")
        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        # Handle email update (on User model)
        email = validated_data.pop("email", None)
        if email is not None:
            instance.user.email = email
            instance.user.save()

        # Handle password update
        password = validated_data.pop("password", "")
        validated_data.pop("confirm_password", None)
        
        if password:
            instance.user.set_password(password)
            instance.user.save()

        # Handle course assignments update
        course_ids = validated_data.pop("courses", None)
        
        # Update faculty fields (full_name, phone, etc.)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update course assignments if provided
        if course_ids is not None:
            # Deactivate all current assignments
            instance.course_assignments.update(is_active=False)
            # Create new assignments
            for course_id in course_ids:
                FacultyCourse.objects.update_or_create(
                    faculty=instance,
                    course_id=course_id,
                    defaults={"is_active": True}
                )

        return instance


class FacultyCourseAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for assigning courses to faculty."""

    class Meta:
        model = FacultyCourse
        fields = ["course"]

    def validate_course(self, value):
        faculty = self.context.get("faculty")
        if faculty and FacultyCourse.objects.filter(faculty=faculty, course=value, is_active=True).exists():
            raise serializers.ValidationError("This faculty is already assigned to this course.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        faculty = self.context["faculty"]
        return FacultyCourse.objects.create(faculty=faculty, **validated_data)