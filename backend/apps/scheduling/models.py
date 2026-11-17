from django.db import models
from apps.batches.models import Batch
from apps.accounts.models import TutorProfile

class ClassSchedule(models.Model):
    """Weekly recurring schedule template for a batch."""
    class DayOfWeek(models.IntegerChoices):
        MONDAY = 0, 'Monday'
        TUESDAY = 1, 'Tuesday'
        WEDNESDAY = 2, 'Wednesday'
        THURSDAY = 3, 'Thursday'
        FRIDAY = 4, 'Friday'
        SATURDAY = 5, 'Saturday'
        SUNDAY = 6, 'Sunday'

    class LocationType(models.TextChoices):
        COACHING_CENTER = 'COACHING_CENTER', 'Coaching Center Classroom'
        STUDENT_HOME = 'STUDENT_HOME', 'Student Home'
        ONLINE = 'ONLINE', 'Online Class'

    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.IntegerField(choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    location_type = models.CharField(max_length=20, choices=LocationType.choices, default=LocationType.COACHING_CENTER)
    room_or_address = models.CharField(max_length=255, blank=True, null=True, help_text="Room number, student home address, or video link")

    class Meta:
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        return f"{self.batch.name} - {self.get_day_of_week_display()} ({self.start_time} to {self.end_time})"


class ClassSession(models.Model):
    """Actual individual class occurrence instance."""
    class Status(models.TextChoices):
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        RESCHEDULED = 'RESCHEDULED', 'Rescheduled'

    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='sessions')
    tutor = models.ForeignKey(TutorProfile, on_delete=models.CASCADE, related_name='conducted_sessions')
    schedule_rule = models.ForeignKey(ClassSchedule, on_delete=models.SET_NULL, null=True, blank=True, related_name='instances')
    session_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    topic_covered = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    room_or_link = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-session_date', '-start_time']

    def __str__(self):
        return f"{self.batch.name} on {self.session_date} [{self.status}]"
