# AgriCast AI

**AI-Powered Panchayat-Level Weather Intelligence**
Smart India Hackathon 2026 Prototype — Problem Statement SIH26074 (Weather Data Downscaling and Panchayat-Level Weather Intelligence)

> "Local Weather. Smarter Farming. Accessible to Every Farmer."
> "From regional weather data to Panchayat-level decisions."

AgriCast AI is **not** an official Government of India or Government of Tamil Nadu website. It is a hackathon prototype.

**No database installation is required.** The backend runs on a built-in in-memory data store that seeds its own
demo data the moment it starts — just `npm install` and `npm run dev` in both `backend/` and `frontend/`.

---

## 1. Problem Statement

Regional/district-level weather forecasts are too coarse for Panchayat-level farm decisions. AgriCast AI downscales
that weather intelligence to the Panchayat and converts it into concrete farming decisions: is it suitable to sow,
spray, irrigate, or harvest today, what crop risk exists this week, and what economic exposure a delay avoids —
accessible to farmers with or without a smartphone.

## 2. What's included

- **Crop Advisory & Risk**: stage-wise advice and weather risk for Paddy, Groundnut, Maize, Tomato, Banana and Sugarcane (each with its own photos and icons)
- **AI Downscaling**: a transparent rule-based method that adjusts a regional forecast using elevation, coastal distance and nearby water — every adjustment shown with its exact numeric contribution, plus a block-vs-Panchayat comparison and validation against a regional baseline
- **VoiceLine**: a working phone-call simulator — press keys (or your keyboard) and the system speaks back menu options, weather, rain forecast, farm suitability, crop risk, irrigation advice and active alerts in Tamil or English (browser text-to-speech)
- **SMS prototype**: send WEATHER, RAIN, ADVISORY, ALERT or FARM and get an instant reply
- **₹ Risk Saved**, **Photo + Weather Risk Check** (with in-browser photo compression), **Panchayat Map** with risk/rain/temperature layers, **Forecast Verification**, **Officer alert & risk management with audit log**

## 3. Solution & Differentiation

- Panchayat-level weather (observed + forecast)
- AI weather downscaling with explainability ("Why this prediction?")
- Rain Memory (last 24h / 3d / 7d vs next 24h)
- Crop-stage intelligence across 6 crops
- Should I Farm Today? + Farm Activity Windows
- Farmer Photo + Weather Risk Check (inspection advisory, never a diagnosis)
- ₹ Risk Saved — transparent, assumption-based economic estimate
- AgriCast VoiceLine — keypad IVR simulator (Tamil + English, browser speech playback)
- SMS prototype (WEATHER / RAIN / ADVISORY keywords)
- Farmer / Officer role-based access, enforced server-side
- Officer verification, forecast-vs-actual evaluation, data quality monitor
- Tamil + English throughout, accessible, mobile-first

## 4. Architecture

```
agricast-ai/
├── frontend/       React + TypeScript + Vite + Tailwind CSS + React Router + Leaflet + Recharts
├── backend/        Node.js + Express.js + in-memory data store, JWT auth, RBAC
├── ml-service/      Python + FastAPI + scikit-learn demonstration models (optional, standalone)
└── README.md
```

Data flow: **Regional Weather → AI Downscaling → Panchayat Weather → Crop Risk / Should I Farm Today? → Advisory →
Photo Risk Check → ₹ Risk Saved → Alerts / VoiceLine → Officer Dashboard → Forecast Verification.**

The same District → Block → Panchayat → Crop → Crop Stage selection flows through every farmer-facing page via
`FarmSelectionContext` in the frontend, so the demo tells one connected story rather than showing disconnected pages.

## 5. Technology Stack

| Layer      | Stack |
|------------|-------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, React Router, React-Leaflet, Recharts, Lucide React |
| Backend    | Node.js, Express.js, in-memory data store, JWT, bcryptjs, Multer |
| ML service | Python, FastAPI, pandas, numpy, scikit-learn (RandomForestRegressor) |
| Data       | Built-in in-memory store — no database to install or configure |

### Why in-memory instead of a database?

This keeps the hackathon demo working the instant you clone it — no MongoDB install, no Atlas account, no
connection strings. The trade-off, stated plainly: **data resets whenever the backend process restarts.** Every
controller in `backend/src/controllers` only calls a small set of store methods (`find`, `findOne`, `findById`,
`create`, `insertMany`, `updateById`, `count`) defined once in `backend/src/data/store.js` — so swapping in a real
database later (MongoDB, PostgreSQL, anything) means rewriting that one file, not the rest of the app.

## 6. Prerequisites

- Node.js 18+ and npm
- Python 3.10+ (only if you want to run the optional ML service)

No database, no Docker, no external accounts needed.

## 7. Setup — Backend

```bash
cd backend
npm install
cp .env.example .env
# open .env and set JWT_SECRET to any random string
npm run dev      # starts the API on http://localhost:5000
```

The console prints a confirmation once demo data is ready (Panchayats, crops, demo users). You can also run
`npm run seed` first if you want to see that confirmation before starting the server — it's optional, since the
server seeds automatically either way.

Demo accounts (created automatically on every server start):

| Role    | Phone      | Password    |
|---------|------------|-------------|
| Farmer  | 9999900001 | Demo@12345  |
| Officer | 9999900002 | Demo@12345  |

## 8. Setup — Frontend

```bash
cd frontend
npm install
cp .env.example .env
# edit .env if your backend runs on a different URL
npm run dev      # starts Vite on http://localhost:5173
```

Open `http://localhost:5173`. Run backend and frontend in two separate terminals — both need to stay running.

## 9. Setup — ML Service (optional; the backend has its own engines)

```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

`GET /health`, `POST /predict/weather`, `POST /predict/risk`. This is a standalone demonstration service; the Express
backend's own `weatherDecisionEngine.js` / `cropRiskEngine.js` are what the frontend calls by default, so the full
demo works even without the ML service running.

## 10. Environment Variables

**backend/.env**
```
JWT_SECRET=replace_this_with_a_long_random_secret
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
ML_SERVICE_URL=http://localhost:8000
WEATHER_API_KEY=
```

**frontend/.env**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

Never commit `.env` files — only `.env.example` is tracked.

## 11. Authentication & Roles

- Two roles only: `FARMER` and `OFFICER`. No admin role.
- Passwords are hashed with bcrypt; sessions use JWTs (`Authorization: Bearer <token>`).
- `requireAuth` and `requireRole("FARMER"|"OFFICER")` middleware enforce access **server-side** — the frontend
  hiding a button is never the only protection.
- Officer-only routes live under `/api/officer/*` and are blocked with `403 Forbidden` for farmers.
- Every officer write (alerts, panchayat updates, submission reviews) writes an audit log entry (in-memory).

## 12. API Overview

```
POST   /api/auth/register            POST /api/auth/login          GET/PUT /api/auth/me

GET    /api/panchayats               GET  /api/panchayats/:id/weather   PUT /api/panchayats/:id (officer)
GET    /api/weather/forecast         GET  /api/weather/history
GET    /api/crops                    GET  /api/crops/:id             GET /api/crops/:id/risk
GET    /api/decision/should-i-farm-today     GET /api/decision/activity-window
GET    /api/alerts

GET    /api/voice/menu               POST /api/voice/session
POST   /api/sms/simulate

GET    /api/verification             GET /api/model/metrics

POST   /api/farmer/photo-risk (farmer)        GET /api/farmer/photo-risk/history (farmer)
POST   /api/risk-saved/calculate (farmer)

GET    /api/officer/dashboard        GET  /api/officer/farmer-reports
POST   /api/officer/farmer-reports/:id/review
POST   /api/officer/alerts           PUT  /api/officer/panchayats/:id
GET    /api/officer/photo-risk
```

Every error response is `{ success: false, message, code }` — no stack traces are ever sent to the client.

## 13. Demo Walkthrough

1. Open the site → **Farmer Login** with the demo account.
2. Select District/Block/Panchayat, Crop, Crop Stage on the Farmer Dashboard.
3. View local weather → open **AI Downscaling** → "Why this prediction?"
4. Open **Farm Activity** → pick an activity → see **Should I Farm Today?** and the **Activity Window**.
5. Open **Crop Advisory** → see crop risk for the selected stage.
6. Open **Photo + Weather Risk Check** → upload a photo → see the risk/inspection advisory.
7. Open **₹ Risk Saved** → estimate potential avoidable loss.
8. Open **VoiceLine** → press **2** → hear/read the rain forecast.
9. Log out → **Officer Login** → **Officer Dashboard** → **Farmer Photo Risk Reports** → review a submission.
10. Open **Forecast Verification** → MAE/RMSE/Bias (shown only once enough samples exist).

## 14. Honesty / "No Fake AI" Guarantees

- No fabricated accuracy, confidence, precision/recall/F1 figures.
- Every screen showing seeded data is labelled **DEMONSTRATION DATA**.
- The photo-risk feature never diagnoses disease — only a weather + image *risk/inspection advisory*.
- ₹ Risk Saved is always an *estimate* with the formula and assumptions shown, never a guaranteed saving.
- VoiceLine and SMS are explicitly labelled as **prototypes** — no real telephony/SMS is connected.
- Forecast verification metrics only render once at least 5 paired observations exist; otherwise the UI says so.
- The in-memory data store is disclosed here and in code comments, not hidden as if it were a real database.

## 15. Image Attribution

Field photographs under `frontend/public/images/` are used for illustration within this prototype. Map tiles are
served by © OpenStreetMap contributors (shown in the map's attribution control).

## 16. Known Limitations

- Data lives in memory and resets whenever the backend process restarts — expected for this prototype, documented
  above, and easy to swap for a real database later (see section 4).
- The ML service ships a synthetic-data demonstration model, not one trained on verified historical observations.
- No live IMD/NASA POWER/Open-Meteo integration is wired in by default — see `frontend/pages/DataSourcesPage.tsx`.
- SMS and telephony are simulated only.

## 17. Deployment — one Vercel project, one file

Everything (frontend + backend API) deploys together as a **single Vercel project**, driven entirely by the one
`vercel.json` at the repo root. No separate backend host, no CORS setup, no second project to configure.

**Option A — Vercel dashboard:** Import this repo on vercel.com. Leave the project root as the repo root (not
`frontend/`). Vercel reads `vercel.json` automatically and builds both the static frontend and the API function.
Click Deploy — that's it.

**Option B — CLI:**
```bash
npm i -g vercel
cd agricast-ai
vercel --prod
```

Optional environment variable (Vercel project → Settings → Environment Variables):
```
JWT_SECRET=<any long random string>
```
Everything else works with zero configuration — the frontend calls `/api/...` on the same domain, so there's
nothing to connect and no `VITE_API_BASE_URL` or `CLIENT_ORIGIN` to set.

**ML service → Render/Railway** (optional, standalone): start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

Because the backend keeps data in memory, every deploy/redeploy resets demo data back to the seeded state — fine for
a repeated hackathon demo, not meant for storing real user data long-term.

## 18. Uploading to GitHub

```bash
cd agricast-ai
git init
git add .
git commit -m "AgriCast AI - SIH 2026 prototype"
git branch -M main
git remote add origin https://github.com/<your-username>/agricast-ai.git
git push -u origin main
```

`.env` files are already excluded via `.gitignore` — only `.env.example` files are committed.

## 19. Running in VS Code

1. Open the `agricast-ai/` folder in VS Code.
2. Open two integrated terminals: one in `backend/`, one in `frontend/`.
3. Follow sections 6 and 7 above in each terminal.
4. (Optional) open a third terminal in `ml-service/` and follow section 8.

---

*This README, the disclaimers above, and every "DEMONSTRATION DATA" / "DEMONSTRATION MODEL" / "PROTOTYPE" label in the
app are intentional — they are part of the honesty requirement for this Smart India Hackathon submission, not
placeholders to remove.*
