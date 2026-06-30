from datetime import datetime, timedelta

import jwt
from django.conf import settings
from rest_framework import authentication, exceptions


class JWTUser:
    """Lightweight user object decoded from JWT payload."""

    def __init__(self, payload):
        self.id = payload['id']
        self.username = payload['username']
        self.role = payload['role']
        self.full_name = payload.get('full_name', '')
        self.is_authenticated = True


class JWTAuthentication(authentication.BaseAuthentication):
    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith(f'{self.keyword} '):
            return None

        token = auth_header[len(self.keyword) + 1:]
        if not token:
            raise exceptions.AuthenticationFailed('Access token required')

        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Invalid or expired token')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid or expired token')

        return JWTUser(payload), token


def create_access_token(user):
    payload = {
        'id': user.id,
        'username': user.username,
        'role': user.role,
        'full_name': user.full_name,
        'exp': datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm='HS256')
