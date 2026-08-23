# Generated migration to populate academic master data

from django.db import migrations


def populate_academic_data(apps, schema_editor):
    Department = apps.get_model('academics', 'Department')
    Course = apps.get_model('academics', 'Course')
    Semester = apps.get_model('academics', 'Semester')
    AcademicClass = apps.get_model('academics', 'AcademicClass')

    # ============================================================
    # DEPARTMENTS
    # ============================================================
    dept_ca, _ = Department.objects.get_or_create(
        code='CA',
        defaults={'name': 'Computer Application', 'description': 'Computer Application Department', 'is_active': True}
    )
    dept_ba, _ = Department.objects.get_or_create(
        code='BA',
        defaults={'name': 'Business Administration', 'description': 'Business Administration Department', 'is_active': True}
    )

    # ============================================================
    # COURSES
    # ============================================================
    course_mca, _ = Course.objects.get_or_create(
        code='MCA',
        defaults={'name': 'MCA', 'department': dept_ca, 'duration_semesters': 4, 'is_active': True}
    )
    course_bca, _ = Course.objects.get_or_create(
        code='BCA',
        defaults={'name': 'BCA', 'department': dept_ca, 'duration_semesters': 8, 'is_active': True}
    )
    course_mba, _ = Course.objects.get_or_create(
        code='MBA',
        defaults={'name': 'MBA', 'department': dept_ba, 'duration_semesters': 4, 'is_active': True}
    )
    course_bba, _ = Course.objects.get_or_create(
        code='BBA',
        defaults={'name': 'BBA', 'department': dept_ba, 'duration_semesters': 8, 'is_active': True}
    )

    # ============================================================
    # SEMESTERS
    # ============================================================
    # MCA - 4 semesters
    mca_semesters = []
    for i in range(1, 5):
        sem, _ = Semester.objects.get_or_create(
            course=course_mca,
            semester_number=i,
            defaults={'name': f'Semester {i}', 'is_active': True}
        )
        mca_semesters.append(sem)

    # MBA - 4 semesters
    mba_semesters = []
    for i in range(1, 5):
        sem, _ = Semester.objects.get_or_create(
            course=course_mba,
            semester_number=i,
            defaults={'name': f'Semester {i}', 'is_active': True}
        )
        mba_semesters.append(sem)

    # BCA - 8 semesters
    bca_semesters = []
    for i in range(1, 9):
        sem, _ = Semester.objects.get_or_create(
            course=course_bca,
            semester_number=i,
            defaults={'name': f'Semester {i}', 'is_active': True}
        )
        bca_semesters.append(sem)

    # BBA - 8 semesters
    bba_semesters = []
    for i in range(1, 9):
        sem, _ = Semester.objects.get_or_create(
            course=course_bba,
            semester_number=i,
            defaults={'name': f'Semester {i}', 'is_active': True}
        )
        bba_semesters.append(sem)

    # ============================================================
    # ACADEMIC CLASSES (Divisions)
    # ============================================================
    # MCA - Divisions A, B for all 4 semesters
    mca_divisions = ['A', 'B']
    for sem in mca_semesters:
        for div in mca_divisions:
            class_code = f"MCA-S{sem.semester_number}-{div}"
            AcademicClass.objects.get_or_create(
                course=course_mca,
                semester=sem,
                division=div,
                defaults={'class_code': class_code, 'is_active': True}
            )

    # BCA - Divisions A, B for all 8 semesters
    bca_divisions = ['A', 'B']
    for sem in bca_semesters:
        for div in bca_divisions:
            class_code = f"BCA-S{sem.semester_number}-{div}"
            AcademicClass.objects.get_or_create(
                course=course_bca,
                semester=sem,
                division=div,
                defaults={'class_code': class_code, 'is_active': True}
            )

    # MBA - Division A for all 4 semesters
    mba_divisions = ['A']
    for sem in mba_semesters:
        for div in mba_divisions:
            class_code = f"MBA-S{sem.semester_number}-{div}"
            AcademicClass.objects.get_or_create(
                course=course_mba,
                semester=sem,
                division=div,
                defaults={'class_code': class_code, 'is_active': True}
            )

    # BBA - Division A for all 8 semesters
    bba_divisions = ['A']
    for sem in bba_semesters:
        for div in bba_divisions:
            class_code = f"BBA-S{sem.semester_number}-{div}"
            AcademicClass.objects.get_or_create(
                course=course_bba,
                semester=sem,
                division=div,
                defaults={'class_code': class_code, 'is_active': True}
            )


def reverse_populate_academic_data(apps, schema_editor):
    AcademicClass = apps.get_model('academics', 'AcademicClass')
    Semester = apps.get_model('academics', 'Semester')
    Course = apps.get_model('academics', 'Course')
    Department = apps.get_model('academics', 'Department')

    AcademicClass.objects.all().delete()
    Semester.objects.all().delete()
    Course.objects.all().delete()
    Department.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0002_add_missing_timestamps'),
    ]

    operations = [
        migrations.RunPython(populate_academic_data, reverse_populate_academic_data),
    ]