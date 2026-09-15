# Apex Energy Optimization Portal

A frontend demo for a Sri Lankan SME garment-factory energy optimization system. It lets a factory manager sign in, configure the factory, add machines, review CEB time-of-day tariffs, run an optimization request, inspect the recommended schedule, and view cost and savings reports.

The current app runs in **dummy mode** by default. Dummy users and factory data are stored in `public/dummy.json`. New demo accounts and machine changes are persisted in the browser's local storage, so the complete flow can be tested without a backend.

## Demo login

- Email: `manager@abcgarments.lk`
- Password: `energy@2024`

Other demo accounts are available in `public/dummy.json`.

## Switching to the backend

Create a local `.env` file (copy `.env.example`):

```env
VITE_API_URL=http://localhost:8000
```

Use the deployed API origin instead of `http://localhost:8000` when the backend is hosted. Restart the frontend after changing the value.

The frontend uses backend mode whenever `VITE_API_URL` is non-empty. No page components need to be changed. The single integration point is `src/data/api.ts`, which:

- adds the bearer token to authenticated requests;
- calls the Swagger routes;
- translates login/signup responses into the frontend user shape;
- keeps the same local dummy behavior when `VITE_API_URL` is empty.

## Backend API contract

The Swagger page shows these routes and the frontend is wired to them:

| Method | Route | Used for |
| --- | --- | --- |
| POST | `/api/v1/auth/signup` | Create a factory manager account |
| POST | `/api/v1/auth/login` | Authenticate a manager |
| GET | `/api/v1/factories/me` | Load the signed-in manager's factory |
| PUT | `/api/v1/factories/me` | Update factory settings |
| GET | `/api/v1/machines` | List the current factory's machines |
| POST | `/api/v1/machines` | Create a machine |
| GET | `/api/v1/machines/{machine_id}` | Load one machine |
| PUT | `/api/v1/machines/{machine_id}` | Update one machine |
| DELETE | `/api/v1/machines/{machine_id}` | Delete one machine |
| GET | `/api/v1/tariffs` | Load tariff periods and rates |
| POST | `/api/v1/optimize` | Run the MILP optimization |
| GET | `/api/v1/dashboard` | Load dashboard cost and saving values |

The Swagger page also shows `GET /`, which is a health/root route and is not needed by the frontend.

## Response shapes required by the frontend

The exact field names should match the Swagger schemas. The frontend currently expects these values.

### Login and signup

The response must contain a user and a token. The adapter accepts either a direct response or a wrapped response:

```json
{
  "access_token": "jwt-or-session-token",
  "token_type": "bearer",
  "user": {
    "id": "USR-001",
    "email": "manager@factory.lk",
    "name": "Factory Manager",
    "role": "Plant Manager",
    "facilityCode": "ABC-001",
    "facilityName": "ABC Garments"
  }
}
```

`token` is also accepted instead of `access_token`, and `data.user` is accepted for a wrapped response. Do not return a password from the real backend.

The frontend sends:

```json
{
  "email": "manager@factory.lk",
  "password": "secret"
}
```

for login, and:

```json
{
  "name": "Factory Manager",
  "email": "manager@factory.lk",
  "password": "secret",
  "factoryName": "ABC Garments",
  "phone": "+94 77 123 4567"
}
```

for signup. If the Swagger `UserCreate` fields use snake_case, either keep the frontend payload names accepted by the backend or change only the payload mapping in `src/data/api.ts`.

### Factory

`GET /api/v1/factories/me` should return:

```json
{
  "name": "ABC Garments",
  "code": "ABC-KATUNAYAKE-01",
  "manager": "Kavinda Wickramasinghe",
  "role": "Plant Manager",
  "tariff": "CEB Industrial Tariff I-2 / I-3",
  "startTime": "07:00 AM",
  "endTime": "09:00 PM",
  "workingDays": 26
}
```

`PUT /api/v1/factories/me` receives the edited factory fields.

### Machine

The frontend uses this shape:

```json
{
  "id": "MCH-CUT-01",
  "name": "Fabric Cutter",
  "category": "Cutting",
  "quantity": 2,
  "power": 4,
  "hours": 3,
  "window": "08:00 AM – 11:00 AM",
  "priority": "High",
  "saving": 240,
  "tone": "blue"
}
```

The backend should use its canonical `MachineCreate`, `MachineOut`, and `MachineUpdate` schemas. `tone` is presentation-only and may be omitted from the database; if omitted by the API, the frontend can later derive it from the category.

### Tariff

```json
{
  "id": "TRF-03",
  "period": "Peak",
  "startTime": "6:30 PM",
  "endTime": "10:30 PM",
  "rate": 45
}
```

The expected business rules are:

- Off-Peak: 10:30 PM–5:30 AM at Rs. 15/kWh
- Day: 5:30 AM–6:30 PM at Rs. 25/kWh
- Peak: 6:30 PM–10:30 PM at Rs. 45/kWh

### Dashboard and optimization

The dashboard/optimization response should contain:

```json
{
  "currentCost": 2830,
  "optimizedCost": 2350,
  "dailySaving": 480,
  "monthlySaving": 12480,
  "energy": 94,
  "savingPercent": 16.97
}
```

The optimization endpoint should return the optimized summary plus the machine schedule. The current demo reads each machine's `window` as its displayed schedule. For a real backend, the `OptimizationResponse` should include schedule items with at least:

```json
{
  "machineId": "MCH-CUT-01",
  "scheduledStart": "08:00 AM",
  "scheduledEnd": "11:00 AM",
  "runtimeHours": 3,
  "energyKwh": 24,
  "cost": 600
}
```

## What is missing from the Swagger API

The current Swagger screenshot does not show a reports/history route. The frontend's Reports page uses demo rows for now. Add one of these routes before connecting real reports:

- `GET /api/v1/reports?from=YYYY-MM-DD&to=YYYY-MM-DD`
- or `GET /api/v1/reports/daily`
- optionally `GET /api/v1/reports/monthly`

A report row should include date, current cost, optimized cost, saving, and energy kWh.

The backend should also confirm these items before integration:

1. The exact request field names for `UserCreate`, `MachineCreate`, and `MachineUpdate`.
2. Whether login returns `access_token`, `token`, and `user` together.
3. Whether the API expects `Authorization: Bearer <token>`; this frontend assumes it does.
4. The exact response fields for `DashboardOut`, `OptimizationResponse`, and `ScheduleItem`.
5. CORS permission for the frontend origin, including `Authorization` and `Content-Type` headers.
6. Validation and error responses. The frontend reads `detail` or `message` from non-2xx JSON responses.
7. Factory ownership: every factory, machine, tariff result, dashboard result, and report must be scoped to the authenticated manager's factory.

## Recommended backend data

At minimum, store:

- users/managers;
- factories;
- machines;
- tariff periods;
- optimization runs;
- schedule items belonging to an optimization run;
- daily/monthly reports.

Passwords must be hashed. JWT/session tokens should be short-lived or revocable. Never trust `factory_id` sent by the browser when the authenticated user already owns a factory; derive ownership from the authenticated user on the server.

## Frontend structure

- `src/data/api.ts` — dummy/backend switch and API calls
- `src/auth/AuthContext.tsx` — login session and logout
- `src/features/auth/Login.tsx` — login and signup UI
- `src/features/factory/FactorySetup.tsx` — factory settings
- `src/features/machines/Machines.tsx` — machine CRUD
- `src/features/optimization/Optimization.tsx` — optimization request and schedule
- `src/features/dashboard/Dashboard.tsx` — KPIs and machine cost breakdown
- `src/features/reports/Reports.tsx` — report history
- `public/dummy.json` — local demo data

## Important calculation note

The application uses the documented project example values of Rs. 2,830 current cost, Rs. 2,350 optimized cost, and Rs. 480 daily saving. In the production backend, calculate each tariff segment using the actual clock boundaries. For example, a 4:00 PM–7:00 PM, 8 kW machine crosses the 6:30 PM peak boundary and must be split into day and peak segments rather than treated as one rate.

## Local development setup (frontend + backend on same machine)

### Option A: Direct connection (simplest)

1. Start your FastAPI backend:
   ```
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
2. Copy `.env.example` to `.env` in the frontend project:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
3. Start the frontend dev server. It will call `http://localhost:8000` directly.
4. Your backend must allow CORS from the frontend origin (default `http://localhost:5173`). Set this in your backend `.env`:
   ```env
   CORS_ORIGINS=http://localhost:5173
   ```
   And in your FastAPI CORS middleware:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=settings.CORS_ORIGINS.split(","),
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

### Option B: Vite dev proxy (avoids CORS entirely)

1. Start your FastAPI backend on port 8000 (same as above).
2. Copy `.env.example` to `.env` in the frontend project:
   ```env
   VITE_API_URL=/api-proxy
   ```
3. The Vite dev server (see `vite.config.ts`) proxies `/api-proxy/*` to `http://localhost:8000/*`, stripping the prefix. The browser only talks to the Vite dev server, so no CORS configuration is needed on the backend.
4. Start the frontend dev server.

### Backend `.env` file

A ready-to-copy template is in `.env.backend.example`. Copy it to your FastAPI project root as `.env` and adjust the values:

```env
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/energy_optimizer
JWT_SECRET_KEY=change-this-to-a-random-64-char-hex-string
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:5173
APP_ENV=development
DEBUG=true
```

Generate a secure JWT key with:
```
openssl rand -hex 32
```
