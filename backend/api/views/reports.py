from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import AuditLog, Employee, Training, User
from api.serializers import AuditLogSerializer
from api.utils import days_from_today, today, user_display_name


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def overview(request):
    current = today()
    in10 = days_from_today(10)

    return Response({
        'totalEmployees': Employee.objects.filter(status='active').count(),
        'totalTrainings': Training.objects.count(),
        'expiredCerts': Training.objects.filter(
            expiration_date__isnull=False,
            expiration_date__lt=current,
        ).count(),
        'expiring30': Training.objects.filter(
            expiration_date__isnull=False,
            expiration_date__gte=current,
            expiration_date__lte=in10,
        ).count(),
        'expiring60': Training.objects.filter(
            expiration_date__isnull=False,
            expiration_date__gte=current,
            expiration_date__lte=in10,
        ).count(),
        'totalUsers': User.objects.filter(status='active').count(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def by_category(request):
    rows = (
        Training.objects.exclude(category='')
        .values('category')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    return Response(list(rows))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def by_factory(request):
    rows = []
    factories = (
        Employee.objects.filter(status='active')
        .exclude(factory='')
        .values_list('factory', flat=True)
        .distinct()
        .order_by('factory')
    )
    for factory in factories:
        employee_count = Employee.objects.filter(status='active', factory=factory).count()
        training_count = Training.objects.filter(employee__factory=factory).count()
        rows.append({
            'factory': factory,
            'employee_count': employee_count,
            'training_count': training_count,
        })
    return Response(rows)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expiring(request):
    current = today()
    in10 = days_from_today(10)
    days = request.query_params.get('days')
    expired_only = request.query_params.get('expired') == 'true'

    if expired_only:
        trainings = (
            Training.objects.select_related('employee')
            .filter(expiration_date__isnull=False, expiration_date__lt=current)
            .order_by('expiration_date')
        )
    elif days:
        in_days = days_from_today(int(days))
        trainings = (
            Training.objects.select_related('employee')
            .filter(
                expiration_date__isnull=False,
                expiration_date__gte=current,
                expiration_date__lte=in_days,
            )
            .order_by('expiration_date')
        )
    else:
        trainings = (
            Training.objects.select_related('employee')
            .filter(expiration_date__isnull=False, expiration_date__lte=in10)
            .order_by('expiration_date')[:100]
        )

    rows = []
    for training in trainings:
        if training.expiration_date < current:
            cert_status = 'expired'
        elif training.expiration_date <= in10:
            cert_status = 'expiring'
        else:
            cert_status = 'valid'

        rows.append({
            'id': training.id,
            'title': training.title,
            'expiration_date': training.expiration_date.isoformat(),
            'training_date': training.training_date.isoformat(),
            'full_name': training.employee.full_name,
            'emp_code': training.employee.employee_id,
            'factory': training.employee.factory,
            'line': training.employee.line,
            'team': training.employee.team,
            'cert_status': cert_status,
        })

    return Response(rows)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audit_logs(request):
    limit = int(request.query_params.get('limit') or 50)
    logs = AuditLog.objects.select_related('user').order_by('-created_at')[:limit]
    return Response(AuditLogSerializer(logs, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def record_audit_logs(request, table_name, record_id):
    import json as _json
    logs = (
        AuditLog.objects
        .select_related('user')
        .filter(table_name=table_name, record_id=record_id)
        .order_by('-created_at')
    )
    result = []
    for log in logs:
        entry = {
            'action': log.action,
            'full_name': user_display_name(log.user, log.username),
            'created_at': log.created_at.strftime('%b %d, %Y %I:%M %p'),
            'summary': log.details or '',
            'changes': {},
        }
        # Try parsing JSON details for before/after
        if log.details:
            try:
                parsed = _json.loads(log.details)
                entry['summary'] = parsed.get('summary', log.details)
                entry['changes'] = parsed.get('changes', {})
            except (ValueError, TypeError):
                entry['summary'] = log.details
        result.append(entry)
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_trainings(request):
    qs = Training.objects.select_related('employee').all()

    category = request.query_params.get('category')
    factory = request.query_params.get('factory')
    search = request.query_params.get('search')
    worker_line_status = request.query_params.get('worker_line_status')
    take = request.query_params.get('take')
    training_date = request.query_params.get('training_date')
    emp_status = request.query_params.get('status')

    if factory:
        qs = qs.filter(employee__factory=factory)
    if category:
        qs = qs.filter(category=category)
    if worker_line_status:
        qs = qs.filter(worker_line_status=worker_line_status)
    if take:
        qs = qs.filter(take=int(take))
    if training_date:
        qs = qs.filter(training_date=training_date)
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    if date_from:
        qs = qs.filter(training_date__gte=date_from)
    if date_to:
        qs = qs.filter(training_date__lte=date_to)
    if emp_status:
        qs = qs.filter(employee__status=emp_status)
    if search:
        qs = qs.filter(
            Q(employee__full_name__icontains=search)
            | Q(employee__employee_id__icontains=search)
            | Q(title__icontains=search)
        )

    current = today()
    in10 = days_from_today(10)
    if request.query_params.get('expired') == 'true':
        qs = qs.filter(expiration_date__isnull=False, expiration_date__lt=current)
    elif request.query_params.get('expiring_soon') == 'true':
        qs = qs.filter(
            expiration_date__isnull=False,
            expiration_date__gte=current,
            expiration_date__lte=in10,
        )

    rows = []
    for training in qs.order_by('employee__full_name', '-training_date'):
        employee = training.employee
        rows.append({
            'id': training.id,
            'emp_code': employee.employee_id,
            'full_name': employee.full_name,
            'factory': employee.factory,
            'line': employee.line,
            'team': employee.team,
            'title': training.title,
            'category': training.category,
            'training_date': training.training_date.isoformat(),
            'trainer': training.trainer,
            'validity_months': training.validity_months,
            'expiration_date': (
                training.expiration_date.isoformat() if training.expiration_date else None
            ),
            'process_classification': training.process_classification,
            'worker_line_status': training.worker_line_status,
            'take': training.take,
            'remarks': training.remarks,
        })

    return Response(rows)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def takes_per_month(request):
    """
    Returns data grouped by month (Y) and take number (X).
    Each entry: { month, takes: [{take, count}, ...] }
    """
    MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    rows = (
        Training.objects
        .annotate(month=TruncMonth('training_date'))
        .values('month', 'take')
        .annotate(count=Count('id'))
        .order_by('month', 'take')
    )

    # Build month → {take: count} map
    from collections import defaultdict
    month_map = defaultdict(dict)
    month_order = []
    for row in rows:
        if not row['month']:
            continue
        label = MONTH_NAMES[row['month'].month - 1] + ' ' + str(row['month'].year)
        if label not in month_map:
            month_order.append(label)
        month_map[label][row['take']] = row['count']

    # All take numbers that appear
    all_takes = sorted({t for m in month_map.values() for t in m})

    return Response({
        'months': month_order,
        'takes': all_takes,
        'data': {
            month: {str(t): month_map[month].get(t, 0) for t in all_takes}
            for month in month_order
        },
    })
