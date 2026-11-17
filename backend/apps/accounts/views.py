from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .models import TutorProfile, ParentProfile, StudentProfile
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    TutorProfileSerializer,
    ParentProfileSerializer,
    StudentProfileSerializer,
    ChangePasswordSerializer,
)
from .permissions import IsAdminUserRole, IsAdminOrTutor

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user)
        data = serializer.data

        # Add profile details
        profile_id = None
        if user.role == 'TUTOR' and hasattr(user, 'tutor_profile'):
            profile_id = user.tutor_profile.id
            data['profile'] = TutorProfileSerializer(user.tutor_profile).data
        elif user.role == 'PARENT' and hasattr(user, 'parent_profile'):
            profile_id = user.parent_profile.id
            data['profile'] = ParentProfileSerializer(user.parent_profile).data
        elif user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            profile_id = user.student_profile.id
            data['profile'] = StudentProfileSerializer(user.student_profile).data
        else:
            data['profile'] = None

        data['profile_id'] = profile_id

        return Response(data)


class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user

        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': ['Wrong password.']}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)


class TutorViewSet(viewsets.ModelViewSet):
    queryset = TutorProfile.objects.select_related('user').all()
    serializer_class = TutorProfileSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUserRole()]


class ParentViewSet(viewsets.ModelViewSet):
    queryset = ParentProfile.objects.select_related('user').all()
    serializer_class = ParentProfileSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUserRole()]


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentProfileSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'my_children']:
            return [IsAuthenticated()]
        return [IsAdminOrTutor()]

    def get_queryset(self):
        user = self.request.user
        queryset = StudentProfile.objects.select_related('user', 'parent__user').all()

        # If parent, filter to only their children
        if user.role == 'PARENT' and hasattr(user, 'parent_profile'):
            return queryset.filter(parent=user.parent_profile)

        # If student, return only their own profile
        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            return queryset.filter(id=user.student_profile.id)

        # Admin and Tutor see all students
        return queryset

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_children(self, request):
        if request.user.role != 'PARENT' or not hasattr(request.user, 'parent_profile'):
            return Response({'detail': 'Only parents have children accounts linked.'}, status=status.HTTP_400_BAD_REQUEST)

        children = StudentProfile.objects.filter(parent=request.user.parent_profile).select_related('user')
        serializer = self.get_serializer(children, many=True)
        return Response(serializer.data)
