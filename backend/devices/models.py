from django.db import models
from django.conf import settings


class Device(models.Model):
    """ESP32/Bluetooth device for attendance tracking."""
    
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        MAINTENANCE = "MAINTENANCE", "Maintenance"
    
    device_id = models.BigAutoField(primary_key=True)
    device_name = models.CharField(max_length=100)
    service_uuid = models.CharField(max_length=50)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["device_name"]
        verbose_name = "Device"
        verbose_name_plural = "Devices"
    
    def __str__(self):
        return f"{self.device_name} ({self.service_uuid})"


class Classroom(models.Model):
    """Physical classroom/room where a device is installed."""
    
    classroom_id = models.BigAutoField(primary_key=True)
    room_no = models.CharField(max_length=50, unique=True)
    device = models.ForeignKey(
        Device,
        on_delete=models.PROTECT,
        related_name="classrooms",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["room_no"]
        verbose_name = "Classroom"
        verbose_name_plural = "Classrooms"
    
    def __str__(self):
        device_name = self.device.device_name if self.device else "No Device"
        return f"{self.room_no} - {device_name}"


class ClassDevice(models.Model):
    """Links an academic class/division to a classroom/device for attendance tracking."""
    
    class_id = models.BigAutoField(primary_key=True)
    department = models.ForeignKey(
        "academics.Department",
        on_delete=models.PROTECT,
        related_name="class_devices",
    )
    course = models.ForeignKey(
        "academics.Course",
        on_delete=models.PROTECT,
        related_name="class_devices",
    )
    semester = models.ForeignKey(
        "academics.Semester",
        on_delete=models.PROTECT,
        related_name="class_devices",
    )
    division = models.ForeignKey(
        "academics.AcademicClass",
        on_delete=models.PROTECT,
        related_name="class_devices",
    )
    class_data = models.CharField(max_length=100, help_text="Class/service data associated with the ESP32/class")
    classroom = models.ForeignKey(
        Classroom,
        on_delete=models.PROTECT,
        related_name="class_devices",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["department__name", "course__name", "semester__semester_number", "division__division"]
        verbose_name = "Class Device"
        verbose_name_plural = "Class Devices"
        constraints = [
            models.UniqueConstraint(
                fields=["department", "course", "semester", "division", "classroom"],
                name="unique_class_device_assignment",
            ),
        ]
    
    def __str__(self):
        return f"{self.division.class_code} - {self.classroom.room_no}"
