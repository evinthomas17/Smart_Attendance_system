from django.db import models
from django.conf import settings


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


class Subject(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=30, unique=True)
    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
        related_name="subjects",
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.PROTECT,
        related_name="subjects",
    )
    credits = models.PositiveSmallIntegerField(default=3)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["course", "semester", "code"],
                name="unique_course_semester_subject_code",
            ),
        ]
        ordering = ["course__name", "semester__semester_number", "name"]
        verbose_name = "Subject"
        verbose_name_plural = "Subjects"

    def clean(self):
        if self.semester_id and self.course_id and self.semester.course_id != self.course_id:
            from django.core.exceptions import ValidationError
            raise ValidationError(
                {"semester": "The selected semester must belong to the selected course."}
            )

    def __str__(self):
        return f"{self.code} - {self.name}"


class Timetable(models.Model):
    """Represents a weekly timetable for an academic class."""

    academic_class = models.ForeignKey(
        AcademicClass,
        on_delete=models.PROTECT,
        related_name="timetables",
    )
    academic_year = models.CharField(max_length=20)
    number_of_periods = models.PositiveSmallIntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["academic_class", "academic_year"],
                name="unique_class_academic_year_timetable",
            ),
        ]
        ordering = ["-created_at"]
        verbose_name = "Timetable"
        verbose_name_plural = "Timetables"

    def __str__(self):
        return f"{self.academic_class.class_code} - {self.academic_year}"


class TimetablePeriod(models.Model):
    """Represents an individual period within a timetable."""

    DAY_CHOICES = [
        ("Monday", "Monday"),
        ("Tuesday", "Tuesday"),
        ("Wednesday", "Wednesday"),
        ("Thursday", "Thursday"),
        ("Friday", "Friday"),
    ]

    timetable = models.ForeignKey(
        Timetable,
        on_delete=models.CASCADE,
        related_name="periods",
    )
    day = models.CharField(max_length=10, choices=DAY_CHOICES)
    period_number = models.PositiveSmallIntegerField()
    subject = models.ForeignKey(
        Subject,
        on_delete=models.PROTECT,
        related_name="timetable_periods",
    )
    faculty = models.ForeignKey(
        "faculty.Faculty",
        on_delete=models.PROTECT,
        related_name="timetable_periods",
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["timetable", "day", "period_number"],
                name="unique_timetable_day_period",
            ),
        ]
        ordering = ["timetable", "day", "period_number"]
        verbose_name = "Timetable Period"
        verbose_name_plural = "Timetable Periods"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError({"end_time": "End time must be after start time."})
        if self.subject_id and self.timetable_id:
            if self.subject.course_id != self.timetable.academic_class.course_id:
                raise ValidationError({"subject": "Subject must belong to the timetable's course."})
            if self.subject.semester_id != self.timetable.academic_class.semester_id:
                raise ValidationError({"subject": "Subject must belong to the timetable's semester."})
        if self.faculty_id and self.timetable_id:
            if not self.faculty.course_assignments.filter(
                course_id=self.timetable.academic_class.course_id, is_active=True
            ).exists():
                raise ValidationError({"faculty": "Faculty must be assigned to the timetable's course."})

    def __str__(self):
        return f"{self.timetable} - {self.day} Period {self.period_number}"