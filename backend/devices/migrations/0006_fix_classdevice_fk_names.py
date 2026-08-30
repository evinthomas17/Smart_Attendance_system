# Generated migration for ClassDevice model changes - fix FK names and remove device field
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('devices', '0005_populate_classdevice_fields'),
        ('academics', '0005_subject'),
    ]

    operations = [
        # Rename the foreign key constraint for division (academic_class -> division)
        migrations.RunSQL(
            "ALTER TABLE devices_classdevice DROP CONSTRAINT devices_classdevice_academic_class_id_69700f79_fk_academics;",
            reverse_sql="ALTER TABLE devices_classdevice ADD CONSTRAINT devices_classdevice_academic_class_id_69700f79_fk_academics FOREIGN KEY (division_id) REFERENCES academics_academicclass(id) DEFERRABLE INITIALLY DEFERRED;",
        ),
        migrations.RunSQL(
            "ALTER TABLE devices_classdevice ADD CONSTRAINT devices_classdevice_division_id_e040787f_fk_academics FOREIGN KEY (division_id) REFERENCES academics_academicclass(id) DEFERRABLE INITIALLY DEFERRED;",
            reverse_sql="ALTER TABLE devices_classdevice DROP CONSTRAINT devices_classdevice_division_id_e040787f_fk_academics;",
        ),
        # Remove device field (not in required fields) using raw SQL
        migrations.RunSQL(
            "ALTER TABLE devices_classdevice DROP CONSTRAINT IF EXISTS devices_classdevice_device_id_c755df2d_fk_devices_d; ALTER TABLE devices_classdevice DROP COLUMN IF EXISTS device_id;",
            reverse_sql="ALTER TABLE devices_classdevice ADD COLUMN device_id BIGINT NOT NULL; ALTER TABLE devices_classdevice ADD CONSTRAINT devices_classdevice_device_id_c755df2d_fk_devices_d FOREIGN KEY (device_id) REFERENCES devices_device(id) DEFERRABLE INITIALLY DEFERRED;",
        ),
    ]