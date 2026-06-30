from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import Employee
from api.permissions import IsAdmin, IsAdminOrEncoder
from api.serializers import EmployeeSerializer, TrainingSerializer
from api.utils import log_audit, today


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_filters(request):
    factories = list(
        Employee.objects.exclude(factory='')
        .values_list('factory', flat=True)
        .distinct()
        .order_by('factory')
    )
    lines = list(
        Employee.objects.exclude(line='')
        .values_list('line', flat=True)
        .distinct()
        .order_by('line')
    )
    teams = list(
        Employee.objects.exclude(team='')
        .values_list('team', flat=True)
        .distinct()
        .order_by('team')
    )
    return Response({'factories': factories, 'lines': lines, 'teams': teams})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_list_create(request):
    if request.method == 'GET':
        qs = Employee.objects.all()
        for field in ('status', 'factory', 'line', 'team'):
            value = request.query_params.get(field)
            if value:
                qs = qs.filter(**{field: value})
        search = request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(full_name__icontains=search) | Q(employee_id__icontains=search)
            )
        return Response(EmployeeSerializer(qs.order_by('full_name'), many=True).data)

    if not IsAdminOrEncoder().has_permission(request, None):
        return Response({'error': 'Insufficient permissions'}, status=status.HTTP_403_FORBIDDEN)

    employee_id = (request.data.get('employee_id') or '').strip()
    full_name = (request.data.get('full_name') or '').strip()
    if not employee_id or not full_name:
        return Response(
            {'error': 'employee_id and full_name are required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if Employee.objects.filter(employee_id=employee_id).exists():
        return Response({'error': 'Employee ID already exists'}, status=status.HTTP_409_CONFLICT)

    employee = Employee.objects.create(
        employee_id=employee_id,
        full_name=full_name,
        factory=request.data.get('factory') or '',
        line=request.data.get('line') or '',
        team=request.data.get('team') or '',
        position=request.data.get('position') or '',
        status=request.data.get('status') or 'active',
        hire_date=request.data.get('hire_date') or None,
    )
    log_audit(request.user, 'CREATE', 'employees', employee.id, f'Created employee: {full_name}')
    return Response(EmployeeSerializer(employee).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def employee_detail(request, pk):
    try:
        employee = Employee.objects.get(pk=pk)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        data = EmployeeSerializer(employee).data
        trainings = employee.trainings.order_by('-training_date')
        data['trainings'] = TrainingSerializer(trainings, many=True).data
        return Response(data)

    if request.method == 'PUT':
        if not IsAdminOrEncoder().has_permission(request, None):
            return Response({'error': 'Insufficient permissions'}, status=status.HTTP_403_FORBIDDEN)

        employee.full_name = request.data.get('full_name') or employee.full_name
        for field in ('factory', 'line', 'team', 'position', 'hire_date'):
            if field in request.data:
                setattr(employee, field, request.data[field])
        if request.data.get('status'):
            employee.status = request.data['status']
        employee.save()

        log_audit(
            request.user, 'UPDATE', 'employees', employee.id,
            f'Updated employee: {employee.full_name}',
        )
        return Response(EmployeeSerializer(employee).data)

    if not IsAdmin().has_permission(request, None):
        return Response({'error': 'Insufficient permissions'}, status=status.HTTP_403_FORBIDDEN)

    employee.status = 'resigned'
    employee.save()
    log_audit(
        request.user, 'DELETE', 'employees', employee.id,
        f'Deactivated employee: {employee.full_name}',
    )
    return Response({'message': 'Employee deactivated'})
