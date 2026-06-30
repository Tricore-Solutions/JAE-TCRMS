from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    from django.db import connection

    db_ok = False
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
            db_ok = True
    except Exception:
        pass

    if not db_ok:
        return Response({
            'status': 'error',
            'db': 'disconnected',
            'time': timezone.now().isoformat(),
            'version': '1.0.0',
        }, status=503)

    return Response({
        'status': 'ok',
        'db': 'connected',
        'time': timezone.now().isoformat(),
        'version': '1.0.0',
    })
