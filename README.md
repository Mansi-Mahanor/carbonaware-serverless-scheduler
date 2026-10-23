# Carbon-Aware Serverless Workload Scheduler

A comprehensive full-stack engineering system that schedules deferrable serverless cloud workloads based on real-time marginal carbon intensity forecasts (WattTime API v3), balancing user runtime constraints, execution deadlines, and grid emission optimization.

---

## 1. System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        React + Vite Frontend (SPA)                     │
│  - Dashboard: Metrics, active 5-min forecast gauge, recent jobs        │
│  - Schedule Workload: Workload parameters, file attachment, live slot  │
│  - Workload Jobs: Unified list, status filters, full search            │
│  - Job Details: File metadata card, simulation trigger, timeline       │
│  - Carbon Forecast: Recharts trajectory, dynamic Y-axis, slot table    │
└────────────────────────────────────▲───────────────────────────────────┘
                                     │ HTTP REST (JSON / Multipart)
┌────────────────────────────────────▼───────────────────────────────────┐
│                          Flask Backend (Python 3)                      │
│  - routes/schedule_routes.py : /api/schedule-live, /api/schedule       │
│  - routes/jobs.py            : /api/jobs, /jobs/<id>/execute, /status  │
│  - routes/carbon.py          : /api/carbon/live-forecast               │
│  - services/watttime_service : Auth session, token caching, fetch MOER │
│  - services/live_scheduler   : 5-minute continuous window minimization │
│  - job_service.py            : SQLite persistence, lifecycle validation│
│  - database.py               : Non-destructive SQLite schema migration │
└────────────────────────────────────▲───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌──────────────────────┐                           ┌──────────────────────┐
│     SQLite DB        │                           │   WattTime API v3    │
│ jobs (34+ records,   │                           │ /v3/forecast (MOER)  │
│ file metadata schema)│                           │ Region: CAISO_NORTH  │
└──────────────────────┘                           └──────────────────────┘
```

---

## 2. Key Features & Implementation Phases

- **Carbon Intensity Standardization & Active Interval Window (Phase 2)**:
  - Standardized internal forecast points emitting both `carbonIntensity` and `carbonIntensityGramsPerKWh`.
  - Active 5-minute interval semantics (`timestamp <= now < timestamp + 5 min`), ensuring current intervals in progress are not prematurely discarded.
  - Legitimate zero-carbon intensity readings (`0.0 gCO₂/kWh`) are strictly preserved and never conflated with missing or failed requests.
- **Dynamic Chart & Dashboard Calibration (Phase 3)**:
  - Recharts component dynamic Y-axis scaling (`[0, max(150, ceil(dataMax * 1.15))]`), preventing visual clipping of low/high values.
  - Eliminated `Number(null) === 0` JavaScript bug in Header and Dashboard, preventing missing data from masquerading as `0.00 gCO₂/kWh`.
  - Clear illustrative threshold labeling (`135 gCO₂/kWh`) and localized timestamp formatting.
- **State Synchronization & Region Harmonization (Phase 4)**:
  - Unified Jobs page and App state; changes made in Job Details or Workload Scheduling synchronize across views.
  - Clarified region taxonomy: distinction between electric grid balancing authorities (e.g., `CAISO_NORTH`) and cloud data-center deployment regions (e.g., AWS `us-west-1`).
- **Workload File Upload & Metadata Persistence (Phase 5)**:
  - Workload file attachment UI with client-side name/size preview, replace/remove controls.
  - Server-side byte calculation via stream seeking (`seek(0, 2); tell()`), enforcing a 15MB file ceiling.
  - Safe local disk storage in `Backend/data/uploads/` with sanitized timestamped filenames.
  - Backward-compatible SQLite schema migration automatically adding `file_name`, `file_size_bytes`, and `file_type` columns without data loss.
- **Workload Lifecycle & Simulation Engine (Phase 6)**:
  - State machine with strict transition validation: `Submitted` → `Scheduled` → `Running` → `Completed` (or `Failed` / `Not Scheduled`).
  - Interactive "Simulate Cloud Execution" endpoint (`POST /api/jobs/<job_id>/execute`) that updates status to `Completed`, records `actual_runtime` and `completed_at`, transparently labeled as a demonstration simulation.

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, React Router 6, Recharts, Lucide Icons, CSS3.
- **Backend**: Python 3.10+, Flask, Flask-CORS, Requests.
- **Database**: SQLite 3 (with automatic non-destructive column migrations).
- **Carbon Data**: WattTime API v3 (`co2_moer` marginal emissions rate).

---

## 4. Setup and Installation

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher with npm
- Git

### 1. Clone the repository
```bash
git clone https://github.com/Mansi-Mahanor/carbonaware-serverless-scheduler.git
cd Carbon-Aware-Scheduler
```

### 2. Configure Backend Environment
Create `Backend/.env` (or verify existing configuration):
```env
WATTTIME_USER=your_watttime_username
WATTTIME_PASSWORD=your_watttime_password
FLASK_ENV=development
PORT=5000
```
> **Note:** Never commit `.env` or credentials to version control.

### 3. Run Backend Server
```bash
cd Backend
pip install -r requirements.txt
python app.py
```
The Flask API starts at `http://127.0.0.1:5000`.

### 4. Run Frontend Application
Open a new terminal window:
```bash
cd Frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 5. Automated Testing & Verification

Run the comprehensive test suites from the repository root:

### Backend Live Scheduler & Baseline Suite
```powershell
$env:PYTHONPATH="Backend"; python -m unittest Backend/test_live_scheduler.py
```

### Backend Phases 2–6 Integrity & Lifecycle Suite
```powershell
$env:PYTHONPATH="Backend"; python -m unittest Backend/test_phases_suite.py
```

### Legacy Static Scheduler Verification
```powershell
python Backend/test_scheduler.py
```

### Production Frontend Build Verification
```powershell
npm --prefix Frontend run build
```

---

## 6. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend health check |
| `GET` | `/api/carbon/live-forecast` | Normalized WattTime 5-minute forecast points |
| `POST` | `/api/schedule-live` | Carbon-aware live scheduling (accepts JSON or `multipart/form-data`) |
| `POST` | `/api/schedule` | Legacy static scheduler |
| `GET` | `/api/jobs` | Retrieve all submitted workloads with file metadata |
| `GET` | `/api/jobs/<job_id>` | Retrieve workload details by ID |
| `POST` | `/api/jobs/<job_id>/status` | Update workload status with lifecycle transition validation |
| `POST` | `/api/jobs/<job_id>/execute` | Run simulated cloud workload execution |

---

## 7. License & Academic Attribution
Developed as an engineering project on Carbon-Aware Cloud Computing and Serverless Workload Scheduling.
