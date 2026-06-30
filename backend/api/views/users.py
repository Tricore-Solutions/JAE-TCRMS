import bcrypt
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from api.models import User
from api.permissions import IsAdmin
from api.serializers import UserCreateSerializer, UserSerializer, UserUpdateSerializer
from api.utils import log_audit


@api_view(['GET', 'POST'])
@permission_classes([IsAdmin])
def user_list_create(request):
    if request.method == 'GET':
        users = User.objects.order_by('username')
        return Response(UserSerializer(users, many=True).data)

    serializer = UserCreateSerializer(data=request.data)
    if not serializer.is_valid():
        first_error = next(iter(serializer.errors.values()))[0]
        return Response({'error': str(first_error)}, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    username = data['username'].strip().lower()

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_409_CONFLICT)

    password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt(rounds=10)).decode('utf-8')
    user = User.objects.create(
        username=username,
        password_hash=password_hash,
        full_name=data.get('full_name') or '',
        role=data['role'],
    )
    log_audit(request.user, 'CREATE', 'users', user.id, f'Created user: {username}')
    return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdmin])
def user_detail(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(UserSerializer(user).data)

    if request.method == 'PUT':
        serializer = UserUpdateSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            first_error = next(iter(serializer.errors.values()))[0]
            return Response({'error': str(first_error)}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        new_role = data.get('role', user.role)

        if user.role == 'admin' and new_role != 'admin':
            admin_count = User.objects.filter(role='admin', status='active').count()
            if admin_count <= 1:
                return Response(
                    {'error': 'Cannot change role of the last active admin'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'role' in data:
            user.role = data['role']
        if 'status' in data:
            user.status = data['status']
        if data.get('password'):
            user.password_hash = bcrypt.hashpw(
                data['password'].encode('utf-8'),
                bcrypt.gensalt(rounds=10),
            ).decode('utf-8')
        user.save()

        log_audit(request.user, 'UPDATE', 'users', user.id, f'Updated user: {user.username}')
        return Response(UserSerializer(user).data)

    if user.id == request.user.id:
        return Response({'error': 'Cannot deactivate your own account'}, status=status.HTTP_400_BAD_REQUEST)

    if user.role == 'admin':
        admin_count = User.objects.filter(role='admin', status='active').count()
        if admin_count <= 1:
            return Response(
                {'error': 'Cannot deactivate the last admin'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    user.status = 'inactive'
    user.save()
    log_audit(request.user, 'DELETE', 'users', user.id, f'Deactivated user: {user.username}')
    return Response({'message': 'User deactivated'})
