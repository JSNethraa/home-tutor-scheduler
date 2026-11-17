from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin / Institute Coordinator'
        TUTOR = 'TUTOR', 'Tutor'
        PARENT = 'PARENT', 'Parent'
        STUDENT = 'STUDENT', 'Student'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_admin_role(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    @property
    def is_tutor_role(self):
        return self.role == self.Role.TUTOR

    @property
    def is_parent_role(self):
        return self.role == self.Role.PARENT

    @property
    def is_student_role(self):
        return self.role == self.Role.STUDENT


class TutorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tutor_profile')
    qualification = models.CharField(max_length=200, blank=True, default='')
    specialization = models.TextField(help_text="Subjects taught, e.g. Mathematics, Physics")
    experience_years = models.DecimalField(max_digits=4, decimal_places=1, default=0.0)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    monthly_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    bio = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Tutor: {self.user.get_full_name() or self.user.username}"


class ParentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='parent_profile')
    occupation = models.CharField(max_length=150, blank=True, null=True)
    emergency_contact = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"Parent: {self.user.get_full_name() or self.user.username}"


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    parent = models.ForeignKey(ParentProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    grade_level = models.CharField(max_length=50, help_text="e.g. Grade 10, Grade 12")
    school_name = models.CharField(max_length=200, blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    admission_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Student: {self.user.get_full_name() or self.user.username} ({self.grade_level})"
