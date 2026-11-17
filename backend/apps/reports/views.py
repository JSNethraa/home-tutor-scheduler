from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse

from .models import Assessment, AssessmentResult, ProgressReport
from .serializers import (
    AssessmentSerializer,
    AssessmentResultSerializer,
    ProgressReportSerializer,
)
from .utils.pdf_generator import generate_progress_report_pdf
from apps.attendance.models import AttendanceRecord
from apps.accounts.permissions import IsAdminOrTutor
from apps.accounts.models import StudentProfile
from apps.batches.models import Batch

class AssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrTutor()]

    def get_queryset(self):
        qs = Assessment.objects.select_related('batch__tutor__user').prefetch_related('results__student__user').all()
        batch_id = self.request.query_params.get('batch_id')
        if batch_id:
            qs = qs.filter(batch_id=batch_id)
        return qs


class AssessmentResultViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentResultSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrTutor()]

    def get_queryset(self):
        user = self.request.user
        qs = AssessmentResult.objects.select_related('assessment__batch', 'student__user').all()

        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            return qs.filter(student=user.student_profile)
        elif user.role == 'PARENT' and hasattr(user, 'parent_profile'):
            return qs.filter(student__parent=user.parent_profile)

        return qs


class ProgressReportViewSet(viewsets.ModelViewSet):
    serializer_class = ProgressReportSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'download_pdf']:
            return [IsAuthenticated()]
        return [IsAdminOrTutor()]

    def get_queryset(self):
        user = self.request.user
        qs = ProgressReport.objects.select_related('student__user', 'batch__tutor__user').all()

        student_id = self.request.query_params.get('student_id')
        if student_id:
            qs = qs.filter(student_id=student_id)

        batch_id = self.request.query_params.get('batch_id')
        if batch_id:
            qs = qs.filter(batch_id=batch_id)

        # Scoping
        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            return qs.filter(student=user.student_profile)
        elif user.role == 'PARENT' and hasattr(user, 'parent_profile'):
            return qs.filter(student__parent=user.parent_profile)

        return qs

    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrTutor])
    def auto_calculate(self, request):
        """
        Calculates aggregate attendance % and average test scores for a student in a batch,
        helping tutors quickly populate a new progress report.
        """
        student_id = request.data.get('student_id')
        batch_id = request.data.get('batch_id')

        if not student_id or not batch_id:
            return Response({'error': 'student_id and batch_id are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate attendance
        att_records = AttendanceRecord.objects.filter(student_id=student_id, session__batch_id=batch_id)
        total_sessions = att_records.count()
        present = att_records.filter(status='PRESENT').count()
        late = att_records.filter(status='LATE').count()
        att_rate = round(((present + (late * 0.5)) / total_sessions * 100), 1) if total_sessions > 0 else 100.0

        # Calculate test results
        results = AssessmentResult.objects.filter(student_id=student_id, assessment__batch_id=batch_id)
        if results.exists():
            percentages = [res.percentage for res in results]
            avg_score = round(sum(percentages) / len(percentages), 1)
        else:
            avg_score = 0.0

        return Response({
            'attendance_percentage': att_rate,
            'average_test_score': avg_score,
            'total_sessions_evaluated': total_sessions,
            'total_tests_evaluated': results.count(),
        })

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        report = self.get_object()

        # Access check
        user = request.user
        if user.role == 'STUDENT' and report.student.user != user:
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)
        if user.role == 'PARENT' and report.student.parent and report.student.parent.user != user:
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

        pdf_buffer = generate_progress_report_pdf(report)
        student_name = (report.student.user.get_full_name() or report.student.user.username).replace(' ', '_')
        filename = f"Progress_Report_{student_name}_{report.id}.pdf"

        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
