from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BatchViewSet, BatchEnrollmentViewSet

router = DefaultRouter()
router.register('enrollments', BatchEnrollmentViewSet, basename='enrollment')
router.register('', BatchViewSet, basename='batch')

urlpatterns = [
    path('', include(router.urls)),
]
