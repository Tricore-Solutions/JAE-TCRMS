from django.db.models import Count, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from api.models import Employee, Training
from api.utils import today


@api_view(['GET'])
@permission_classes([AllowAny])
def public_employees(request):
    qs = Employee.objects.all()
    status_filter = request.query_params.get('status')
    team = request.query_params.get('team')
    search = request.query_params.get('search')

    if status_filter:
        qs = qs.filter(status=status_filter)
    else:
        qs = qs.filter(status='active')
    if team:
        qs = qs.filter(team=team)
    if search:
        qs = qs.filter(
            Q(full_name__icontains=search) | Q(employee_id__icontains=search)
        )

    current = today()
    rows = qs.annotate(
        total_trainings=Count('trainings'),
        expired_count=Count(
            'trainings',
            filter=Q(
                trainings__expiration_date__isnull=False,
                trainings__expiration_date__lt=current,
            ),
        ),
    ).order_by('full_name').values(
        'id', 'employee_id', 'full_name', 'factory', 'line', 'team', 'status',
        'total_trainings', 'expired_count',
    )

    return Response(list(rows))


@api_view(['GET'])
@permission_classes([AllowAny])
def public_employee_trainings(request, pk):
    try:
        employee = Employee.objects.get(pk=pk)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee not found'}, status=404)

    trainings = Training.objects.filter(employee=employee).order_by('-training_date')
    current = today()

    import datetime
    in60 = current + datetime.timedelta(days=60)

    rows = []
    for t in trainings:
        if t.expiration_date is None:
            cert_status = 'valid'
        elif t.expiration_date < current:
            cert_status = 'expired'
        elif t.expiration_date <= in60:
            cert_status = 'expiring'
        else:
            cert_status = 'valid'

        rows.append({
            'id': t.id,
            'title': t.title,
            'category': t.category,
            'training_date': str(t.training_date),
            'trainer': t.trainer,
            'validity_months': t.validity_months,
            'expiration_date': str(t.expiration_date) if t.expiration_date else None,
            'worker_line_status': t.worker_line_status,
            'take': t.take,
            'process_classification': t.process_classification,
            'remarks': t.remarks,
            'cert_status': cert_status,
        })

    return Response({
        'employee': {
            'id': employee.id,
            'employee_id': employee.employee_id,
            'full_name': employee.full_name,
            'factory': employee.factory,
            'line': employee.line,
            'team': employee.team,
            'position': employee.position,
        },
        'trainings': rows,
    })
