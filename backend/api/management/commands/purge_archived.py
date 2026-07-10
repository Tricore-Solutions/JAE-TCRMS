"""Delete archived training records that have been archived for more than 2 years."""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta


class Command(BaseCommand):
    help = 'Delete archived training records older than 2 years'

    def handle(self, *args, **options):
        from api.models import Training, AuditLog

        cutoff = timezone.now() - timedelta(days=730)
        old_records = Training.objects.filter(is_archived=True, archived_at__lt=cutoff)
        count = old_records.count()

        if count == 0:
            self.stdout.write('No archived records to purge.')
            return

        old_records.delete()

        AuditLog.objects.create(
            username='system',
            action='PURGE',
            table_name='trainings',
            details=f'Auto-deleted {count} archived training record(s) older than 2 years.',
        )

        self.stdout.write(
            self.style.SUCCESS(f'Purged {count} archived training record(s) older than 2 years.')
        )
