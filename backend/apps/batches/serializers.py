from rest_framework import serializers
from .models import Batch, BatchEnrollment
from apps.accounts.serializers import TutorProfileSerializer, StudentProfileSerializer
from apps.accounts.models import TutorProfile, StudentProfile

class EnrolledStudentSummarySerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source='student.id')
    student_name = serializers.SerializerMethodField()
    grade_level = serializers.CharField(source='student.grade_level')
    phone_number = serializers.CharField(source='student.user.phone_number', default='')
    attendance_stats = serializers.SerializerMethodField()

    class Meta:
        model = BatchEnrollment
        fields = [
            'id', 'student_id', 'student_name', 'grade_level',
            'phone_number', 'enrolled_on', 'status', 'attendance_stats'
        ]

    def get_student_name(self, obj):
        return obj.student.user.get_full_name() or obj.student.user.username

    def get_attendance_stats(self, obj):
        from apps.attendance.models import AttendanceRecord
        records = AttendanceRecord.objects.filter(student=obj.student, session__batch=obj.batch)
        total = records.count()
        present = records.filter(status='PRESENT').count()
        late = records.filter(status='LATE').count()
        absent = records.filter(status='ABSENT').count()
        # Exclude Excused from denominator; Late counts as full attendance
        effective_total = present + absent + late
        percentage = round(((present + late) / effective_total * 100), 1) if effective_total > 0 else 100.0
        return {
            'total': total,
            'present': present,
            'absent': absent,
            'late': late,
            'percentage': percentage,
        }


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
    enrolled_students = serializers.SerializerMethodField()

    class Meta:
        model = Batch
        fields = [
            'id', 'name', 'batch_type', 'subject', 'grade_level',
            'tutor', 'tutor_id', 'capacity', 'enrolled_count', 'is_full',
            'monthly_fee', 'start_date', 'end_date', 'status', 'description',
            'enrolled_students', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'enrolled_students']

    def get_enrolled_students(self, obj):
        active_enrollments = obj.enrollments.filter(status=BatchEnrollment.Status.ACTIVE).select_related('student__user')
        return EnrolledStudentSummarySerializer(active_enrollments, many=True).data


class BatchDetailSerializer(BatchSerializer):
    enrollments = BatchEnrollmentSerializer(many=True, read_only=True)

    class Meta(BatchSerializer.Meta):
        fields = BatchSerializer.Meta.fields + ['enrollments']
