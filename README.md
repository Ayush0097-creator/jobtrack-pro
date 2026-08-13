# JobTrack Pro

AI-powered job application management for students and job seekers — track applications, manage resumes, prepare interviews, and analyze placement progress.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Vite, Tailwind, React Query, Recharts, Framer Motion, React Hook Form |
| Backend | Django, DRF, SimpleJWT, django-filter |
| Database | SQLite (local) / PostgreSQL Neon (production) |
| AI | Gemini or OpenAI (heuristic fallback when no API key) |

## Features

- JWT auth (register, login, refresh, logout, password reset, email verification, profile)
- Analytics dashboard with animated counters & charts
- Application CRUD + advanced filters/sorting
- Drag-and-drop Kanban status workflow
- Interview tracker with upcoming alerts & calendar list
- Multi-resume upload, versioning, ATS analysis
- AI job match score (animated ring), cover letter + PDF, career coach, interview prep
- In-app + email reminders for interviews/deadlines
- Admin analytics (staff users)

## Dual portals

| Portal | Who | Entry |
|--------|-----|-------|
| **Student** | Job seekers / students | `/student/login` or `/student/register` → `/app/*` |
| **Admin** | Staff / placement coordinators | `/admin/login` → `/admin/*` |

Create an admin account:

```bash
cd backend
.\.venv\Scripts\python manage.py createsuperuser
```

Public registration always creates **student** accounts. Admins are not self-signup.

### 1. Environment

```bash
cp .env.example .env
# optional: set GEMINI_API_KEY or OPENAI_API_KEY
```

### 2. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

API: `http://127.0.0.1:8000/api/`  
Admin: `http://127.0.0.1:8000/admin/`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

## Project layout

```
jobtrack-pro/
  backend/          Django project (config + apps)
  frontend/         Vite React app
  .env.example      Shared env template
```

## Deployment notes

- **Frontend (Vercel):** set root to `frontend`, env `VITE_API_URL=https://your-api.onrender.com/api`
- **Backend (Render):** root `backend`, build `pip install -r requirements.txt`, start `gunicorn config.wsgi:application`
- **Database (Neon):** set `DATABASE_URL` to your Postgres connection string
- Run `python manage.py migrate` on deploy; collectstatic is handled via WhiteNoise

## Portfolio talking points

- Full JWT auth lifecycle with refresh rotation/blacklist
- Domain modeling for applications, interviews, resumes, AI usage
- Kanban reorder API with bulk updates
- Pluggable AI provider with offline heuristic scoring for demos
- Analytics aggregations (status, source success, monthly/weekly)

Chrome extension is intentionally left as a stretch goal — the save-job API surface (`POST /api/applications/`) is ready for it.
