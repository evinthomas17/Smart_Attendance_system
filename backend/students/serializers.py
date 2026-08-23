from django.db import transaction
from rest_framework import serializers

from accounts.models import User
from .models import Student, StudentFaceData


class StudentFaceDataSerializer(serializers.ModelSerializer):
    """Safe metadata representation; embeddings remain internal."""

    class Meta:
        model = StudentFaceData
        fields = ["id", "face_angle", "face_image", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class StudentSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    class_code = serializers.CharField(source="class_group.class_code", read_only=True)
    department = serializers.CharField(
        source="class_group.course.department.name", read_only=True
    )
    course = serializers.CharField(source="class_group.course.name", read_only=True)
    semester = serializers.CharField(source="class_group.semester.name", read_only=True)
    division = serializers.CharField(source="class_group.division", read_only=True)
    face_data_available = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            "id",
            "student_id",
            "full_name",
            "email",
            "phone",
            "class_group",
            "class_code",
            "department",
            "course",
            "semester",
            "division",
            "enrollment_date",
            "is_active",
            "face_data_available",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "email",
            "class_code",
            "department",
            "course",
            "semester",
            "division",
            "face_data_available",
            "created_at",
            "updated_at",
        ]

    def get_face_data_available(self, student):
        return student.face_data.exists()


class StudentRegistrationSerializer(serializers.ModelSerializer):
    """Admin-only input for creating a Student and its authentication account."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Student
        fields = [
            "student_id",
            "full_name",
            "email",
            "password",
            "phone",
            "class_group",
            "enrollment_date",
        ]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        email = validated_data.pop("email")
        password = validated_data.pop("password")
        user = User.objects.create_user(
            email=email,
            password=password,
            role="STUDENT",
        )
        return Student.objects.create(user=user, **validated_data)


class StudentUpdateSerializer(serializers.ModelSerializer):
    """Editable student fields; the linked user's role and password stay protected."""

    email = serializers.EmailField(source="user.email", required=False)

    class Meta:
        model = Student
        fields = [
            "student_id",
            "full_name",
            "email",
            "phone",
            "class_group",
            "enrollment_date",
        ]

    def validate_email(self, value):
        user_id = self.instance.user_id if self.instance else None
        if User.objects.filter(email__iexact=value).exclude(pk=user_id).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        email = user_data.get("email")
        if email:
            instance.user.email = email
            instance.user.save(update_fields=["email"])

        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance