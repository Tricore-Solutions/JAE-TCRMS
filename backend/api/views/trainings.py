import json
from django.utils import timezone
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import Employee, Training
from api.permissions import IsAdmin, IsAdminOrEncoder
from api.serializers import TrainingListSerializer, TrainingSerializer
from api.utils import calc_expiration, days_from_today, log_audit, parse_training_validity, today


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def training_summary(request):
    current = today()
    in30 = days_from_today(30)
    in10 = days_from_today(10)

    active_qs = Training.objects.filter(is_archived=False)
    total = active_qs.count()
    expired = active_qs.filter(
        expiration_date__isnull=False,
        expiration_date__lt=current,
    ).count()
    expiring30 = active_qs.filter(
        expiration_date__isnull=False,
        expiration_date__gte=current,
        expiration_date__lte=in30,
    ).count()
    expiring60 = active_qs.filter(
        expiration_date__isnull=False,
        expiration_date__gte=current,
        expiration_date__lte=in10,
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
        Training.objects.filter(is_archived=False).exclude(category='')
        .values_list('category', flat=True)
        .distinct()
        .order_by('category')
    )
    return Response(categories)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def training_titles(request):
    titles = list(
        Training.objects.filter(is_archived=False).exclude(title='')
        .values_list('title', flat=True)
        .distinct()
        .order_by('title')
    )
    return Response(titles)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def training_list_create(request):
    if request.method == 'GET':
        qs = Training.objects.select_related('employee').filter(is_archived=False)
        employee_id = request.query_params.get('employee_id')
        category = request.query_params.get('category')
        search = request.query_params.get('search')

        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        if category:
            qs = qs.filter(category=category)
        worker_line_status = request.query_params.get('worker_line_status')
        if worker_line_status:
            qs = qs.filter(worker_line_status=worker_line_status)
        take = request.query_params.get('take')
        if take:
            qs = qs.filter(take=int(take))
        training_date = request.query_params.get('training_date')
        if training_date:
            qs = qs.filter(training_date=training_date)
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(training_date__gte=date_from)
        if date_to:
            qs = qs.filter(training_date__lte=date_to)
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

    validity_months, validity_days = parse_training_validity(request.data)
    expiration_date = calc_expiration(
        training_date,
        validity_months=validity_months,
        validity_days=validity_days,
    )

    training = Training.objects.create(
        employee=employee,
        title=title,
        category=request.data.get('category') or '',
        training_date=training_date,
        trainer=request.data.get('trainer') or '',
        validity_months=validity_months,
        validity_days=validity_days,
        expiration_date=expiration_date,
        process_classification=request.data.get('process_classification') or '',
        remarks=request.data.get('remarks') or '',
        worker_line_status=request.data.get('worker_line_status') or 'Floating',
        take=request.data.get('take') or 1,
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

        # Capture before state
        before = {
            'title': training.title,
            'category': training.category,
            'training_date': str(training.training_date),
            'trainer': training.trainer,
            'validity_months': (
                float(training.validity_months) if training.validity_months is not None else None
            ),
            'validity_days': training.validity_days,
            'expiration_date': str(training.expiration_date) if training.expiration_date else None,
            'process_classification': training.process_classification,
            'worker_line_status': training.worker_line_status,
            'take': training.take,
            'remarks': training.remarks,
        }

        new_date = request.data.get('training_date') or training.training_date
        validity_months, validity_days = parse_training_validity(
            request.data,
            default_months=training.validity_months if training.validity_months is not None else 12,
        )

        training.title = request.data.get('title') or training.title
        if 'category' in request.data:
            training.category = request.data['category']
        training.training_date = new_date
        if 'trainer' in request.data:
            training.trainer = request.data['trainer']
        training.validity_months = validity_months
        training.validity_days = validity_days
        training.expiration_date = calc_expiration(
            new_date,
            validity_months=validity_months,
            validity_days=validity_days,
        )
        if 'process_classification' in request.data:
            training.process_classification = request.data['process_classification']
        if 'remarks' in request.data:
            training.remarks = request.data['remarks']
        if 'worker_line_status' in request.data:
            training.worker_line_status = request.data['worker_line_status']
        if 'take' in request.data:
            training.take = request.data['take']
        training.save()

        after = {
            'title': training.title,
            'category': training.category,
            'training_date': str(training.training_date),
            'trainer': training.trainer,
            'validity_months': (
                float(training.validity_months) if training.validity_months is not None else None
            ),
            'validity_days': training.validity_days,
            'expiration_date': str(training.expiration_date) if training.expiration_date else None,
            'process_classification': training.process_classification,
            'worker_line_status': training.worker_line_status,
            'take': training.take,
            'remarks': training.remarks,
        }
        # Only keep changed fields
        changes = {k: {'before': before[k], 'after': after[k]} for k in before if before[k] != after[k]}

        log_audit(
            request.user, 'UPDATE', 'trainings', training.id,
            json.dumps({'summary': f'Updated training: {training.title}', 'changes': changes}),
        )
        return Response(TrainingSerializer(training).data)

    if not IsAdmin().has_permission(request, None):
        return Response({'error': 'Insufficient permissions'}, status=status.HTTP_403_FORBIDDEN)

    training.is_archived = True
    training.archived_at = timezone.now()
    training.save()
    log_audit(request.user, 'ARCHIVE', 'trainings', pk, f'Archived training: {training.title}')
    return Response({'message': 'Training record archived'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def archived_trainings(request):
    if not IsAdmin().has_permission(request, None):
        return Response({'error': 'Insufficient permissions'}, status=403)
    qs = Training.objects.select_related('employee').filter(is_archived=True).order_by('-archived_at')
    return Response(TrainingListSerializer(qs, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def restore_training(request, pk):
    if not IsAdmin().has_permission(request, None):
        return Response({'error': 'Insufficient permissions'}, status=403)
    try:
        training = Training.objects.get(pk=pk, is_archived=True)
    except Training.DoesNotExist:
        return Response({'error': 'Archived record not found'}, status=404)
    training.is_archived = False
    training.archived_at = None
    training.save()
    log_audit(request.user, 'RESTORE', 'trainings', pk, f'Restored training: {training.title}')
    return Response({'message': 'Training record restored'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_archived_training(request, pk):
    if not IsAdmin().has_permission(request, None):
        return Response({'error': 'Insufficient permissions'}, status=403)
    try:
        training = Training.objects.get(pk=pk, is_archived=True)
    except Training.DoesNotExist:
        return Response({'error': 'Archived record not found'}, status=404)
    title = training.title
    training.delete()
    log_audit(request.user, 'DELETE', 'trainings', pk, f'Permanently deleted training: {title}')
    return Response({'message': 'Training record permanently deleted'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_archive_trainings(request):
    if not IsAdmin().has_permission(request, None):
        return Response({'error': 'Insufficient permissions'}, status=403)
    ids = request.data.get('ids', [])
    if not ids or not isinstance(ids, list):
        return Response({'error': 'A list of ids is required'}, status=400)
    from django.utils import timezone
    qs = Training.objects.filter(pk__in=ids, is_archived=False)
    count = qs.count()
    qs.update(is_archived=True, archived_at=timezone.now())
    log_audit(request.user, 'DELETE', 'trainings', None, f'Bulk archived {count} training record(s)')
    return Response({'message': f'{count} record(s) archived', 'count': count})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_restore_trainings(request):
    if not IsAdmin().has_permission(request, None):
        return Response({'error': 'Insufficient permissions'}, status=403)
    ids = request.data.get('ids', [])
    if not ids or not isinstance(ids, list):
        return Response({'error': 'A list of ids is required'}, status=400)
    qs = Training.objects.filter(pk__in=ids, is_archived=True)
    count = qs.count()
    qs.update(is_archived=False, archived_at=None)
    log_audit(request.user, 'RESTORE', 'trainings', None, f'Bulk restored {count} training record(s)')
    return Response({'message': f'{count} record(s) restored', 'count': count})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def bulk_delete_trainings(request):
    if not IsAdmin().has_permission(request, None):
        return Response({'error': 'Insufficient permissions'}, status=403)
    ids = request.data.get('ids', [])
    if not ids or not isinstance(ids, list):
        return Response({'error': 'A list of ids is required'}, status=400)
    qs = Training.objects.filter(pk__in=ids, is_archived=True)
    count = qs.count()
    qs.delete()
    log_audit(request.user, 'DELETE', 'trainings', None, f'Bulk permanently deleted {count} training record(s)')
    return Response({'message': f'{count} record(s) permanently deleted', 'count': count})
