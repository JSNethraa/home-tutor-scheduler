from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Batch, BatchEnrollment
from .serializers import BatchSerializer, BatchDetailSerializer, BatchEnrollmentSerializer
from apps.accounts.permissions import IsAdminUserRole, IsAdminOrTutor
from apps.accounts.models import StudentProfile

class BatchViewSet(viewsets.ModelViewSet):
    serializer_class = BatchSerializer

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return BatchDetailSerializer
        return BatchSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'my_batches']:
            return [IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        user = self.request.user
        queryset = Batch.objects.select_related('tutor__user').prefetch_related('enrollments').all()

        # If tutor, show their assigned batches
        if user.role == 'TUTOR' and hasattr(user, 'tutor_profile'):
            return queryset.filter(tutor=user.tutor_profile)

        # If student, show batches they are actively enrolled in
        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            return queryset.filter(enrollments__student=user.student_profile, enrollments__status='ACTIVE')

        # If parent, show batches where any of their children are enrolled
        if user.role == 'PARENT' and hasattr(user, 'parent_profile'):
            return queryset.filter(enrollments__student__parent=user.parent_profile, enrollments__status='ACTIVE').distinct()

        # Admin sees all
        return queryset

    @action(detail=False, methods=['get'])
    def my_batches(self, request):
        batches = self.get_queryset()
        serializer = self.get_serializer(batches, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUserRole])
    def enroll(self, request, pk=None):
        batch = self.get_object()
        student_id = request.data.get('student_id')

        if not student_id:
            return Response({'error': 'student_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = StudentProfile.objects.get(id=student_id)
        except StudentProfile.DoesNotExist:
            return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

        if batch.is_full:
            return Response({'error': f'Batch has reached max capacity of {batch.capacity}.'}, status=status.HTTP_400_BAD_REQUEST)

        enrollment, created = BatchEnrollment.objects.get_or_create(
            batch=batch,
            student=student,
            defaults={'status': BatchEnrollment.Status.ACTIVE}
        )

        if not created and enrollment.status != BatchEnrollment.Status.ACTIVE:
            enrollment.status = BatchEnrollment.Status.ACTIVE
            enrollment.save()

        return Response(BatchEnrollmentSerializer(enrollment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUserRole])
    def unenroll(self, request, pk=None):
        batch = self.get_object()
        student_id = request.data.get('student_id')

        try:
            enrollment = BatchEnrollment.objects.get(batch=batch, student_id=student_id)
            enrollment.status = BatchEnrollment.Status.DROPPED
            enrollment.save()
            return Response({'detail': 'Student marked as dropped from batch.'})
        except BatchEnrollment.DoesNotExist:
            return Response({'error': 'Enrollment record not found.'}, status=status.HTTP_404_NOT_FOUND)


class BatchEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = BatchEnrollment.objects.select_related('batch', 'student__user').all()
    serializer_class = BatchEnrollmentSerializer
    permission_classes = [IsAdminUserRole]
