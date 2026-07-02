import bcrypt
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from api.authentication import create_access_token
from api.models import User
from api.utils import log_audit, user_display_name


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = (request.data.get('username') or '').strip().lower()
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {'error': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.get(username=username, status='active')
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid username or password'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return Response(
            {'error': 'Invalid username or password'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    log_audit(user, 'LOGIN', 'users', details=f'User {user_display_name(user)} logged in')

    token = create_access_token(user)
    return Response({
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'full_name': user.full_name,
            'role': user.role,
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    try:
        user = User.objects.get(pk=request.user.id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'id': user.id,
        'username': user.username,
        'full_name': user.full_name,
        'role': user.role,
        'status': user.status,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    log_audit(
        request.user,
        'LOGOUT',
        'users',
        details=f'User {user_display_name(request.user)} logged out',
    )
    return Response({'message': 'Logged out'})
