import calendar
from datetime import date, timedelta

from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import exception_handler

from api.models import AuditLog


def calc_expiration(training_date, validity_months=None, validity_days=None):
    if not training_date:
        return None
    if isinstance(training_date, str):
        training_date = date.fromisoformat(training_date)

    if validity_days:
        return training_date + timedelta(days=int(validity_days))

    if validity_months is None or validity_months == 0:
        return None

    months = float(validity_months)
    whole = int(months)
    frac = months - whole
    month_index = training_date.year * 12 + (training_date.month - 1) + whole
    year = month_index // 12
    month = month_index % 12 + 1
    max_day = calendar.monthrange(year, month)[1]
    day = min(training_date.day, max_day)
    result = date(year, month, day)
    if frac:
        days_in_month = calendar.monthrange(result.year, result.month)[1]
        result += timedelta(days=round(days_in_month * frac))
    return result


def parse_training_validity(data, default_months=12):
    validity_days = data.get('validity_days') if 'validity_days' in data else None
    if validity_days:
        return None, int(validity_days)

    if 'validity_months' in data:
        validity_months = data['validity_months']
        if validity_months is None:
            return None, None
        validity_months = float(validity_months)
        if validity_months == 0:
            return 0, None
        return validity_months, None

    return float(default_months), None


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
