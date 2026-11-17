from django.db import models
from apps.batches.models import Batch
from apps.accounts.models import StudentProfile

class Assessment(models.Model):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='assessments')
    title = models.CharField(max_length=150, help_text="e.g. Monthly Unit Test - Calculus & Vectors")
    max_marks = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    test_date = models.DateField()
    syllabus_covered = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-test_date']

    def __str__(self):
        return f"{self.title} ({self.batch.name})"


class AssessmentResult(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='results')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='assessment_results')
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2)
    feedback = models.TextField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['assessment', 'student'], name='unique_assessment_student_result')
        ]
        ordering = ['-marks_obtained']

    def __str__(self):
        return f"{self.student} - {self.assessment.title}: {self.marks_obtained}/{self.assessment.max_marks}"

    @property
    def percentage(self):
        if self.assessment.max_marks > 0:
            return round((float(self.marks_obtained) / float(self.assessment.max_marks)) * 100, 1)
        return 0.0


class ProgressReport(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='progress_reports')
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='progress_reports')
    period_start = models.DateField()
    period_end = models.DateField()
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    average_test_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    tutor_remarks = models.TextField(help_text="General comments from the tutor")
    strengths = models.TextField(blank=True, null=True, help_text="Key academic strengths noticed")
    areas_for_improvement = models.TextField(blank=True, null=True, help_text="Topics requiring further practice")
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-generated_at']

    def __str__(self):
        return f"Report: {self.student} - {self.batch.name} ({self.period_start} to {self.period_end})"
