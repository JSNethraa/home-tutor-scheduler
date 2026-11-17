from rest_framework import serializers
from .models import AttendanceRecord
from apps.accounts.serializers import StudentProfileSerializer

class AttendanceRecordSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)
    student_id = serializers.IntegerField(write_only=True)
    session_id = serializers.IntegerField(write_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = ['id', 'session_id', 'student', 'student_id', 'status', 'status_display', 'remarks', 'marked_at']
        read_only_fields = ['id', 'marked_at']


class BulkAttendanceItemSerializer(serializers.Serializer):
    student_id = serializers.IntegerField(required=True)
    status = serializers.ChoiceField(choices=AttendanceRecord.Status.choices, default=AttendanceRecord.Status.PRESENT)
    remarks = serializers.CharField(required=False, allow_blank=True, default='')


class BulkAttendanceSubmitSerializer(serializers.Serializer):
    session_id = serializers.IntegerField(required=True)
    topic_covered = serializers.CharField(required=False, allow_blank=True, default='')
    session_status = serializers.CharField(required=False, default='COMPLETED')
    records = BulkAttendanceItemSerializer(many=True)
