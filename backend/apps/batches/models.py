from django.db import models
from apps.accounts.models import TutorProfile, StudentProfile

class Batch(models.Model):
    class BatchType(models.TextChoices):
        COACHING_GROUP = 'COACHING_GROUP', 'Coaching Group Batch'
        HOME_TUTOR_1ON1 = 'HOME_TUTOR_1ON1', 'Home Tutor (1-on-1)'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    name = models.CharField(max_length=150, help_text="e.g. Grade 10 ICSE Physics - Batch A")
    batch_type = models.CharField(max_length=20, choices=BatchType.choices, default=BatchType.COACHING_GROUP)
    subject = models.CharField(max_length=100)
    grade_level = models.CharField(max_length=50, help_text="e.g. Grade 10, Grade 12")
    tutor = models.ForeignKey(TutorProfile, on_delete=models.CASCADE, related_name='batches')
    capacity = models.PositiveIntegerField(default=15, help_text="Maximum students (1 for 1-on-1)")
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Batches'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_batch_type_display()})"

    @property
    def enrolled_count(self):
        return self.enrollments.filter(status=BatchEnrollment.Status.ACTIVE).count()

    @property
    def is_full(self):
        return self.enrolled_count >= self.capacity


class BatchEnrollment(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        DROPPED = 'DROPPED', 'Dropped'
        COMPLETED = 'COMPLETED', 'Completed'

    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='enrollments')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_on = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['batch', 'student'], name='unique_batch_student_enrollment')
        ]
        ordering = ['-enrolled_on']

    def __str__(self):
        return f"{self.student} -> {self.batch.name} [{self.status}]"
