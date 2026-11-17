from datetime import datetime
from apps.scheduling.models import ClassSession
from apps.batches.models import BatchEnrollment

def check_time_overlap(start1, end1, start2, end2):
    """Returns True if time window 1 overlaps with time window 2."""
    return max(start1, start2) < min(end1, end2)

def check_tutor_conflict(tutor_id, session_date, start_time, end_time, exclude_session_id=None):
    """
    Checks if a tutor is already scheduled for another active class on session_date
    overlapping with the requested [start_time, end_time].
    """
    qs = ClassSession.objects.filter(
        tutor_id=tutor_id,
        session_date=session_date,
        status__in=['SCHEDULED', 'COMPLETED', 'RESCHEDULED']
    )
    if exclude_session_id:
        qs = qs.exclude(id=exclude_session_id)

    conflicts = []
    for session in qs:
        if check_time_overlap(start_time, end_time, session.start_time, session.end_time):
            conflicts.append({
                'type': 'TUTOR_COLLISION',
                'message': f"Tutor is already booked for '{session.batch.name}' ({session.start_time.strftime('%H:%M')} - {session.end_time.strftime('%H:%M')}).",
                'conflicting_session_id': session.id,
            })
    return conflicts

def check_room_conflict(room_or_link, session_date, start_time, end_time, exclude_session_id=None):
    """
    Checks if a physical classroom or room is already booked at that time.
    """
    if not room_or_link or not room_or_link.strip():
        return []

    qs = ClassSession.objects.filter(
        room_or_link__iexact=room_or_link.strip(),
        session_date=session_date,
        status__in=['SCHEDULED', 'COMPLETED', 'RESCHEDULED']
    )
    if exclude_session_id:
        qs = qs.exclude(id=exclude_session_id)

    conflicts = []
    for session in qs:
        if check_time_overlap(start_time, end_time, session.start_time, session.end_time):
            conflicts.append({
                'type': 'ROOM_COLLISION',
                'message': f"Room/Location '{room_or_link}' is already occupied by batch '{session.batch.name}'.",
                'conflicting_session_id': session.id,
            })
    return conflicts

def check_student_conflict(batch_id, session_date, start_time, end_time, exclude_session_id=None):
    """
    Checks if any student enrolled in batch_id is simultaneously booked in another session.
    """
    student_ids = BatchEnrollment.objects.filter(
        batch_id=batch_id,
        status='ACTIVE'
    ).values_list('student_id', flat=True)

    if not student_ids:
        return []

    concurrent_sessions = ClassSession.objects.filter(
        session_date=session_date,
        status__in=['SCHEDULED', 'COMPLETED', 'RESCHEDULED'],
        batch__enrollments__student_id__in=student_ids,
        batch__enrollments__status='ACTIVE'
    ).exclude(batch_id=batch_id).distinct()

    if exclude_session_id:
        concurrent_sessions = concurrent_sessions.exclude(id=exclude_session_id)

    conflicts = []
    for session in concurrent_sessions:
        if check_time_overlap(start_time, end_time, session.start_time, session.end_time):
            conflicts.append({
                'type': 'STUDENT_COLLISION',
                'message': f"Enrolled students have an overlapping class in batch '{session.batch.name}' ({session.start_time.strftime('%H:%M')} - {session.end_time.strftime('%H:%M')}).",
                'conflicting_session_id': session.id,
            })
    return conflicts

def validate_scheduling_conflicts(batch_id, tutor_id, session_date, start_time, end_time, room_or_link=None, exclude_session_id=None):
    """
    Consolidated conflict evaluation returning conflict details and status.
    """
    conflicts = []
    conflicts.extend(check_tutor_conflict(tutor_id, session_date, start_time, end_time, exclude_session_id))
    conflicts.extend(check_room_conflict(room_or_link, session_date, start_time, end_time, exclude_session_id))
    if batch_id:
        conflicts.extend(check_student_conflict(batch_id, session_date, start_time, end_time, exclude_session_id))

    return {
        'has_conflict': len(conflicts) > 0,
        'conflicts': conflicts
    }
