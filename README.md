# FresherAI

FresherAI is a web application for career preparation. It combines resume tools, mock interviews, learning roadmaps, and account/billing features in a React frontend backed by an Express API gateway and independently run Node.js services.

## Features

- Sign in with Firebase Authentication.
- Review a dashboard and use the resume scorer and resume builder.
- Start AI-assisted interviews, complete an interview, and view its report.
- Create learning roadmaps, with optional YouTube tutorial links.
- Access billing and subscription flows through Razorpay.

## Architecture

    text
React + Vite frontend
        |
        v
Express gateway (:6000)
  |       |        |         |          |
 auth   resume   interview  roadmap   billing
(:6001) (:6002)   (:6003)   (:6004)   (:6005)
        |
 MongoDB per service; Redis is available through Docker Compose


The gateway forwards `/api/auth`, `/api/resume`, `/api/interview`, `/api/roadmap`, and `/api/billing` to their respective services. It protects the resume, interview, roadmap, and billing routes with authentication middleware. `/api/me` returns the authenticated user's profile.

## Project Layout

```text
frontend/                       React app, pages, components, and API clients
  src/pages/                    Home, dashboard, scorer, resume, interview, roadmap, billing
  src/apis/                     Frontend API modules
  src/redux/                    Resume state management
backend/
  gateway/                      API gateway, auth middleware, and service proxies
  services/auth/                Authentication, user data, and Firebase Admin
  services/resume/              Resume creation and scoring
  services/interview/           Interview sessions and AI workflow
  services/roadmap/             AI-generated learning roadmaps
  services/billing/             Razorpay billing operations
  shared/redis/                 Shared Redis client
  docker-compose.yml            Redis container configuration
```

## Requirements

- Node.js and npm
- MongoDB, accessible to each backend service
- Firebase project configuration for frontend sign-in and Firebase Admin
- Groq API key for AI features
- Razorpay credentials for billing
- YouTube Data API key for roadmap video lookup
- Docker Desktop, if using the provided Redis Compose service

## Local Setup

Install dependencies in each app/service directory. For example:

```powershell
cd frontend
npm install

cd ..\backend\gateway
npm install

cd ..\services\auth
npm install
```

Repeat `npm install` in `backend/services/resume`, `interview`, `roadmap`, and `billing`.

Create environment files in the corresponding frontend, gateway, and service directories. Do not commit secrets.

Frontend (`frontend/.env`):

```dotenv
VITE_BACKEND_URL=http://localhost:6000
VITE_FIREBASE_APIKEY=your_firebase_web_api_key
```

Gateway (`backend/gateway/.env`):

```dotenv
PORT=6000
FRONTEND_URL=http://localhost:5173
AUTH_SERVICE_URL=http://localhost:6001
RESUME_SERVICE_URL=http://localhost:6002
INTERVIEW_SERVICE_URL=http://localhost:6003
ROADMAP_SERVICE_URL=http://localhost:6004
BILLING_SERVICE_URL=http://localhost:6005
```

Each backend service needs `MONGODB_URL` in its own `.env`. Use a distinct database or database name per service as appropriate. Additional service settings:

- `backend/services/billing`: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `backend/services/interview`, `backend/services/resume`, and `backend/services/roadmap`: `GROQ_API_KEY`
- `backend/services/roadmap`: `YOUTUBE_API_KEY`
- `backend/services/auth`: provide a private Firebase Admin service-account JSON file at the path expected by `configs/firebase.js`; never commit production credentials
- `REDIS_URL` is used by the shared Redis client if that client is enabled; the Compose service listens on port `6379`

Start Redis if needed (run from `backend/`):

```powershell
docker compose up -d redis
```

Start each backend service in its own terminal, from that service's directory:

```powershell
npm run dev
```

Start the gateway from `backend/gateway/` with `npm run dev`, then start the frontend from `frontend/` with `npm run dev`. Vite prints the local frontend URL, normally `http://localhost:5173`.

For a non-development process, the gateway and backend services provide `npm start` scripts. The frontend provides `npm run build` and `npm run preview`.

## Routes

The frontend exposes these client-side routes:

| Route | Page |
| --- | --- |
| `/` | Home and sign-in |
| `/dashboard` | User dashboard |
| `/scorer` | Resume scorer |
| `/resume` | Resume builder |
| `/interview` | Interview setup |
| `/interview/:id` | Interview session |
| `/interview/:id/report` | Interview report |
| `/roadmap` | Learning roadmap |
| `/billing` | Billing |

Most feature pages require an authenticated user; unauthenticated users are redirected to `/`.

## Checks

From `frontend/`:

```powershell
npm run lint
npm run build
```

The backend package manifests do not currently define automated test suites. The root backend `npm test` command is a placeholder that exits with an error.
