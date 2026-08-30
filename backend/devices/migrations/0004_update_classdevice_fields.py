# Generated migration for ClassDevice model changes
from django.db import migrations, models
import django.db.models.deletion


def populate_new_fields(apps, schema_editor):
    """Populate new fields from existing academic_class relationship"""
    ClassDevice = apps.get_model('devices', 'ClassDevice')
    AcademicClass = apps.get_model('academics', 'AcademicClass')
    
    for cd in ClassDevice.objects.all():
        if cd.division_id:
            try:
                academic_class = AcademicClass.objects.get(id=cd.division_id)
                cd.department = academic_class.course.department
                cd.course = academic_class.course
                cd.semester = academic_class.semester
                cd.save()
            except AcademicClass.DoesNotExist:
                pass


class Migration(migrations.Migration):

    dependencies = [
        ('devices', '0003_update_classroom_master_data'),
        ('academics', '0005_subject'),
    ]

    operations = [
        # Rename academic_class to division first (before adding new fields)
        migrations.RenameField(
            model_name='classdevice',
            old_name='academic_class',
            new_name='division',
        ),
        # Remove device field
        migrations.RemoveField(
            model_name='classdevice',
            name='device',
        ),
        # Add new FK fields (nullable for migration)
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
        # Update division FK target (was academic_class, now division pointing to AcademicClass)
        migrations.AlterField(
            model_name='classdevice',
            name='division',
            field=models.ForeignKey(on_delete=models.PROTECT, related_name='class_devices', to='academics.academicclass'),
        ),
        # Add new FK fields (non-nullable after data migration)
        migrations.AddField(
            model_name='classdevice',
            name='course',
            field=models.ForeignKey(on_delete=models.PROTECT, related_name='class_devices', to='academics.course'),
        ),
        migrations.AddField(
            model_name='classdevice',
            name='department',
            field=models.ForeignKey(on_delete=models.PROTECT, related_name='class_devices', to='academics.department'),
        ),
        migrations.AddField(
            model_name='classdevice',
            name='semester',
            field=models.ForeignKey(on_delete=models.PROTECT, related_name='class_devices', to='academics.semester'),
        ),
        # Data migration to populate new fields from division (AcademicClass)
        migrations.RunPython(populate_new_fields, migrations.RunPython.noop),
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
        # Remove unique constraint and add new one
        migrations.RemoveConstraint(
            model_name='classdevice',
            name='unique_academic_class_classroom',
        ),
        migrations.AddConstraint(
            model_name='classdevice',
            constraint=models.UniqueConstraint(fields=('department', 'course', 'semester', 'division', 'classroom'), name='unique_class_device_assignment'),
        ),
    ]