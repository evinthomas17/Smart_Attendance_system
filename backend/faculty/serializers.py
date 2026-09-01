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
    class_teacher = serializers.SerializerMethodField()

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
            "class_teacher",
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

    def get_class_teacher(self, faculty):
        """Get the class teacher assignment for this faculty, if any."""
        from .models import FacultyClassAssignment
        assignment = faculty.class_teacher_assignment
        if assignment and assignment.is_active:
            return {
                "id": assignment.id,
                "course_name": assignment.academic_class.course.name,
                "semester_name": assignment.academic_class.semester.name,
                "division": assignment.academic_class.division,
                "class_code": assignment.academic_class.class_code,
                "display": f"{assignment.academic_class.course.name} - {assignment.academic_class.semester.name} - {assignment.academic_class.division}",
            }
        return None


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
    is_class_teacher = serializers.BooleanField(write_only=True, required=False, default=False)
    academic_class = serializers.IntegerField(write_only=True, required=False, allow_null=True)

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
            "is_class_teacher",
            "academic_class",
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
        is_class_teacher = attrs.get("is_class_teacher", False)
        academic_class_id = attrs.get("academic_class")
        
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
        
        # Validate class teacher assignment
        if is_class_teacher and not academic_class_id:
            raise serializers.ValidationError({
                "academic_class": "Academic class is required when assigning as class teacher."
            })
        
        if academic_class_id and not is_class_teacher:
            raise serializers.ValidationError({
                "academic_class": "Academic class should not be selected when not a class teacher."
            })
        
        if academic_class_id:
            from academics.models import AcademicClass
            try:
                academic_class = AcademicClass.objects.get(id=academic_class_id, is_active=True)
                # Verify the academic class course is in the faculty's course list
                if academic_class.course_id not in course_ids:
                    raise serializers.ValidationError({
                        "academic_class": "The selected class's course must be in the faculty's teaching courses."
                    })
            except AcademicClass.DoesNotExist:
                raise serializers.ValidationError({
                    "academic_class": "The selected academic class does not exist or is inactive."
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
        is_class_teacher = validated_data.pop("is_class_teacher", False)
        academic_class_id = validated_data.pop("academic_class", None)

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

        # Create class teacher assignment if provided
        if is_class_teacher and academic_class_id:
            from .models import FacultyClassAssignment
            FacultyClassAssignment.objects.create(
                faculty=faculty,
                academic_class_id=academic_class_id,
                is_active=True
            )

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
    is_class_teacher = serializers.BooleanField(write_only=True, required=False)
    academic_class = serializers.IntegerField(write_only=True, required=False, allow_null=True)

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
            "is_class_teacher",
            "academic_class",
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
        is_class_teacher = attrs.get("is_class_teacher")
        academic_class_id = attrs.get("academic_class")
        
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
        
        # Validate class teacher assignment
        if is_class_teacher is not None:
            if is_class_teacher and not academic_class_id:
                raise serializers.ValidationError({
                    "academic_class": "Academic class is required when assigning as class teacher."
                })
            
            if academic_class_id and not is_class_teacher:
                raise serializers.ValidationError({
                    "academic_class": "Academic class should not be selected when not a class teacher."
                })
        
        if academic_class_id:
            from academics.models import AcademicClass
            try:
                academic_class = AcademicClass.objects.get(id=academic_class_id, is_active=True)
                # If updating courses, verify the academic class course is in the new courses
                course_ids = attrs.get("courses")
                if course_ids and academic_class.course_id not in course_ids:
                    raise serializers.ValidationError({
                        "academic_class": "The selected class's course must be in the faculty's teaching courses."
                    })
            except AcademicClass.DoesNotExist:
                raise serializers.ValidationError({
                    "academic_class": "The selected academic class does not exist or is inactive."
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

        # Handle class teacher assignment update
        is_class_teacher = validated_data.pop("is_class_teacher", None)
        academic_class_id = validated_data.pop("academic_class", None)
        
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

        # Update class teacher assignment if provided
        if is_class_teacher is not None:
            from .models import FacultyClassAssignment
            
            if is_class_teacher and academic_class_id:
                # Create or update class teacher assignment
                FacultyClassAssignment.objects.filter(
                    faculty=instance,
                    is_active=True
                ).update(is_active=False)
                
                FacultyClassAssignment.objects.update_or_create(
                    faculty=instance,
                    defaults={
                        "academic_class_id": academic_class_id,
                        "is_active": True
                    }
                )
            elif not is_class_teacher:
                # Remove class teacher assignment
                FacultyClassAssignment.objects.filter(
                    faculty=instance,
                    is_active=True
                ).update(is_active=False)

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


class FacultyClassAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for class teacher assignments."""
    
    course_name = serializers.CharField(source="academic_class.course.name", read_only=True)
    course_code = serializers.CharField(source="academic_class.course.code", read_only=True)
    semester_name = serializers.CharField(source="academic_class.semester.name", read_only=True)
    semester_number = serializers.IntegerField(source="academic_class.semester.semester_number", read_only=True)
    division = serializers.CharField(source="academic_class.division", read_only=True)
    class_code = serializers.CharField(source="academic_class.class_code", read_only=True)
    faculty_name = serializers.CharField(source="faculty.full_name", read_only=True)
    faculty_employee_id = serializers.CharField(source="faculty.employee_id", read_only=True)

    class Meta:
        model = FacultyClassAssignment
        fields = [
            "id",
            "faculty",
            "faculty_name",
            "faculty_employee_id",
            "academic_class",
            "course_name",
            "course_code",
            "semester_name",
            "semester_number",
            "division",
            "class_code",
            "assigned_at",
            "is_active",
        ]
        read_only_fields = ["id", "assigned_at", "faculty_name", "faculty_employee_id"]

    def validate_academic_class(self, value):
        """Validate that the academic class exists and is active."""
        if not value.is_active:
            raise serializers.ValidationError("The selected class is not active.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        """Create or update class teacher assignment."""
        # Ensure only one active class teacher per class
        academic_class = validated_data["academic_class"]
        FacultyClassAssignment.objects.filter(
            academic_class=academic_class,
            is_active=True
        ).update(is_active=False)
        
        return FacultyClassAssignment.objects.create(**validated_data)