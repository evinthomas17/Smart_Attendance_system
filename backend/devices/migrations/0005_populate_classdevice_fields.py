# Generated migration for ClassDevice model changes
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('devices', '0004_update_classdevice_fields'),
        ('academics', '0005_subject'),
    ]

    operations = [
        # Rename academic_class_id to division_id using raw SQL (since migration 0004 was faked)
        migrations.RunSQL(
            "ALTER TABLE devices_classdevice RENAME COLUMN academic_class_id TO division_id;",
            reverse_sql="ALTER TABLE devices_classdevice RENAME COLUMN division_id TO academic_class_id;",
        ),
        # Add new FK fields as nullable
        migrations.AddField(
            model_name='classdevice',
            name='department',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.PROTECT, related_name='class_devices', to='academics.department'),
        ),
        migrations.AddField(
            model_name='classdevice',
            name='course',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.PROTECT, related_name='class_devices', to='academics.course'),
        ),
        migrations.AddField(
            model_name='classdevice',
            name='semester',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.PROTECT, related_name='class_devices', to='academics.semester'),
        ),
        # Data migration to populate new fields from division_id (which was academic_class_id) using raw SQL
        migrations.RunSQL(
            """
            UPDATE devices_classdevice
            SET 
                department_id = c.department_id,
                course_id = ac.course_id,
                semester_id = ac.semester_id
            FROM academics_academicclass ac
            JOIN academics_course c ON ac.course_id = c.id
            WHERE devices_classdevice.division_id = ac.id
            AND devices_classdevice.department_id IS NULL
            """,
            reverse_sql="",
        ),
        # Make new fields non-nullable
        migrations.AlterField(
            model_name='classdevice',
            name='department',
            field=models.ForeignKey(on_delete=models.PROTECT, related_name='class_devices', to='academics.department'),
        ),
        migrations.AlterField(
            model_name='classdevice',
            name='course',
            field=models.ForeignKey(on_delete=models.PROTECT, related_name='class_devices', to='academics.course'),
        ),
        migrations.AlterField(
            model_name='classdevice',
            name='semester',
            field=models.ForeignKey(on_delete=models.PROTECT, related_name='class_devices', to='academics.semester'),
        ),
        # Remove old unique constraint and add new one
        migrations.RunSQL(
            "ALTER TABLE devices_classdevice DROP CONSTRAINT unique_academic_class_classroom;",
            reverse_sql="ALTER TABLE devices_classdevice ADD CONSTRAINT unique_academic_class_classroom UNIQUE (division_id, classroom_id);",
        ),
        migrations.AddConstraint(
            model_name='classdevice',
            constraint=models.UniqueConstraint(fields=('department', 'course', 'semester', 'division', 'classroom'), name='unique_class_device_assignment'),
        ),
    ]