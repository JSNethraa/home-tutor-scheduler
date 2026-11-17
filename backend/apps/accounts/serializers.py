from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import TutorProfile, ParentProfile, StudentProfile

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        token['email'] = user.email
        token['full_name'] = user.get_full_name() or user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        profile_id = None
        profile_data = None
        if user.role == 'TUTOR' and hasattr(user, 'tutor_profile'):
            profile_id = user.tutor_profile.id
            profile_data = TutorProfileSerializer(user.tutor_profile).data
        elif user.role == 'PARENT' and hasattr(user, 'parent_profile'):
            profile_id = user.parent_profile.id
            profile_data = ParentProfileSerializer(user.parent_profile).data
        elif user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            profile_id = user.student_profile.id
            profile_data = StudentProfileSerializer(user.student_profile).data

        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.get_full_name() or user.username,
            'phone_number': user.phone_number,
            'profile_id': profile_id,
            'profile': profile_data,
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'role', 'phone_number', 'address', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class TutorProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.TUTOR),
        source='user',
        write_only=True,
        required=False
    )

    class Meta:
        model = TutorProfile
        fields = ['id', 'user', 'user_id', 'qualification', 'specialization', 'experience_years', 'hourly_rate', 'monthly_salary', 'bio']


class ParentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.PARENT),
        source='user',
        write_only=True,
        required=False
    )
    children_count = serializers.SerializerMethodField()

    class Meta:
        model = ParentProfile
        fields = ['id', 'user', 'user_id', 'occupation', 'emergency_contact', 'children_count']

    def get_children_count(self, obj):
        return obj.children.count()


class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.STUDENT),
        source='user',
        write_only=True,
        required=False
    )
    parent_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = ['id', 'user', 'user_id', 'parent', 'parent_name', 'grade_level', 'school_name', 'date_of_birth', 'admission_date']

    def get_parent_name(self, obj):
        if obj.parent and obj.parent.user:
            return obj.parent.user.get_full_name() or obj.parent.user.username
        return None


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)
