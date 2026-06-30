from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import Employee, Training
from api.permissions import IsAdmin, IsAdminOrEncoder
from api.serializers import TrainingListSerializer, TrainingSerializer
from api.utils import calc_expiration, days_from_today, log_audit, today


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def training_summary(request):
    current = today()
    in30 = days_from_today(30)
    in60 = days_from_today(60)

    total = Training.objects.count()
    expired = Training.objects.filter(
        expiration_date__isnull=False,
        expiration_date__lt=current,
    ).count()
    expiring30 = Training.objects.filter(
        expiration_date__isnull=False,
        expiration_date__gte=current,
        expiration_date__lte=in30,
    ).count()
    expiring60 = Training.objects.filter(
        expiration_date__isnull=False,
        expiration_date__gte=current,
        expiration_date__lte=in60,
    ).count()
    total_employees = Employee.objects.filter(status='active').count()

    return Response({
        'total': total,
        'expired': expired,
        'expiring30': expiring30,
        'expiring60': expiring60,
        'totalEmployees': total_employees,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def training_categories(request):
    categories = list(
        Training.objects.exclude(category='')
        .values_list('category', flat=True)
        .distinct()
        .order_by('category')
    )
    return Response(categories)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def training_list_create(request):
    if request.method == 'GET':
        qs = Training.objects.select_related('employee').all()
        employee_id = request.query_params.get('employee_id')
        category = request.query_params.get('category')
        search = request.query_params.get('search')

        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(
                Q(employee__full_name__icontains=search)
                | Q(employee__employee_id__icontains=search)
                | Q(title__icontains=search)
            )

        current = today()
        in60 = days_from_today(60)
        if request.query_params.get('expired') == 'true':
            qs = qs.filter(expiration_date__isnull=False, expiration_date__lt=current)
        elif request.query_params.get('expiring_soon') == 'true':
            qs = qs.filter(
                expiration_date__isnull=False,
                expiration_date__gte=current,
                expiration_date__lte=in60,
            )

        return Response(
            TrainingListSerializer(qs.order_by('-training_date'), many=True).data
        )

    if not IsAdminOrEncoder().has_permission(request, None):
        return Response({'error': 'Insufficient permissions'}, status=status.HTTP_403_FORBIDDEN)

    employee_id = request.data.get('employee_id')
    title = (request.data.get('title') or '').strip()
    training_date = request.data.get('training_date')

    if not employee_id or not title or not training_date:
        return Response(
            {'error': 'employee_id, title, and training_date are required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        employee = Employee.objects.get(pk=employee_id)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

    validity_months = request.data.get('validity_months') or 12
    expiration_date = calc_expiration(training_date, validity_months)

    training = Training.objects.create(
        employee=employee,
        title=title,
        category=request.data.get('category') or '',
        training_date=training_date,
        trainer=request.data.get('trainer') or '',
        validity_months=validity_months,
        expiration_date=expiration_date,
        process_classification=request.data.get('process_classification') or '',
        remarks=request.data.get('remarks') or '',
        created_by_id=request.user.id,
    )
    log_audit(request.user, 'CREATE', 'trainings', training.id, f'Created training: {title}')
    return Response(TrainingSerializer(training).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def training_detail(request, pk):
    try:
        training = Training.objects.select_related('employee').get(pk=pk)
    except Training.DoesNotExist:
        return Response({'error': 'Training record not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        data = TrainingSerializer(training).data
        data['employee_name'] = training.employee.full_name
        data['emp_code'] = training.employee.employee_id
        return Response(data)

    if request.method == 'PUT':
        if not IsAdminOrEncoder().has_permission(request, None):
            return Response({'error': 'Insufficient permissions'}, status=status.HTTP_403_FORBIDDEN)

        new_date = request.data.get('training_date') or training.training_date
        new_validity = (
            request.data['validity_months']
            if 'validity_months' in request.data
            else training.validity_months
        )

        training.title = request.data.get('title') or training.title
        if 'category' in request.data:
            training.category = request.data['category']
        training.training_date = new_date
        if 'trainer' in request.data:
            training.trainer = request.data['trainer']
        training.validity_months = new_validity
        training.expiration_date = calc_expiration(new_date, new_validity)
        if 'process_classification' in request.data:
            training.process_classification = request.data['process_classification']
        if 'remarks' in request.data:
            training.remarks = request.data['remarks']
        training.save()

        log_audit(
            request.user, 'UPDATE', 'trainings', training.id,
            f'Updated training: {training.title}',
        )
        return Response(TrainingSerializer(training).data)

    if not IsAdmin().has_permission(request, None):
        return Response({'error': 'Insufficient permissions'}, status=status.HTTP_403_FORBIDDEN)

    title = training.title
    training.delete()
    log_audit(request.user, 'DELETE', 'trainings', pk, f'Deleted training: {title}')
    return Response({'message': 'Training record deleted'})
