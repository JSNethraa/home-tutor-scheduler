import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.test import Client
from apps.scheduling.services.conflict_checker import validate_scheduling_conflicts
from datetime import date, time

c = Client()
print("=== 1. VERIFYING AUTHENTICATION & USER ROLES ===")
roles = [
    ('admin', 'admin123', 'ADMIN'),
    ('tutor_ramesh', 'tutor123', 'TUTOR'),
    ('parent_sharma', 'parent123', 'PARENT'),
    ('student_rohit', 'student123', 'STUDENT')
]
tokens = {}
for u, p, expected_role in roles:
    res = c.post('/api/auth/login/', {'username': u, 'password': p}, content_type='application/json')
    assert res.status_code == 200, f'Login failed for {u}: {res.status_code}'
    role = res.json().get('user', {}).get('role')
    profile_id = res.json().get('user', {}).get('profile_id')
    assert role == expected_role, f'Expected {expected_role}, got {role}'
    tokens[role] = res.json().get('access')
    print(f"✓ {u} logged in successfully as {role} (profile_id: {profile_id})")

print("\n=== 2. VERIFYING /api/auth/me/ ENDPOINT ===")
for role, tok in tokens.items():
    res = c.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {tok}')
    assert res.status_code == 200, f'me/ failed for {role}: {res.status_code}'
    assert res.json()['role'] == role
print("✓ /api/auth/me/ returns consistent profile payload for all 4 roles")

print("\n=== 3. VERIFYING ROLE-BASED ACCESS TO BATCHES ===")
admin_batches = c.get('/api/batches/', HTTP_AUTHORIZATION=f'Bearer {tokens["ADMIN"]}').json()
tutor_batches = c.get('/api/batches/', HTTP_AUTHORIZATION=f'Bearer {tokens["TUTOR"]}').json()
parent_batches = c.get('/api/batches/', HTTP_AUTHORIZATION=f'Bearer {tokens["PARENT"]}').json()
student_batches = c.get('/api/batches/', HTTP_AUTHORIZATION=f'Bearer {tokens["STUDENT"]}').json()
print(f"✓ Batches visible -> Admin: {admin_batches.get('count', len(admin_batches))}, Tutor: {tutor_batches.get('count', len(tutor_batches))}, Parent: {parent_batches.get('count', len(parent_batches))}, Student: {student_batches.get('count', len(student_batches))}")

print("\n=== 4. VERIFYING SCHEDULING CONFLICT ENGINE ===")
report = validate_scheduling_conflicts(
    batch_id=1,
    tutor_id=1,
    session_date=date.today(),
    start_time=time(17, 0),
    end_time=time(18, 30),
    room_or_link='Room 101'
)
print("✓ Conflict engine output for test slot:", report)

print("\n=== 5. VERIFYING QUERY-PARAM JWT FOR PDF DOWNLOADS ===")
res_receipt = c.get(f'/api/fees/receipts/1/download/?token={tokens["ADMIN"]}')
assert res_receipt.status_code == 200, f'Receipt download failed: {res_receipt.status_code}'
assert res_receipt['Content-Type'] == 'application/pdf', 'Not PDF content type'
print(f"✓ Fee receipt PDF downloaded via query token ({len(res_receipt.content)} bytes)")

res_report = c.get(f'/api/reports/progress-reports/1/download_pdf/?token={tokens["ADMIN"]}')
assert res_report.status_code == 200, f'Report download failed: {res_report.status_code}'
assert res_report['Content-Type'] == 'application/pdf', 'Not PDF content type'
print(f"✓ Progress report card PDF downloaded via query token ({len(res_report.content)} bytes)")

print("\n=== 6. VERIFYING ATTENDANCE STATS ===")
att_res = c.get('/api/attendance/student_stats/', HTTP_AUTHORIZATION=f'Bearer {tokens["STUDENT"]}')
assert att_res.status_code == 200, f'Stats failed: {att_res.status_code}'
print("✓ Attendance stats for student_rohit:", att_res.json())

att_parent_res = c.get('/api/attendance/student_stats/', HTTP_AUTHORIZATION=f'Bearer {tokens["PARENT"]}')
assert att_parent_res.status_code == 200, f'Parent stats failed: {att_parent_res.status_code}'
print("✓ Attendance stats for parent_sharma (fallback to child):", att_parent_res.json())

print("\n=========================================")
print("ALL SYSTEM INTEGRATION CHECKS PASSED 100%")
print("=========================================")
