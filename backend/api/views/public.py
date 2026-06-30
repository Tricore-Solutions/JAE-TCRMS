from django.db.models import Count, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from api.models import Employee
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
