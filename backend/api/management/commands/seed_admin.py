#!/usr/bin/env python
"""Seed the default admin user if no users exist."""
from django.core.management.base import BaseCommand

from api.signals import seed_default_admin


class Command(BaseCommand):
    help = 'Create default admin user (admin / admin123) if database is empty'

    def handle(self, *args, **options):
        seed_default_admin(sender=None)
