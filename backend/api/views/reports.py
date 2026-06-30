from django.db.models import Count, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import AuditLog, Employee, Training, User
from api.serializers import AuditLogSerializer
from api.utils import days_from_today, today


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def overview(request):
    current = today()
    in30 = days_from_today(30)
    in60 = days_from_today(60)

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
            expiration_date__lte=in30,
        ).count(),
        'expiring60': Training.objects.filter(
            expiration_date__isnull=False,
            expiration_date__gte=current,
            expiration_date__lte=in60,
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
    in60 = days_from_today(60)

    rows = []
    trainings = (
        Training.objects.select_related('employee')
        .filter(expiration_date__isnull=False, expiration_date__lte=in60)
        .order_by('expiration_date')[:100]
    )

    for training in trainings:
        if training.expiration_date < current:
            cert_status = 'expired'
        elif training.expiration_date <= in60:
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
    logs = AuditLog.objects.order_by('-created_at')[:limit]
    return Response(AuditLogSerializer(logs, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_trainings(request):
    qs = Training.objects.select_related('employee').all()
    factory = request.query_params.get('factory')
    category = request.query_params.get('category')
    emp_status = request.query_params.get('status')

    if factory:
        qs = qs.filter(employee__factory=factory)
    if category:
        qs = qs.filter(category=category)
    if emp_status:
        qs = qs.filter(employee__status=emp_status)

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
            'remarks': training.remarks,
        })

    return Response(rows)
