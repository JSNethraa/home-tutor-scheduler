"""
Database Seeding Script for Home Tutor & Coaching Batch Scheduler.
Pre-populates realistic data for college demonstration.
"""

import os
import django
from datetime import date, time, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.accounts.models import TutorProfile, ParentProfile, StudentProfile
from apps.batches.models import Batch, BatchEnrollment
from apps.scheduling.models import ClassSchedule, ClassSession
from apps.attendance.models import AttendanceRecord
from apps.fees.models import FeeInvoice, FeePayment
from apps.reports.models import Assessment, AssessmentResult, ProgressReport

User = get_user_model()

def seed_database():
    print("--- Starting Database Seeding ---")

    # 1. Create Admin
    admin_user, _ = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@scheduler.edu',
            'first_name': 'System',
            'last_name': 'Administrator',
            'role': User.Role.ADMIN,
            'is_staff': True,
            'is_superuser': True,
        }
    )
    admin_user.set_password('admin123')
    admin_user.save()
    print("✓ Created Admin: admin / admin123")

    # 2. Create Tutors
    tutor_u1, _ = User.objects.get_or_create(
        username='tutor_ramesh',
        defaults={
            'email': 'ramesh@scheduler.edu',
            'first_name': 'Dr. Ramesh',
            'last_name': 'Gupta',
            'role': User.Role.TUTOR,
            'phone_number': '+91-9876543210'
        }
    )
    tutor_u1.set_password('tutor123')
    tutor_u1.save()

    tutor_prof1, _ = TutorProfile.objects.get_or_create(
        user=tutor_u1,
        defaults={
            'qualification': 'Ph.D in Applied Physics',
            'specialization': 'Physics, Mechanics, Optics',
            'experience_years': 8.5,
            'hourly_rate': 600.00,
            'monthly_salary': 35000.00,
            'bio': 'Senior Physics faculty specializing in Class 10-12 CBSE & ICSE board coaching.'
        }
    )

    tutor_u2, _ = User.objects.get_or_create(
        username='tutor_priya',
        defaults={
            'email': 'priya@scheduler.edu',
            'first_name': 'Prof. Priya',
            'last_name': 'Menon',
            'role': User.Role.TUTOR,
            'phone_number': '+91-9876543211'
        }
    )
    tutor_u2.set_password('tutor123')
    tutor_u2.save()

    tutor_prof2, _ = TutorProfile.objects.get_or_create(
        user=tutor_u2,
        defaults={
            'qualification': 'M.Sc Mathematics, B.Ed',
            'specialization': 'Calculus, Algebra, Geometry',
            'experience_years': 5.0,
            'hourly_rate': 550.00,
            'monthly_salary': 30000.00,
            'bio': 'Passionate mathematics educator committed to conceptual clarity.'
        }
    )
    print("✓ Created Tutors: tutor_ramesh, tutor_priya (Password: tutor123)")

    # 3. Create Parents
    parent_u1, _ = User.objects.get_or_create(
        username='parent_sharma',
        defaults={
            'email': 'sharma.parent@gmail.com',
            'first_name': 'Suresh',
            'last_name': 'Sharma',
            'role': User.Role.PARENT,
            'phone_number': '+91-9123456780',
            'address': 'Plot 42, Gandhi Nagar, Delhi'
        }
    )
    parent_u1.set_password('parent123')
    parent_u1.save()

    parent_prof1, _ = ParentProfile.objects.get_or_create(
        user=parent_u1,
        defaults={
            'occupation': 'Civil Engineer',
            'emergency_contact': '+91-9123456789'
        }
    )

    parent_u2, _ = User.objects.get_or_create(
        username='parent_verma',
        defaults={
            'email': 'verma.parent@gmail.com',
            'first_name': 'Kavita',
            'last_name': 'Verma',
            'role': User.Role.PARENT,
            'phone_number': '+91-9123456799',
            'address': 'B-12 Lakeview Apts, Delhi'
        }
    )
    parent_u2.set_password('parent123')
    parent_u2.save()

    parent_prof2, _ = ParentProfile.objects.get_or_create(
        user=parent_u2,
        defaults={
            'occupation': 'Financial Analyst',
            'emergency_contact': '+91-9123456798'
        }
    )
    print("✓ Created Parents: parent_sharma, parent_verma (Password: parent123)")

    # 4. Create Students
    student_u1, _ = User.objects.get_or_create(
        username='student_rohit',
        defaults={
            'email': 'rohit.sharma@example.com',
            'first_name': 'Rohit',
            'last_name': 'Sharma',
            'role': User.Role.STUDENT,
            'phone_number': '+91-9988776655'
        }
    )
    student_u1.set_password('student123')
    student_u1.save()

    student_prof1, _ = StudentProfile.objects.get_or_create(
        user=student_u1,
        defaults={
            'parent': parent_prof1,
            'grade_level': 'Grade 10',
            'school_name': 'Delhi Public School',
            'date_of_birth': date(2008, 5, 14)
        }
    )

    student_u2, _ = User.objects.get_or_create(
        username='student_ananya',
        defaults={
            'email': 'ananya.verma@example.com',
            'first_name': 'Ananya',
            'last_name': 'Verma',
            'role': User.Role.STUDENT,
            'phone_number': '+91-9988776656'
        }
    )
    student_u2.set_password('student123')
    student_u2.save()

    student_prof2, _ = StudentProfile.objects.get_or_create(
        user=student_u2,
        defaults={
            'parent': parent_prof2,
            'grade_level': 'Grade 12',
            'school_name': 'St. Xavier High School',
            'date_of_birth': date(2006, 9, 21)
        }
    )

    student_u3, _ = User.objects.get_or_create(
        username='student_vikram',
        defaults={
            'email': 'vikram.s@example.com',
            'first_name': 'Vikram',
            'last_name': 'Singh',
            'role': User.Role.STUDENT,
            'phone_number': '+91-9988776657'
        }
    )
    student_u3.set_password('student123')
    student_u3.save()

    student_prof3, _ = StudentProfile.objects.get_or_create(
        user=student_u3,
        defaults={
            'parent': parent_prof1,
            'grade_level': 'Grade 10',
            'school_name': 'Delhi Public School',
            'date_of_birth': date(2008, 11, 2)
        }
    )
    print("✓ Created Students: student_rohit, student_ananya, student_vikram (Password: student123)")

    # 5. Create Batches
    batch1, _ = Batch.objects.get_or_create(
        name='Class 10 CBSE Physics - Batch A',
        defaults={
            'batch_type': Batch.BatchType.COACHING_GROUP,
            'subject': 'Physics',
            'grade_level': 'Grade 10',
            'tutor': tutor_prof1,
            'capacity': 15,
            'monthly_fee': 2500.00,
            'start_date': date(2026, 1, 10),
            'status': Batch.Status.ACTIVE,
            'description': 'Comprehensive CBSE board exam syllabus covering Electricity, Light & Magnetism.'
        }
    )

    batch2, _ = Batch.objects.get_or_create(
        name='Class 12 JEE Advanced Calculus',
        defaults={
            'batch_type': Batch.BatchType.COACHING_GROUP,
            'subject': 'Mathematics',
            'grade_level': 'Grade 12',
            'tutor': tutor_prof2,
            'capacity': 12,
            'monthly_fee': 3500.00,
            'start_date': date(2026, 1, 15),
            'status': Batch.Status.ACTIVE,
            'description': 'Intensive calculus problem-solving batch for competitive engineering entrance.'
        }
    )

    batch3, _ = Batch.objects.get_or_create(
        name='Home Tutoring: Grade 10 Science (1-on-1)',
        defaults={
            'batch_type': Batch.BatchType.HOME_TUTOR_1ON1,
            'subject': 'Science & Math',
            'grade_level': 'Grade 10',
            'tutor': tutor_prof1,
            'capacity': 1,
            'monthly_fee': 6000.00,
            'start_date': date(2026, 2, 1),
            'status': Batch.Status.ACTIVE,
            'description': 'Personalized doorstep home tutoring session at student residence.'
        }
    )
    print("✓ Created 3 Batches (Group Coaching + 1-on-1 Home Tutoring)")

    # 6. Enroll Students
    BatchEnrollment.objects.get_or_create(batch=batch1, student=student_prof1)
    BatchEnrollment.objects.get_or_create(batch=batch1, student=student_prof3)
    BatchEnrollment.objects.get_or_create(batch=batch2, student=student_prof2)
    BatchEnrollment.objects.get_or_create(batch=batch3, student=student_prof1)
    print("✓ Enrolled Students into Batches")

    # 7. Create Recurring Weekly Schedules
    # Batch 1: Mon, Wed, Fri 5:00 PM - 6:30 PM (Classroom 101)
    for day in [0, 2, 4]:
        ClassSchedule.objects.get_or_create(
            batch=batch1,
            day_of_week=day,
            defaults={
                'start_time': time(17, 0),
                'end_time': time(18, 30),
                'location_type': ClassSchedule.LocationType.COACHING_CENTER,
                'room_or_address': 'Room 101, Main Block'
            }
        )

    # Batch 2: Tue, Thu, Sat 6:00 PM - 7:30 PM (Classroom 102)
    for day in [1, 3, 5]:
        ClassSchedule.objects.get_or_create(
            batch=batch2,
            day_of_week=day,
            defaults={
                'start_time': time(18, 0),
                'end_time': time(19, 30),
                'location_type': ClassSchedule.LocationType.COACHING_CENTER,
                'room_or_address': 'Room 102, Science Wing'
            }
        )

    # Batch 3 (Home Tutor): Sunday 10:00 AM - 12:00 PM (Student Home)
    ClassSchedule.objects.get_or_create(
        batch=batch3,
        day_of_week=6,
        defaults={
            'start_time': time(10, 0),
            'end_time': time(12, 0),
            'location_type': ClassSchedule.LocationType.STUDENT_HOME,
            'room_or_address': 'Plot 42, Gandhi Nagar, Delhi'
        }
    )
    print("✓ Created Recurring Timetables")

    # 8. Create Class Sessions (Past & Upcoming)
    today = date.today()
    past_session1, _ = ClassSession.objects.get_or_create(
        batch=batch1,
        session_date=today - timedelta(days=5),
        start_time=time(17, 0),
        defaults={
            'tutor': tutor_prof1,
            'end_time': time(18, 30),
            'topic_covered': 'Electric Current & Ohm’s Law Practical Numerical Problems',
            'status': ClassSession.Status.COMPLETED,
            'room_or_link': 'Room 101'
        }
    )

    past_session2, _ = ClassSession.objects.get_or_create(
        batch=batch1,
        session_date=today - timedelta(days=2),
        start_time=time(17, 0),
        defaults={
            'tutor': tutor_prof1,
            'end_time': time(18, 30),
            'topic_covered': 'Resistance in Series and Parallel Circuits',
            'status': ClassSession.Status.COMPLETED,
            'room_or_link': 'Room 101'
        }
    )

    upcoming_session, _ = ClassSession.objects.get_or_create(
        batch=batch1,
        session_date=today + timedelta(days=2),
        start_time=time(17, 0),
        defaults={
            'tutor': tutor_prof1,
            'end_time': time(18, 30),
            'topic_covered': 'Heating Effects of Electric Current and Joule’s Law',
            'status': ClassSession.Status.SCHEDULED,
            'room_or_link': 'Room 101'
        }
    )
    print("✓ Created Class Sessions")

    # 9. Attendance Records
    AttendanceRecord.objects.get_or_create(
        session=past_session1,
        student=student_prof1,
        defaults={'status': AttendanceRecord.Status.PRESENT, 'remarks': 'Active participant'}
    )
    AttendanceRecord.objects.get_or_create(
        session=past_session1,
        student=student_prof3,
        defaults={'status': AttendanceRecord.Status.PRESENT, 'remarks': 'On time'}
    )
    AttendanceRecord.objects.get_or_create(
        session=past_session2,
        student=student_prof1,
        defaults={'status': AttendanceRecord.Status.PRESENT, 'remarks': 'Solved board questions'}
    )
    AttendanceRecord.objects.get_or_create(
        session=past_session2,
        student=student_prof3,
        defaults={'status': AttendanceRecord.Status.LATE, 'remarks': 'Arrived 10 min late with note'}
    )
    print("✓ Recorded Student Attendance")

    # 10. Fee Invoices and Installment Payments
    inv1, _ = FeeInvoice.objects.get_or_create(
        invoice_number='INV-2026-101',
        defaults={
            'student': student_prof1,
            'batch': batch1,
            'billing_month': 'November 2026',
            'amount_due': 2500.00,
            'due_date': today + timedelta(days=10),
            'status': FeeInvoice.Status.PAID
        }
    )

    FeePayment.objects.get_or_create(
        invoice=inv1,
        receipt_number='REC-9941A2BC',
        defaults={
            'amount_paid': 2500.00,
            'payment_date': today - timedelta(days=3),
            'payment_method': FeePayment.PaymentMethod.UPI,
            'transaction_reference': 'UPI-REF-8947219084',
            'recorded_by': admin_user,
            'notes': 'Paid in full via GPay QR'
        }
    )

    inv2, _ = FeeInvoice.objects.get_or_create(
        invoice_number='INV-2026-102',
        defaults={
            'student': student_prof2,
            'batch': batch2,
            'billing_month': 'November 2026',
            'amount_due': 3500.00,
            'due_date': today + timedelta(days=5),
            'status': FeeInvoice.Status.PARTIALLY_PAID
        }
    )

    FeePayment.objects.get_or_create(
        invoice=inv2,
        receipt_number='REC-7731F89A',
        defaults={
            'amount_paid': 2000.00,
            'payment_date': today - timedelta(days=1),
            'payment_method': FeePayment.PaymentMethod.BANK_TRANSFER,
            'transaction_reference': 'NEFT/HDFC/8847291',
            'recorded_by': admin_user,
            'notes': 'First installment paid. Balance due next week.'
        }
    )
    inv2.update_status()
    print("✓ Generated Fee Invoices and Receipts")

    # 11. Assessments and Results
    assessment, _ = Assessment.objects.get_or_create(
        batch=batch1,
        title='Monthly Unit Test 1: Electricity & Circuits',
        defaults={
            'max_marks': 50.00,
            'test_date': today - timedelta(days=4),
            'syllabus_covered': 'Ohm’s law, series/parallel combinations, and heating effects.'
        }
    )

    AssessmentResult.objects.get_or_create(
        assessment=assessment,
        student=student_prof1,
        defaults={
            'marks_obtained': 46.50,
            'feedback': 'Excellent conceptual clarity and precise calculation diagrams.'
        }
    )

    AssessmentResult.objects.get_or_create(
        assessment=assessment,
        student=student_prof3,
        defaults={
            'marks_obtained': 39.00,
            'feedback': 'Good overall score. Needs more practice on power formula derivations.'
        }
    )

    # 12. Progress Report
    ProgressReport.objects.get_or_create(
        student=student_prof1,
        batch=batch1,
        defaults={
            'period_start': today - timedelta(days=30),
            'period_end': today,
            'attendance_percentage': 96.00,
            'average_test_score': 93.00,
            'tutor_remarks': 'Rohit demonstrates high analytical interest in Physics. Consistently submits homework on time and asks insightful questions.',
            'strengths': 'Strong foundation in circuit formulas and mathematical derivations.',
            'areas_for_improvement': 'Work on structured presentation of long-answer board exam questions.'
        }
    )
    print("✓ Generated Academic Assessments & Parent Progress Reports")
    print("\n--- Seeding Successfully Completed! ---")

if __name__ == '__main__':
    seed_database()
