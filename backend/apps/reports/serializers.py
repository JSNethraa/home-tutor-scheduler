from rest_framework import serializers
from .models import Assessment, AssessmentResult, ProgressReport
from apps.batches.serializers import BatchSerializer
from apps.accounts.serializers import StudentProfileSerializer
from apps.batches.models import Batch
from apps.accounts.models import StudentProfile

class AssessmentResultSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=StudentProfile.objects.all(),
        source='student',
        write_only=True
    )
    percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = AssessmentResult
        fields = ['id', 'assessment', 'student', 'student_id', 'marks_obtained', 'percentage', 'feedback']


class AssessmentSerializer(serializers.ModelSerializer):
    batch = BatchSerializer(read_only=True)
    batch_id = serializers.PrimaryKeyRelatedField(
        queryset=Batch.objects.all(),
        source='batch',
        write_only=True
    )
    results = AssessmentResultSerializer(many=True, read_only=True)

    class Meta:
        model = Assessment
        fields = ['id', 'batch', 'batch_id', 'title', 'max_marks', 'test_date', 'syllabus_covered', 'results', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProgressReportSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=StudentProfile.objects.all(),
        source='student',
        write_only=True
    )
    batch = BatchSerializer(read_only=True)
    batch_id = serializers.PrimaryKeyRelatedField(
        queryset=Batch.objects.all(),
        source='batch',
        write_only=True
    )

    class Meta:
        model = ProgressReport
        fields = [
            'id', 'student', 'student_id', 'batch', 'batch_id',
            'period_start', 'period_end', 'attendance_percentage',
            'average_test_score', 'tutor_remarks', 'strengths',
            'areas_for_improvement', 'generated_at'
        ]
        read_only_fields = ['id', 'generated_at']
