# Home Tutor & Coaching Batch Scheduler

A complete full-stack web application designed for individual home tutors and coaching institutes. The platform streamlines scheduling, eliminates tutor/classroom collisions, automates daily attendance tracking, handles multi-installment tuition fees, and produces official parent progress reports and fee receipts in downloadable PDF format.

---

## 🛠️ Technology Stack
- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, Lucide Icons, Axios.
- **Backend**: Django 5.x, Django REST Framework (DRF), SimpleJWT (stateless token authentication), django-cors-headers.
- **Database**: Supabase PostgreSQL (or local SQLite fallback for rapid offline development).
- **Document / PDF Engine**: ReportLab (built-in generation of formatted student progress cards & fee receipts).

---

## 👥 Built-in User Roles & Demo Credentials

Pre-seeded accounts ready for viva demonstration:

| Role | Username | Password | Key Permissions & Portal View |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full access, batch creation, student enrollments, fee invoicing, conflict checks |
| **Tutor** | `tutor_ramesh` | `tutor123` | Assigned batches, daily attendance logging, grading, progress reporting |
| **Parent** | `parent_sharma` | `parent123` | Children's class timetable, attendance status, fee receipts, progress cards |
| **Student** | `student_rohit` | `student123` | Personal timetable, upcoming sessions, attendance rate, enrolled courses |

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Python 3.10+**
- **Node.js 18+** & **npm**

---

### 2. Backend Setup (Django REST Framework)

1. Open PowerShell and navigate to the backend folder:
   ```powershell
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install required Python packages:
   ```powershell
   pip install -r requirements.txt
   ```

4. *(Optional)* Configure Supabase PostgreSQL:
   - Copy `.env.example` to `.env`:
     ```powershell
     copy .env.example .env
     ```
   - Enter your Supabase `DB_HOST`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`.
   - *Note:* If `DB_HOST` is left empty, the application automatically defaults to local SQLite for immediate offline execution!

5. Run database migrations:
   ```powershell
   python manage.py makemigrations accounts batches scheduling attendance fees reports
   python manage.py migrate
   ```

6. Seed rich demo data (tutors, students, batches, timetables, fee invoices, reports):
   ```powershell
   python seed_data.py
   ```

7. Start the backend development server:
   ```powershell
   python manage.py runserver 8000
   ```
   The API will be live at `http://127.0.0.1:8000/api/`

---

### 3. Frontend Setup (React + Vite + Tailwind CSS)

1. Open a new PowerShell terminal and navigate to the frontend folder:
   ```powershell
   cd frontend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the Vite React development server:
   ```powershell
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🌟 Core Modules & Architecture
- **Dual Tutoring Paradigm**: Accommodates both 1-on-1 home tutoring (single student at home) and coaching center group batches.
- **Conflict Prevention Engine**: Validates tutor schedule collisions and classroom room overlaps before confirming sessions.
- **Attendance Roster**: Interactive sheet allowing tutors to mark Present, Absent, Late, or Excused with 1-click bulk submission.
- **Fee Installments**: Multi-part installment payments with automatic balance computation and ReportLab PDF receipt downloads.
- **Parent Progress Reports**: Aggregates real-time attendance rate and assessment score averages with official downloadable PDF cards.
