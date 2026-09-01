from django.db import transaction
from rest_framework import status
from rest_framework.generics import CreateAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response

from adminpanel.permissions import IsAdminRole

from .models import ClassDevice, Classroom, Device
from .serializers import (
    ClassDeviceSerializer,
    ClassroomSerializer,
    DeviceSerializer,
    DeviceRegistrationSerializer,
)


class DeviceListCreateAPIView(ListCreateAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = DeviceSerializer

    def get_queryset(self):
        queryset = Device.objects.filter(status=Device.Status.ACTIVE).order_by("device_name")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


class DeviceRetrieveUpdateDestroyAPIView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = DeviceSerializer
    lookup_field = "device_id"

    def get_queryset(self):
        return Device.objects.filter(status=Device.Status.ACTIVE)


class DeviceRegistrationAPIView(CreateAPIView):
    """Atomically register an ESP32 and its classroom/class assignment."""

    permission_classes = [IsAdminRole]
    serializer_class = DeviceRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        class_device = serializer.save()
        return Response(ClassDeviceSerializer(class_device).data, status=status.HTTP_201_CREATED)


class ClassroomListCreateAPIView(ListCreateAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = ClassroomSerializer

    def get_queryset(self):
        queryset = Classroom.objects.select_related("device").order_by("room_no")
        
        # Filter by academic combination through ClassDevice relationship
        department_id = self.request.query_params.get("department")
        course_id = self.request.query_params.get("course")
        semester_id = self.request.query_params.get("semester")
        division_id = self.request.query_params.get("division")
        device_id = self.request.query_params.get("device")
        available_only = self.request.query_params.get("available")
        
        # Filter classrooms that are linked to ClassDevice with the specified academic combination
        if any([department_id, course_id, semester_id, division_id]):
            # Get classrooms that are linked to ClassDevice with the specified academic combination
            classdevice_filters = {}
            if department_id:
                classdevice_filters["department_id"] = department_id
            if course_id:
                classdevice_filters["course_id"] = course_id
            if semester_id:
                classdevice_filters["semester_id"] = semester_id
            if division_id:
                classdevice_filters["division_id"] = division_id
            
            # Get classroom IDs that match the academic combination
            assigned_classroom_ids = ClassDevice.objects.filter(**classdevice_filters).values_list("classroom_id", flat=True)
            
            # Also include classrooms that are NOT assigned to any ClassDevice (available rooms)
            unassigned_classroom_ids = Classroom.objects.exclude(
                class_devices__isnull=False
            ).values_list("classroom_id", flat=True)
            
            # Combine: classrooms assigned to the academic combination OR unassigned classrooms
            valid_classroom_ids = set(list(assigned_classroom_ids) + list(unassigned_classroom_ids))
            queryset = queryset.filter(classroom_id__in=valid_classroom_ids)
        
        if device_id:
            queryset = queryset.filter(device_id=device_id)
        if available_only == "true":
            queryset = queryset.filter(device__isnull=True)
            
        return queryset


class ClassroomRetrieveUpdateDestroyAPIView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = ClassroomSerializer
    lookup_field = "classroom_id"

    def get_queryset(self):
        return Classroom.objects.select_related("device")


class ClassDeviceListCreateAPIView(ListCreateAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = ClassDeviceSerializer

    def get_queryset(self):
        queryset = ClassDevice.objects.select_related(
            "department",
            "course",
            "semester",
            "division",
            "classroom__device",
        ).order_by("department__name", "course__name", "semester__semester_number", "division__division")

        department_id = self.request.query_params.get("department")
        course_id = self.request.query_params.get("course")
        semester_id = self.request.query_params.get("semester")
        division_id = self.request.query_params.get("division")
        classroom_id = self.request.query_params.get("classroom")
        device_id = self.request.query_params.get("device")
        registered_only = self.request.query_params.get("registered")

        if department_id:
            queryset = queryset.filter(department_id=department_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if semester_id:
            queryset = queryset.filter(semester_id=semester_id)
        if division_id:
            queryset = queryset.filter(division_id=division_id)
        if classroom_id:
            queryset = queryset.filter(classroom_id=classroom_id)
        if device_id:
            queryset = queryset.filter(classroom__device_id=device_id)
        if registered_only == "true":
            queryset = queryset.filter(classroom__device__isnull=False)
            
        return queryset


class ClassDeviceRetrieveUpdateDestroyAPIView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = ClassDeviceSerializer
    lookup_field = "class_id"

    def get_queryset(self):
        return ClassDevice.objects.select_related(
            "department",
            "course",
            "semester",
            "division",
            "classroom__device",
        )

    def update(self, request, *args, **kwargs):
        class_device = self.get_object()
        old_classroom = class_device.classroom
        device = old_classroom.device  # Device from the old classroom

        # Perform the ClassDevice update
        response = super().update(request, *args, **kwargs)

        # Sync Classroom.device references
        class_device.refresh_from_db()
        new_classroom = class_device.classroom

        with transaction.atomic():
            # Clear device from old classroom if no other ClassDevices reference it
            if old_classroom != new_classroom:
                if not old_classroom.class_devices.exists():
                    old_classroom.device = None
                    old_classroom.save(update_fields=["device", "updated_at"])

                # Set device on new classroom
                if device:
                    new_classroom.device = device
                    new_classroom.save(update_fields=["device", "updated_at"])

        return response

    def destroy(self, request, *args, **kwargs):
        class_device = self.get_object()
        classroom = class_device.classroom
        device = classroom.device

        with transaction.atomic():
            class_device_id = class_device.class_id
            class_device.delete()

            if not classroom.class_devices.exists():
                classroom.device = None
                classroom.save(update_fields=["device", "updated_at"])

                if device and not device.classrooms.exists():
                    device.delete()

        return Response(
            {"detail": "Device assignment deleted successfully.", "class_device_id": class_device_id},
            status=status.HTTP_200_OK,
        )
