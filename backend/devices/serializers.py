from django.db import transaction
from rest_framework import serializers

from academics.models import AcademicClass, Course, Department, Semester
from .models import ClassDevice, Classroom, Device


class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = [
            "device_id",
            "device_name",
            "service_uuid",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["device_id", "created_at", "updated_at"]


class ClassroomSerializer(serializers.ModelSerializer):
    device_name = serializers.SerializerMethodField()
    device_service_uuid = serializers.SerializerMethodField()
    device_status = serializers.SerializerMethodField()

    class Meta:
        model = Classroom
        fields = [
            "classroom_id",
            "room_no",
            "device",
            "device_name",
            "device_service_uuid",
            "device_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["classroom_id", "created_at", "updated_at"]

    def get_device_name(self, obj):
        return obj.device.device_name if obj.device else None

    def get_device_service_uuid(self, obj):
        return obj.device.service_uuid if obj.device else None

    def get_device_status(self, obj):
        return obj.device.status if obj.device else None


class ClassDeviceSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    department_code = serializers.CharField(source="department.code", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    course_code = serializers.CharField(source="course.code", read_only=True)
    semester_name = serializers.CharField(source="semester.name", read_only=True)
    semester_number = serializers.IntegerField(source="semester.semester_number", read_only=True)
    division_name = serializers.CharField(source="division.division", read_only=True)
    division_code = serializers.CharField(source="division.class_code", read_only=True)
    classroom_room_no = serializers.CharField(source="classroom.room_no", read_only=True)
    classroom_id = serializers.IntegerField(source="classroom.id", read_only=True)
    device_name = serializers.SerializerMethodField()
    device_service_uuid = serializers.SerializerMethodField()
    device_status = serializers.SerializerMethodField()

    class Meta:
        model = ClassDevice
        fields = [
            "class_id",
            "department",
            "department_name",
            "department_code",
            "course",
            "course_name",
            "course_code",
            "semester",
            "semester_name",
            "semester_number",
            "division",
            "division_name",
            "division_code",
            "class_data",
            "classroom",
            "classroom_room_no",
            "classroom_id",
            "device_name",
            "device_service_uuid",
            "device_status",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["class_id", "created_at", "updated_at"]

    def get_device_name(self, obj):
        if obj.classroom and obj.classroom.device:
            return obj.classroom.device.device_name
        return None

    def get_device_service_uuid(self, obj):
        if obj.classroom and obj.classroom.device:
            return obj.classroom.device.service_uuid
        return None

    def get_device_status(self, obj):
        if obj.classroom and obj.classroom.device:
            return obj.classroom.device.status
        return None


class DeviceRegistrationSerializer(serializers.Serializer):
    """Create a device and its classroom/class assignment as one operation."""

    device_name = serializers.CharField(max_length=100)
    service_uuid = serializers.CharField(max_length=50)
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.filter(is_active=True))
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.filter(is_active=True))
    semester = serializers.PrimaryKeyRelatedField(queryset=Semester.objects.filter(is_active=True))
    division = serializers.PrimaryKeyRelatedField(queryset=AcademicClass.objects.filter(is_active=True))
    classroom = serializers.PrimaryKeyRelatedField(queryset=Classroom.objects.all())
    class_data = serializers.CharField(max_length=100)

    def validate(self, attrs):
        department, course = attrs["department"], attrs["course"]
        semester, division, classroom = attrs["semester"], attrs["division"], attrs["classroom"]
        errors = {}
        if course.department_id != department.id:
            errors["course"] = "The selected course does not belong to this department."
        if semester.course_id != course.id:
            errors["semester"] = "The selected semester does not belong to this course."
        if division.course_id != course.id or division.semester_id != semester.id:
            errors["division"] = "The selected division does not belong to this course and semester."
        if classroom.device_id:
            errors["classroom"] = "This room already has a registered device."
        if ClassDevice.objects.filter(department=department, course=course, semester=semester, division=division, classroom=classroom).exists():
            errors["classroom"] = "This academic class is already assigned to the selected room."
        if errors:
            raise serializers.ValidationError(errors)
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        classroom = validated_data.pop("classroom")
        class_data = validated_data.pop("class_data")
        department = validated_data.pop("department")
        course = validated_data.pop("course")
        semester = validated_data.pop("semester")
        division = validated_data.pop("division")
        classroom = Classroom.objects.select_for_update().get(pk=classroom.pk)
        if classroom.device_id:
            raise serializers.ValidationError({"classroom": "This room already has a registered device."})
        device = Device.objects.create(**validated_data)
        classroom.device = device
        classroom.save(update_fields=["device", "updated_at"])
        return ClassDevice.objects.create(
            department=department, course=course, semester=semester, division=division,
            classroom=classroom, class_data=class_data, is_active=True,
        )
