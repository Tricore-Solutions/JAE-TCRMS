from django.urls import include, path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from api.views.health import health_check


@api_view(['GET'])
@permission_classes([AllowAny])
def index(request):
    return Response({
        'name': 'JAE TCRMS API',
        'version': '1.0.0',
        'message': 'Backend is running. Use the Electron desktop app for the UI.',
        'endpoints': {
            'health': '/health',
            'api': '/api/',
        },
    })


urlpatterns = [
    path('', index),
    path('health', health_check),
    path('api/', include('api.urls')),
]
