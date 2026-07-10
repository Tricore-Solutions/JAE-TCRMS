import os
import sys
from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        from django.db.models.signals import post_migrate
        from api.signals import seed_default_admin

        post_migrate.connect(seed_default_admin, sender=self)

        # Start the background scheduler only when running the server,
        # not during management commands like migrate or makemigrations.
        skip_commands = {
            'migrate', 'makemigrations', 'shell', 'dbshell',
            'createsuperuser', 'collectstatic', 'seed_admin', 'purge_archived', 'check',
        }
        if len(sys.argv) > 1 and sys.argv[1] in skip_commands:
            return
        from api import scheduler
        scheduler.start()
