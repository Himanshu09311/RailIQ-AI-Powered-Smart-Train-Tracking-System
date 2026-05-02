# RailIQ-AI-Powered-Smart-Train-Tracking-System

Real backend-enabled RailIQ prototype with secure auth and train API proxy.

## Security + Backend Upgrades Implemented
- bcrypt password hashing
- JWT auth tokens
- CORS restriction via allowlist (`RAILIQ_ALLOWED_ORIGINS`)
- In-memory IP-based rate limiting (60 req/min)
- Real train API proxy endpoint (`/api/train-status`)

## Features
- Login + Signup pages with backend API calls
- Python Flask backend with SQLite
- JWT-based protected endpoints (`/api/me`, `/api/train-status`)
- Responsive dashboard with tracking, PNR simulation, delay AI insight, assistant, alerts
- IndexedDB client event logging

## Run locally (Terminal Quick Start)

### Linux / macOS
1. Repo folder me aao:
   ```bash
   cd /path/to/RailIQ-AI-Powered-Smart-Train-Tracking-System
   ```
2. Virtual environment banao aur activate karo:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Dependencies install karo:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. Env vars set karo:
   ```bash
   export RAILIQ_JWT_SECRET='your-secret'
   export RAILIQ_ALLOWED_ORIGINS='http://localhost:3000,http://127.0.0.1:3000'
   export TRAIN_API_BASE='https://rappid.in/apis/train.php'
   export TRAIN_API_KEY=''
   ```
5. Backend chalao (Terminal-1):
   ```bash
   python backend/server.py
   ```
6. Frontend static server chalao (Terminal-2):
   ```bash
   python -m http.server 3000
   ```
7. Browser me open karo:
   - `http://127.0.0.1:3000/signup.html`
   - phir `http://127.0.0.1:3000/login.html`

### Windows (PowerShell)
1. Repo folder me aao:
   ```powershell
   cd C:\path\to\RailIQ-AI-Powered-Smart-Train-Tracking-System
   ```
2. Virtual environment banao aur activate karo:
   ```powershell
   py -3 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
3. Dependencies install karo:
   ```powershell
   pip install -r backend/requirements.txt
   ```
4. Env vars set karo:
   ```powershell
   $env:RAILIQ_JWT_SECRET = 'your-secret'
   $env:RAILIQ_ALLOWED_ORIGINS = 'http://localhost:3000,http://127.0.0.1:3000'
   $env:TRAIN_API_BASE = 'https://rappid.in/apis/train.php'
   $env:TRAIN_API_KEY = ''
   ```
5. Backend chalao (Terminal-1):
   ```powershell
   py backend/server.py
   ```
6. Frontend static server chalao (Terminal-2):
   ```powershell
   py -m http.server 3000
   ```
7. Browser me open karo:
   - `http://127.0.0.1:3000/signup.html`
   - phir `http://127.0.0.1:3000/login.html`

## Backend APIs
- `POST /api/signup`
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me` (Bearer token)
- `GET /api/health`
- `GET /api/train-status?train_no=12345` (Bearer token)

## Quick backend connectivity test
After starting backend, run:
```bash
./scripts/smoke_test.sh
```
If backend runs on a different host/port:
```bash
./scripts/smoke_test.sh http://127.0.0.1:8000/api
```

## Push this code to GitHub (step-by-step)
1. Create empty repository on GitHub (do not initialize README).
2. Add remote in terminal:
   ```bash
   git remote add origin <YOUR_GITHUB_REPO_URL>
   ```
3. Check remote:
   ```bash
   git remote -v
   ```
4. Push current branch (`work`):
   ```bash
   git push -u origin work
   ```
5. Next time only:
   ```bash
   git push
   ```
