"""
Background scheduler — runs daily cleanup tasks automatically when the server is running.
No external libraries required; uses only Python's threading and time modules.
"""
import threading
import time
import logging

logger = logging.getLogger(__name__)

_started = False
_lock = threading.Lock()

INTERVAL_SECONDS = 24 * 60 * 60  # 24 hours


def _run_purge():
    """Run the purge_archived management command inside Django's ORM context."""
    try:
        from django.utils import timezone
        from datetime import timedelta
        from api.models import Training, AuditLog

        cutoff = timezone.now() - timedelta(days=730)
        old_records = Training.objects.filter(is_archived=True, archived_at__lt=cutoff)
        count = old_records.count()

        if count > 0:
            old_records.delete()
            AuditLog.objects.create(
                username='system',
                action='PURGE',
                table_name='trainings',
                details=f'Auto-deleted {count} archived training record(s) older than 2 years.',
            )
            logger.info(f'[Scheduler] Purged {count} archived training record(s) older than 2 years.')
        else:
            logger.info('[Scheduler] No archived records to purge.')

    except Exception as e:
        logger.error(f'[Scheduler] Purge failed: {e}')


def _scheduler_loop():
    """Run once immediately on startup, then every 24 hours."""
    logger.info('[Scheduler] Started. Will check for old archived records every 24 hours.')
    while True:
        _run_purge()
        time.sleep(INTERVAL_SECONDS)


def start():
    """Start the background scheduler thread (safe to call multiple times — only starts once)."""
    global _started
    with _lock:
        if _started:
            return
        _started = True

    thread = threading.Thread(target=_scheduler_loop, name='tcrms-scheduler', daemon=True)
    thread.start()
