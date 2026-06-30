from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        from django.db.models.signals import post_migrate
        from api.signals import seed_default_admin

        post_migrate.connect(seed_default_admin, sender=self)
