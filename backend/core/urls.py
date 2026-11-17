"""
Global URL Configuration for Home Tutor & Coaching Batch Scheduler.
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        'name': 'Home Tutor & Coaching Batch Scheduler API',
        'status': 'online',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth/',
            'accounts': '/api/accounts/',
            'batches': '/api/batches/',
            'scheduling': '/api/scheduling/',
            'attendance': '/api/attendance/',
            'fees': '/api/fees/',
            'reports': '/api/reports/',
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),
    path('api/auth/', include('apps.accounts.auth_urls')),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/batches/', include('apps.batches.urls')),
    path('api/scheduling/', include('apps.scheduling.urls')),
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/fees/', include('apps.fees.urls')),
    path('api/reports/', include('apps.reports.urls')),
]
