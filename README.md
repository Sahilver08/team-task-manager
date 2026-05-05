# TaskFlow - Team Task Manager 🚀

TaskFlow is a high-performance, full-stack Team Task Management application built for scale and speed. It features a robust Django REST Framework backend paired with a fast, modern React frontend, providing features like role-based access control, optimistic locking for concurrency, and a real-time Kanban board.

## 🌟 Key Features
* **Custom Authentication:** Secure JWT-based auth (access + refresh tokens) using a custom email-based user model.
* **Role-Based Access Control (RBAC):** Users are assigned `ADMIN` or `MEMBER` roles at the project level, strictly controlling their read/write permissions.
* **Optimistic Locking:** Prevents race conditions. If two users edit the exact same task simultaneously, the system uses a `version` field to safely reject the outdated request (HTTP 409 Conflict).
* **High-Performance Dashboard:** The backend uses conditional SQL aggregations and database-level caching to calculate metrics instantly without overloading the database.
* **N+1 Query Prevention:** Every API endpoint uses `select_related` and `prefetch_related` to join tables efficiently, ensuring O(1) query complexity regardless of data size.

---

## 🛠️ Tech Stack

### Backend
* **Python & Django (4.2+)**
* **Django REST Framework (DRF)**
* **PostgreSQL** (Production) / **SQLite** (Local Dev)
* **SimpleJWT** for stateless token authentication
* **Gunicorn & WhiteNoise** for production deployment and static file serving

### Frontend
* **React 18**
* **Vite** for blazing fast builds and HMR
* **Tailwind CSS (v3)** for utility-first styling and a premium dark-mode aesthetic
* **React Query (@tanstack/react-query)** for intelligent data caching, background fetching, and mutation invalidation
* **Axios** for API requests (configured with global auth interceptors)
* **React Router DOM** for client-side routing

---

## 📂 Project Structure

```text
├── task_manager_backend/           # Django API
│   ├── config/                     # Core settings, WSGI, Root URLs
│   ├── core/                       # Shared utilities (Pagination, Custom Exceptions, Permissions)
│   ├── accounts/                   # Auth module (JWT Custom Claims, User Model)
│   ├── projects/                   # Project CRUD & Member Management
│   ├── tasks/                      # Task CRUD, Kanban Logic, Comments
│   ├── dashboard/                  # Cached Analytics & Metrics
│   ├── Procfile                    # Railway deployment config
│   ├── runtime.txt                 # Python version specification
│   └── requirements.txt            # Python dependencies
│
└── task_manager_frontend/          # React App
    ├── src/
    │   ├── api/                    # Axios instances and API endpoint mappings
    │   ├── components/             # Reusable UI (Buttons, Modals, Badges, Navbar)
    │   ├── context/                # Global State (AuthContext)
    │   ├── hooks/                  # React Query custom hooks
    │   ├── pages/                  # Dashboard, Login, Register, Task Board
    │   ├── App.jsx                 # App routing logic
    │   └── main.jsx                # Application entry point
    └── netlify.toml                # Netlify deployment routing config
```

---

## 💻 Local Development Setup

### 1. Backend Setup
Navigate into the backend directory and set up a virtual environment:
```bash
cd task_manager_backend
python -m venv venv

# Activate on Windows:
venv\Scripts\activate
# Activate on Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Create the cache table (required for dashboard performance)
python manage.py createcachetable

# Start the server (runs on http://localhost:8000)
python manage.py runserver
```

### 2. Frontend Setup
Open a new terminal, navigate to the frontend directory:
```bash
cd task_manager_frontend

# Install node modules
npm install

# Start the development server
npm run dev
```
The frontend will start (usually on `http://localhost:5173` or `5174`). Open that link in your browser to start using the app!

---

## 🚀 Deployment Guide

This project is pre-configured to be deployed for free using **Railway** (Backend) and **Netlify** (Frontend).

### 1. Push to GitHub
Create a new repository on GitHub and push this entire folder to it.

### 2. Deploy Backend & Database to Railway
1. Create an account on [Railway.app](https://railway.app/).
2. Click **New Project** → **Deploy from GitHub repo** and select your repository.
3. Railway will ask you to configure the build. You want to deploy the `task_manager_backend` directory.
4. **Add a Database:** Inside your Railway project, click **New** → **Database** → **Add PostgreSQL**.
5. **Environment Variables:** Go to your backend service settings in Railway, click **Variables**, and add:
   * `SECRET_KEY` = `[generate_a_random_secure_string]`
   * `DEBUG` = `False`
   * `CORS_ALLOWED_ORIGINS` = `[leave empty for now, we will add the Netlify URL later]`
   * `DATABASE_URL` = *(Railway should automatically populate this when you link the Postgres DB)*

### 3. Deploy Frontend to Netlify
1. Create an account on [Netlify](https://www.netlify.com/).
2. Click **Add new site** → **Import an existing project** from GitHub.
3. Select your repository.
4. **Build settings:**
   * **Base directory:** `task_manager_frontend`
   * **Build command:** `npm run build`
   * **Publish directory:** `task_manager_frontend/dist`
5. **Environment Variables:**
   * Add a new variable: `VITE_API_URL` = `https://[YOUR_RAILWAY_URL]/api`
6. Click **Deploy Site**.

### 4. Final Connection
Once Netlify gives you a live URL (e.g., `https://my-taskflow.netlify.app`), copy it. 
Go back to **Railway**, open your backend variables, and set:
`CORS_ALLOWED_ORIGINS` = `https://my-taskflow.netlify.app`

*(Wait a minute for Railway to redeploy, and your full-stack app is now live!)*
