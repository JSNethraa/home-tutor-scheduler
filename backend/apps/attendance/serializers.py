from rest_framework import serializers
from .models import AttendanceRecord
from apps.accounts.serializers import StudentProfileSerializer

class AttendanceRecordSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)
    student_id = serializers.IntegerField(write_only=True, required=False)
    session_id = serializers.IntegerField(write_only=True, required=False)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    session_date = serializers.DateField(source='session.session_date', read_only=True)
    session_time = serializers.SerializerMethodField()
    topic_covered = serializers.CharField(source='session.topic_covered', read_only=True)
    batch_id = serializers.IntegerField(source='session.batch.id', read_only=True)
    batch_name = serializers.CharField(source='session.batch.name', read_only=True)
    tutor_name = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'session_id', 'student', 'student_id', 'status',
            'status_display', 'remarks', 'session_date', 'session_time',
            'topic_covered', 'batch_id', 'batch_name', 'tutor_name', 'marked_at'
        ]
        read_only_fields = ['id', 'marked_at']

    def get_session_time(self, obj):
        if obj.session and obj.session.start_time and obj.session.end_time:
            return f"{obj.session.start_time.strftime('%H:%M')} - {obj.session.end_time.strftime('%H:%M')}"
        return ''

    def get_tutor_name(self, obj):
        if obj.session and obj.session.tutor and obj.session.tutor.user:
            return obj.session.tutor.user.get_full_name() or obj.session.tutor.user.username
        return 'Tutor'


class BulkAttendanceItemSerializer(serializers.Serializer):
    student_id = serializers.IntegerField(required=True)
    status = serializers.ChoiceField(choices=AttendanceRecord.Status.choices, default=AttendanceRecord.Status.PRESENT)
    remarks = serializers.CharField(required=False, allow_blank=True, default='')


class BulkAttendanceSubmitSerializer(serializers.Serializer):
    session_id = serializers.IntegerField(required=True)
    topic_covered = serializers.CharField(required=False, allow_blank=True, default='')
    session_status = serializers.CharField(required=False, default='COMPLETED')
    records = BulkAttendanceItemSerializer(many=True)
