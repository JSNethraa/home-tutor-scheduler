from datetime import timedelta, date
from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import ClassSchedule, ClassSession
from .serializers import (
    ClassScheduleSerializer,
    ClassSessionSerializer,
    ConflictCheckSerializer,
    GenerateSessionsSerializer,
)
from apps.accounts.permissions import IsAdminUserRole, IsAdminOrTutor
from apps.batches.models import Batch

class ClassScheduleViewSet(viewsets.ModelViewSet):
    queryset = ClassSchedule.objects.select_related('batch').all()
    serializer_class = ClassScheduleSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        qs = super().get_queryset()
        batch_id = self.request.query_params.get('batch_id')
        if batch_id:
            qs = qs.filter(batch_id=batch_id)
        return qs


class ClassSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ClassSessionSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrTutor()]

    def get_queryset(self):
        user = self.request.user
        qs = ClassSession.objects.select_related('batch', 'tutor__user').prefetch_related('attendance_records').all()

        # Date filtering
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            qs = qs.filter(session_date__gte=start_date)
        if end_date:
            qs = qs.filter(session_date__lte=end_date)

        # Batch filtering
        batch_id = self.request.query_params.get('batch_id')
        if batch_id:
            qs = qs.filter(batch_id=batch_id)

        # Role-based scoping
        if user.role == 'TUTOR' and hasattr(user, 'tutor_profile'):
            return qs.filter(tutor=user.tutor_profile)
        elif user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            return qs.filter(batch__enrollments__student=user.student_profile, batch__enrollments__status='ACTIVE')
        elif user.role == 'PARENT' and hasattr(user, 'parent_profile'):
            return qs.filter(batch__enrollments__student__parent=user.parent_profile, batch__enrollments__status='ACTIVE').distinct()

        return qs

    def perform_create(self, serializer):
        # Auto-fill tutor from batch if omitted
        batch = serializer.validated_data.get('batch')
        tutor = serializer.validated_data.get('tutor')
        if not tutor and batch:
            serializer.save(tutor=batch.tutor)
        else:
            serializer.save()

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUserRole])
    def generate_from_rules(self, request):
        """
        Auto-generates concrete session instances for the upcoming N weeks
        from the batch's weekly recurring schedule rules.
        """
        serializer = GenerateSessionsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        batch_id = serializer.validated_data['batch_id']
        weeks = serializer.validated_data['weeks_ahead']

        try:
            batch = Batch.objects.get(id=batch_id)
        except Batch.DoesNotExist:
            return Response({'error': 'Batch not found.'}, status=status.HTTP_404_NOT_FOUND)

        rules = batch.schedules.all()
        if not rules.exists():
            return Response({'error': 'No weekly schedule templates defined for this batch.'}, status=status.HTTP_400_BAD_REQUEST)

        today = date.today()
        created_sessions = []
        conflicts_encountered = []

        for offset_days in range(weeks * 7):
            target_date = today + timedelta(days=offset_days)
            weekday_idx = target_date.weekday()  # 0=Monday, 6=Sunday

            for rule in rules:
                if rule.day_of_week == weekday_idx:
                    # Check conflict before creating
                    conflict_report = validate_scheduling_conflicts(
                        batch_id=batch.id,
                        tutor_id=batch.tutor.id,
                        session_date=target_date,
                        start_time=rule.start_time,
                        end_time=rule.end_time,
                        room_or_link=rule.room_or_address
                    )

                    # Check if session already exists for this batch on this date & time
                    exists = ClassSession.objects.filter(
                        batch=batch,
                        session_date=target_date,
                        start_time=rule.start_time
                    ).exists()

                    if not exists:
                        if conflict_report['has_conflict']:
                            conflicts_encountered.append({
                                'date': str(target_date),
                                'conflicts': conflict_report['conflicts']
                            })
                        else:
                            session = ClassSession.objects.create(
                                batch=batch,
                                tutor=batch.tutor,
                                schedule_rule=rule,
                                session_date=target_date,
                                start_time=rule.start_time,
                                end_time=rule.end_time,
                                room_or_link=rule.room_or_address
                            )
                            created_sessions.append(session.id)

        return Response({
            'message': f"Generated {len(created_sessions)} class sessions.",
            'created_session_count': len(created_sessions),
            'conflicts_skipped': len(conflicts_encountered),
            'conflicts_detail': conflicts_encountered,
        }, status=status.HTTP_201_CREATED)


class CheckConflictAPIView(views.APIView):
    permission_classes = [IsAdminOrTutor]

    def post(self, request):
        serializer = ConflictCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        report = validate_scheduling_conflicts(
            batch_id=data.get('batch_id'),
            tutor_id=data['tutor_id'],
            session_date=data['session_date'],
            start_time=data['start_time'],
            end_time=data['end_time'],
            room_or_link=data.get('room_or_link'),
            exclude_session_id=data.get('exclude_session_id')
        )
        return Response(report, status=status.HTTP_200_OK)
