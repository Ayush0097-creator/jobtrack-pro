 # 🚀 JobTrack Pro

AI-powered job application management system designed for students and job seekers. Track applications, manage resumes, prepare for interviews, and analyze your placement progress all in one place.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| *Frontend* | React, Vite, Tailwind CSS, React Query, Recharts, Framer Motion, React Hook Form |
| *Backend* | Django, Django REST Framework (DRF), SimpleJWT, django-filter |
| *Database* | SQLite (Local) / PostgreSQL Neon (Production) |
| *AI Engine*| Gemini or OpenAI (Includes heuristic fallback when API key is missing) |

## ✨ Key Features

- *Authentication:* Secure JWT auth (register, login, refresh, logout, password reset, email verification, profile).
- *Dashboard:* Analytics dashboard featuring animated counters & charts.
- *Application Management:* CRUD operations with advanced filtering and sorting.
- *Kanban Board:* Drag-and-drop status workflow for tracking applications.
- *Interview Tracker:* Upcoming alerts and calendar list view.
- *Resume Manager:* Multi-resume upload, versioning, and ATS analysis.
- *AI Integration:* Job match scoring (animated ring), cover letter generation, PDF parsing, career coaching, and interview prep.
- *Notifications:* In-app and email reminders for deadlines and interviews.
- *Admin Panel:* Specialized analytics for staff users and placement coordinators.

## 👥 Dual Portals

| Portal | Target Audience | Entry Point |
|--------|-----------------|-------------|
| *Student* | Job seekers / Students | /student/login or /student/register → /app/* |
| *Admin* | Staff / Coordinators | /admin/login → /admin/* |

> *Note:* Public registration always defaults to *student* accounts. Admins cannot self-sign up. 

## 🚀 Getting Started

### 1. Environment Variables
```bash
cp .env.example .env
# Optional: Set GEMINI_API_KEY or OPENAI_API_KEY
 cd backend
python -m venv .venv

# Activate virtual environment (Windows)
.\.venv\Scripts\activate
# Activate virtual environment (macOS/Linux)
source .venv/bin/activate

# Install dependencies and migrate database
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate

# Create admin user and run server
python manage.py createsuperuser
python manage.py runserver
cd frontend
npm install
npm run dev
jobtrack-pro/
├── backend/          # Django project (config + apps)
├── frontend/         # Vite React app
└── .env.example      # Shared environment template
