from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TutorViewSet, ParentViewSet, StudentViewSet

router = DefaultRouter()
router.register('tutors', TutorViewSet, basename='tutor')
router.register('parents', ParentViewSet, basename='parent')
router.register('students', StudentViewSet, basename='student')

urlpatterns = [
    path('', include(router.urls)),
]
