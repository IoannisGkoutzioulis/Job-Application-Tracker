
# Job Application Tracker

A full-stack web application to manage and track job applications, built with Django REST Framework and React (Vite). Features include analytics, user authentication, job entry forms, and dashboards to visualize your job-seeking progress.

---

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Dependencies](#dependencies)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributors](#contributors)
- [License](#license)

---

## Introduction

This application helps job seekers keep track of submitted applications, company details, and the overall progress in their job search. Users can register, log in securely, and monitor application statuses through clean dashboards.

---

## Features

- 🔐 User authentication with JWT
- 📂 CRUD operations on job applications
- 📊 Analytics dashboard
- 🗃️ Django REST API backend
- ⚛️ React + Vite frontend
- 🧩 PostgreSQL / MySQL database support
- 🌍 CORS-configured for cross-origin communication

---

## Installation

### Prerequisites

- Python 3.10+
- Node.js v18+
- MySQL or PostgreSQL (optional)
- Git

---

## Backend Setup (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

> 📂 SQL schema: `SQL_BACKUP.sql`

---

## Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## Configuration

### Django (in `config/settings.py`)

- Database setup (`DATABASES` dict)
- JWT settings
- CORS origins (`CORS_ALLOWED_ORIGINS`)

### Render Deployment

`render.yaml` included for deployment to [Render.com](https://render.com/)

---

## Dependencies

### Backend (from `requirements.txt`)
- Django, djangorestframework
- django-cors-headers
- djangorestframework-simplejwt
- Flask, SQLAlchemy
- bcrypt, PyJWT
- Gunicorn

### Frontend (from `package.json`)
- React, Vite
- React Router
- Other dependencies managed via npm

---

## Deployment

- Use `render.yaml` to deploy on [Render](https://render.com/)
- Configure environment variables like:
  - `DATABASE_URL`
  - `SECRET_KEY`
  - `CORS_ALLOWED_ORIGINS`

---

## Troubleshooting

| Issue                          | Solution                                                              |
|--------------------------------|-----------------------------------------------------------------------|
| Backend not starting           | Ensure virtualenv is activated and dependencies installed            |
| CORS errors in browser         | Update allowed origins in `settings.py`                              |
| Frontend not loading data      | Confirm backend is running and accessible from `http://localhost:8000`|
| DB connection issues           | Update `DATABASES` in settings with correct credentials               |

---

## Contributors

- Developed and maintained by original author(s)
- Deployment and packaging support via automated tooling

---

## License

This project is free to use and modify for educational or personal use.
