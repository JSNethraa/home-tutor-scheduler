from rest_framework import serializers
from .models import Batch, BatchEnrollment
from apps.accounts.serializers import TutorProfileSerializer, StudentProfileSerializer
from apps.accounts.models import TutorProfile, StudentProfile

class BatchEnrollmentSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=StudentProfile.objects.all(),
        source='student',
        write_only=True
    )

    class Meta:
        model = BatchEnrollment
        fields = ['id', 'batch', 'student', 'student_id', 'enrolled_on', 'status']
        read_only_fields = ['id', 'enrolled_on']


class BatchSerializer(serializers.ModelSerializer):
    tutor = TutorProfileSerializer(read_only=True)
    tutor_id = serializers.PrimaryKeyRelatedField(
        queryset=TutorProfile.objects.all(),
        source='tutor',
        write_only=True
    )
    enrolled_count = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)

    class Meta:
        model = Batch
        fields = [
            'id', 'name', 'batch_type', 'subject', 'grade_level',
            'tutor', 'tutor_id', 'capacity', 'enrolled_count', 'is_full',
            'monthly_fee', 'start_date', 'end_date', 'status', 'description', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class BatchDetailSerializer(BatchSerializer):
    enrollments = BatchEnrollmentSerializer(many=True, read_only=True)

    class Meta(BatchSerializer.Meta):
        fields = BatchSerializer.Meta.fields + ['enrollments']
