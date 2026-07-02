import calendar
from datetime import date, timedelta

from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import exception_handler

from api.models import AuditLog


def calc_expiration(training_date, validity_months):
    if not training_date or not validity_months:
        return None
    if isinstance(training_date, str):
        training_date = date.fromisoformat(training_date)
    months = int(validity_months)
    month_index = training_date.year * 12 + (training_date.month - 1) + months
    year = month_index // 12
    month = month_index % 12 + 1
    max_day = calendar.monthrange(year, month)[1]
    day = min(training_date.day, max_day)
    return date(year, month, day)


def user_display_name(user, fallback=None):
    if user:
        name = (getattr(user, 'full_name', None) or '').strip()
        if name:
            return name
        if getattr(user, 'username', None):
            return user.username
    return fallback or 'Unknown'


def log_audit(user, action, table_name, record_id=None, details=None):
    AuditLog.objects.create(
        user_id=getattr(user, 'id', None),
        username=user_display_name(user) if user else None,
        action=action,
        table_name=table_name,
        record_id=record_id,
        details=details,
    )


def today():
    return timezone.localdate()


def days_from_today(days):
    return today() + timedelta(days=days)


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        detail = response.data.get('detail', response.data)
        if isinstance(detail, list):
            error = detail[0] if detail else 'Request failed'
        elif isinstance(detail, dict):
            error = next(iter(detail.values()))[0] if detail else 'Request failed'
            if isinstance(error, list):
                error = error[0]
        else:
            error = str(detail)
        response.data = {'error': error}
    return response
