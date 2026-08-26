from django.conf import settings
from django.db import models


class Faculty(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="faculty_profile",
    )
    employee_id = models.CharField(max_length=50, unique=True, db_index=True)
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["employee_id"]
        verbose_name = "Faculty"
        verbose_name_plural = "Faculty"

    @property
    def email(self):
        """Expose the authentication email without duplicating it in this table."""
        return self.user.email

    def __str__(self):
        return f"{self.employee_id} - {self.full_name}"


class FacultyCourse(models.Model):
    """Through model for Faculty-Course many-to-many relationship.
    Allows a faculty to teach multiple courses within the same or different departments.
    """

    faculty = models.ForeignKey(
        Faculty,
        on_delete=models.CASCADE,
        related_name="course_assignments",
    )
    course = models.ForeignKey(
        "academics.Course",
        on_delete=models.CASCADE,
        related_name="faculty_assignments",
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["faculty", "course"],
                name="unique_faculty_course_assignment",
            ),
        ]
        ordering = ["faculty__employee_id", "course__name"]
        verbose_name = "Faculty Course Assignment"
        verbose_name_plural = "Faculty Course Assignments"

    def __str__(self):
        return f"{self.faculty.full_name} - {self.course.name}"