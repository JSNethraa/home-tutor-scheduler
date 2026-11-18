from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Batch, BatchEnrollment
from .serializers import BatchSerializer, BatchDetailSerializer, BatchEnrollmentSerializer
from apps.accounts.permissions import IsAdminUserRole, IsAdminOrTutor
from apps.accounts.models import StudentProfile, User

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
        student_name = (request.data.get('student_name') or '').strip()

        if not student_id and not student_name:
            return Response({'error': 'Please enter a student name to enroll.'}, status=status.HTTP_400_BAD_REQUEST)

        student = None

        if student_id:
            try:
                student = StudentProfile.objects.select_related('user').get(id=student_id)
            except StudentProfile.DoesNotExist:
                return Response({'error': 'Student not found with provided ID.'}, status=status.HTTP_404_NOT_FOUND)
        elif student_name:
            # 1. Search for existing student by name
            name_parts = student_name.split()
            first = name_parts[0]
            last = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

            if last:
                existing = StudentProfile.objects.select_related('user').filter(
                    Q(user__first_name__iexact=first, user__last_name__iexact=last) |
                    Q(user__username__iexact=student_name)
                ).first()
            else:
                existing = StudentProfile.objects.select_related('user').filter(
                    Q(user__first_name__iexact=first) |
                    Q(user__username__iexact=first)
                ).first()

            if existing:
                student = existing
            else:
                # 2. Automatically create new student profile from name
                import re
                clean_name = re.sub(r'[^a-zA-Z0-9]', '_', student_name.lower()).strip('_')
                base_username = f"student_{clean_name}"[:20]
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}_{counter}"
                    counter += 1

                email = (request.data.get('email') or '').strip() or f"{username}@scheduler.edu"
                phone = (request.data.get('phone_number') or '').strip()
                grade = (request.data.get('grade_level') or '').strip() or batch.grade_level

                new_user = User.objects.create(
                    username=username,
                    first_name=first,
                    last_name=last,
                    email=email,
                    phone_number=phone,
                    role=User.Role.STUDENT,
                )
                new_user.set_password('student123')
                new_user.save()

                student = StudentProfile.objects.create(
                    user=new_user,
                    grade_level=grade,
                )

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

        student_display_name = student.user.get_full_name() or student.user.username
        data = BatchEnrollmentSerializer(enrollment).data
        data['message'] = f"Successfully enrolled student '{student_display_name}' into {batch.name}."
        return Response(data, status=status.HTTP_201_CREATED)

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
