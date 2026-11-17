from rest_framework import serializers
from .models import ClassSchedule, ClassSession
from apps.batches.serializers import BatchSerializer
from apps.accounts.serializers import TutorProfileSerializer
from apps.batches.models import Batch
from apps.accounts.models import TutorProfile

class ClassScheduleSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    batch_name = serializers.CharField(source='batch.name', read_only=True)

    class Meta:
        model = ClassSchedule
        fields = [
            'id', 'batch', 'batch_name', 'day_of_week', 'day_name',
            'start_time', 'end_time', 'location_type', 'room_or_address'
        ]


class ClassSessionSerializer(serializers.ModelSerializer):
    batch = BatchSerializer(read_only=True)
    batch_id = serializers.PrimaryKeyRelatedField(
        queryset=Batch.objects.all(),
        source='batch',
        write_only=True
    )
    tutor = TutorProfileSerializer(read_only=True)
    tutor_id = serializers.PrimaryKeyRelatedField(
        queryset=TutorProfile.objects.all(),
        source='tutor',
        write_only=True,
        required=False
    )
    attendance_taken = serializers.SerializerMethodField()

    class Meta:
        model = ClassSession
        fields = [
            'id', 'batch', 'batch_id', 'tutor', 'tutor_id', 'schedule_rule',
            'session_date', 'start_time', 'end_time', 'topic_covered',
            'status', 'room_or_link', 'notes', 'attendance_taken', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_attendance_taken(self, obj):
        return obj.attendance_records.exists()


class ConflictCheckSerializer(serializers.Serializer):
    batch_id = serializers.IntegerField(required=False, allow_null=True)
    tutor_id = serializers.IntegerField(required=True)
    session_date = serializers.DateField(required=True)
    start_time = serializers.TimeField(required=True)
    end_time = serializers.TimeField(required=True)
    room_or_link = serializers.CharField(required=False, allow_blank=True, default='')
    exclude_session_id = serializers.IntegerField(required=False, allow_null=True)


class GenerateSessionsSerializer(serializers.Serializer):
    batch_id = serializers.IntegerField(required=True)
    weeks_ahead = serializers.IntegerField(default=4, min_value=1, max_value=12)
