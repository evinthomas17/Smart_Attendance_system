# Generated migration for FacultyClassAssignment model

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('faculty', '0001_initial'),
        ('academics', '0004_alter_academicclass_created_at_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='FacultyClassAssignment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('assigned_at', models.DateTimeField(auto_now_add=True)),
                ('is_active', models.BooleanField(default=True)),
                ('academic_class', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='class_teachers', to='academics.academicclass')),
                ('faculty', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='class_teacher_assignment', to='faculty.faculty')),
            ],
            options={
                'verbose_name': 'Faculty Class Assignment',
                'verbose_name_plural': 'Faculty Class Assignments',
                'ordering': ['-assigned_at'],
                'constraints': [models.UniqueConstraint(condition=models.Q(('is_active', True)), fields=('academic_class', 'is_active'), name='unique_active_class_teacher')],
            },
        ),
    ]
