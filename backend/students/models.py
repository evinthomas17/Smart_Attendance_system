from django.conf import settings
from django.db import models


class Student(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="student_profile",
    )
    student_id = models.CharField(max_length=50, unique=True, db_index=True)
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=30, blank=True)
    class_group = models.ForeignKey(
        "academics.AcademicClass",
        on_delete=models.PROTECT,
        related_name="students",
    )
    enrollment_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["student_id"]
        verbose_name = "Student"
        verbose_name_plural = "Students"

    @property
    def email(self):
        """Expose the authentication email without duplicating it in this table."""
        return self.user.email

    def __str__(self):
        return f"{self.student_id} - {self.full_name}"


class StudentFaceData(models.Model):
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="face_data",
    )
    face_angle = models.CharField(max_length=30)
    face_image = models.FileField(upload_to="student_faces/", blank=True)
    face_embedding = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "student_face_data"
        ordering = ["student_id", "face_angle"]
        verbose_name = "Student Face Data"
        verbose_name_plural = "Student Face Data"

    def __str__(self):
        return f"{self.student.student_id} - {self.face_angle}"