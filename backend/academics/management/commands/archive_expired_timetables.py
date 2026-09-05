from django.core.management.base import BaseCommand
from django.utils import timezone

from academics.models import Timetable


class Command(BaseCommand):
    help = "Archive expired temporary timetables"

    def handle(self, *args, **options):
        today = timezone.now().date()
        expired_timetables = Timetable.objects.filter(
            timetable_type="TEMPORARY",
            is_active=True,
            is_archived=False,
            valid_until__lt=today,
        )

        count = expired_timetables.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS("No expired temporary timetables to archive."))
            return

        for timetable in expired_timetables:
            timetable.is_active = False
            timetable.is_archived = True
            timetable.archived_at = timezone.now()
            timetable.save()
            self.stdout.write(f"Archived timetable: {timetable}")

        self.stdout.write(self.style.SUCCESS(f"Successfully archived {count} expired temporary timetable(s)."))