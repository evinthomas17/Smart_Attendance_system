from django.db import models


class Department(models.Model):
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Department"
        verbose_name_plural = "Departments"

    def __str__(self):
        return f"{self.name} ({self.code})"


class Course(models.Model):
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=20, unique=True)
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name="courses",
    )
    duration_semesters = models.PositiveSmallIntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Course"
        verbose_name_plural = "Courses"

    def __str__(self):
        return self.name


class Semester(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
        related_name="semesters",
    )
    semester_number = models.PositiveSmallIntegerField()
    name = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["course", "semester_number"],
                name="unique_course_semester_number",
            ),
        ]
        ordering = ["course__name", "semester_number"]
        verbose_name = "Semester"
        verbose_name_plural = "Semesters"

    def __str__(self):
        return f"{self.course.code} - {self.name}"


class AcademicClass(models.Model):
    """A division within one course semester, such as MCA-S1-A."""

    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
        related_name="classes",
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.PROTECT,
        related_name="classes",
    )
    division = models.CharField(max_length=20)
    class_code = models.CharField(max_length=50, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["course", "semester", "division"],
                name="unique_course_semester_division",
            ),
        ]
        ordering = ["class_code"]
        verbose_name = "Academic Class"
        verbose_name_plural = "Academic Classes"

    def clean(self):
        if self.semester_id and self.course_id and self.semester.course_id != self.course_id:
            from django.core.exceptions import ValidationError
            raise ValidationError(
                {"semester": "The selected semester must belong to the selected course."}
            )

    def __str__(self):
        return self.class_code