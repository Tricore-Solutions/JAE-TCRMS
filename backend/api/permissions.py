from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and getattr(request.user, 'role', None) == 'admin')


class IsAdminOrEncoder(BasePermission):
    def has_permission(self, request, view):
        role = getattr(request.user, 'role', None)
        return role in ('admin', 'encoder')


def require_roles(*roles):
    class RolePermission(BasePermission):
        def has_permission(self, request, view):
            if not request.user:
                return False
            if getattr(request.user, 'role', None) not in roles:
                raise PermissionDenied('Insufficient permissions')
            return True

    return RolePermission
