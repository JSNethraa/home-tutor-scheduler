from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssessmentViewSet, AssessmentResultViewSet, ProgressReportViewSet

router = DefaultRouter()
router.register('assessments', AssessmentViewSet, basename='assessment')
router.register('results', AssessmentResultViewSet, basename='assessment-result')
router.register('progress-reports', ProgressReportViewSet, basename='progress-report')

urlpatterns = [
    path('', include(router.urls)),
]
