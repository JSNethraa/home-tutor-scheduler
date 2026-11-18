from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import AttendanceRecord
from .serializers import AttendanceRecordSerializer, BulkAttendanceSubmitSerializer
from apps.scheduling.models import ClassSession
from apps.batches.models import BatchEnrollment
from apps.accounts.permissions import IsAdminOrTutor
from apps.accounts.models import StudentProfile

class AttendanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'student_stats', 'session_sheet', 'change_status']:
            return [IsAuthenticated()]
        return [IsAdminOrTutor()]

    def get_queryset(self):
        user = self.request.user
        qs = AttendanceRecord.objects.select_related('session__batch', 'student__user').all()

        session_id = self.request.query_params.get('session_id')
        if session_id:
            qs = qs.filter(session_id=session_id)

        student_id = self.request.query_params.get('student_id')
        if student_id:
            qs = qs.filter(student_id=student_id)

        batch_id = self.request.query_params.get('batch_id')
        if batch_id:
            qs = qs.filter(session__batch_id=batch_id)

        # Scoping based on user role
        if user.role == 'TUTOR' and hasattr(user, 'tutor_profile'):
            return qs.filter(session__tutor=user.tutor_profile)
        elif user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            return qs.filter(student=user.student_profile)
        elif user.role == 'PARENT' and hasattr(user, 'parent_profile'):
            return qs.filter(student__parent=user.parent_profile)

        return qs

    @action(detail=False, methods=['get'])
    def session_sheet(self, request):
        """
        Retrieves the roster of enrolled students for a specific session,
        along with any existing marked attendance status.
        """
        session_id = request.query_params.get('session_id')
        if not session_id:
            return Response({'error': 'session_id query parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = ClassSession.objects.select_related('batch').get(id=session_id)
        except ClassSession.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Get all active enrollments for this batch
        enrollments = BatchEnrollment.objects.filter(
            batch=session.batch,
            status='ACTIVE'
        ).select_related('student__user')

        # Get existing attendance records
        existing_records = {
            rec.student_id: rec
            for rec in AttendanceRecord.objects.filter(session=session)
        }

        sheet = []
        for enr in enrollments:
            student = enr.student
            existing = existing_records.get(student.id)
            sheet.append({
                'student_id': student.id,
                'student_name': student.user.get_full_name() or student.user.username,
                'grade_level': student.grade_level,
                'current_status': existing.status if existing else 'PRESENT',
                'remarks': existing.remarks if existing else '',
                'marked': existing is not None,
            })

        return Response({
            'session_id': session.id,
            'batch_name': session.batch.name,
            'session_date': session.session_date,
            'topic_covered': session.topic_covered,
            'session_status': session.status,
            'students': sheet,
        })

    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrTutor])
    def bulk_mark(self, request):
        """
        Submits attendance for multiple students in a single session.
        """
        serializer = BulkAttendanceSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        session_id = data['session_id']
        try:
            session = ClassSession.objects.get(id=session_id)
        except ClassSession.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Update topic and status if supplied
        if data.get('topic_covered'):
            session.topic_covered = data['topic_covered']
        if data.get('session_status'):
            session.status = data['session_status']
        session.save()

        # Save each student record
        saved_records = []
        for item in data['records']:
            rec, _ = AttendanceRecord.objects.update_or_create(
                session=session,
                student_id=item['student_id'],
                defaults={
                    'status': item['status'],
                    'remarks': item.get('remarks', '')
                }
            )
            saved_records.append(rec)

        return Response({
            'message': f"Successfully recorded attendance for {len(saved_records)} students.",
            'session_id': session.id,
            'session_status': session.status
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def student_stats(self, request):
        """
        Computes attendance statistics (total sessions, present, absent, rate %)
        for a given student.
        """
        student_id = request.query_params.get('student_id')
        user = request.user

        if not student_id:
            if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
                student_id = user.student_profile.id
            elif user.role == 'PARENT' and hasattr(user, 'parent_profile'):
                first_child = user.parent_profile.children.first()
                if first_child:
                    student_id = first_child.id
                else:
                    return Response({
                        'student_id': None,
                        'total_sessions': 0,
                        'present_count': 0,
                        'absent_count': 0,
                        'late_count': 0,
                        'excused_count': 0,
                        'attendance_percentage': 100.0,
                    })
            else:
                return Response({'error': 'student_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        records = AttendanceRecord.objects.filter(student_id=student_id)
        batch_id = request.query_params.get('batch_id')
        if batch_id:
            records = records.filter(session__batch_id=batch_id)
        total = records.count()
        present = records.filter(status='PRESENT').count()
        absent = records.filter(status='ABSENT').count()
        late = records.filter(status='LATE').count()
        excused = records.filter(status='EXCUSED').count()

        # Exclude Excused from denominator; Late counts as full attendance
        effective_total = present + absent + late
        percentage = round(((present + late) / effective_total * 100), 1) if effective_total > 0 else 100.0

        return Response({
            'student_id': int(student_id),
            'total_sessions': total,
            'present_count': present,
            'absent_count': absent,
            'late_count': late,
            'excused_count': excused,
            'attendance_percentage': percentage,
        })

    @action(detail=True, methods=['post', 'patch'], permission_classes=[IsAuthenticated])
    def change_status(self, request, pk=None):
        """
        Allows enrolled students (with tutor/user assistance) or authorized tutors/admins
        to check an attendance record status and update it accordingly with audit remarks.
        """
        record = self.get_object()
        user = request.user
        new_status = request.data.get('status')
        remarks = (request.data.get('remarks') or '').strip()
        assisted_by = (request.data.get('assisted_by') or '').strip()

        if not new_status:
            return Response({'error': 'status is required.'}, status=status.HTTP_400_BAD_REQUEST)

        valid_statuses = [choice[0] for choice in AttendanceRecord.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'error': f"Invalid status '{new_status}'. Must be one of: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = record.status
        record.status = new_status

        # Document the change in remarks for clear audit trail
        if user.role == 'STUDENT':
            helper_str = f"with help of user: {assisted_by}" if assisted_by else "with user assistance"
            note_str = f" - Reason: {remarks}" if remarks else ""
            record.remarks = f"Status updated from {old_status} to {new_status} ({helper_str}){note_str}"
        elif user.role == 'PARENT':
            record.remarks = f"Parent submitted change from {old_status} to {new_status}. {remarks}".strip()
        else:
            role_label = 'Admin' if user.role == 'ADMIN' else 'Tutor'
            actor_name = user.get_full_name() or user.username
            note_str = f": {remarks}" if remarks else ""
            record.remarks = f"{remarks} (Updated by {role_label} {actor_name})".strip() if remarks else f"Status changed from {old_status} to {new_status} by {role_label} {actor_name}"

        record.save()
        return Response(AttendanceRecordSerializer(record).data, status=status.HTTP_200_OK)
