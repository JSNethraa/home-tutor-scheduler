from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClassScheduleViewSet, ClassSessionViewSet, CheckConflictAPIView

router = DefaultRouter()
router.register('rules', ClassScheduleViewSet, basename='schedule-rule')
router.register('sessions', ClassSessionViewSet, basename='session')

urlpatterns = [
    path('check-conflict/', CheckConflictAPIView.as_view(), name='check-conflict'),
    path('', include(router.urls)),
]
