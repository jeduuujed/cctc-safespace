# CCTC SafeSpace — Base44 Dev Environment

## Architecture
- **Frontend**: Next.js 14 (pages router) on port 3000. Uses Firebase client SDK with hardcoded public config (`frontend/firebase.js`) for auth, Firestore, and Storage. Calls the Express backend for user management, messaging, reports, and face auth.
- **Backend**: Express API on port 5000 (exposed as port 8000). Uses `firebase-admin` for server-side Firebase operations. OpenAI for AI chat (optional, has fallback). Nodemailer/Gmail for report emails (optional, skips if unset). Azure Face for face login (optional).

## Running
```bash
docker compose -f docker-compose.base44.yml up -d --build
```
- Frontend: port 3000, backend: port 8000
- Both use `node:18-slim` with source bind-mounted; live-reload via `next dev` / `nodemon`
- File-watch polling enabled (`CHOKIDAR_USEPOLLING`, `WATCHPACK_POLLING`) for bind-mount compatibility

## Secrets (`/run/base44/app.env`)
- `FIREBASE_SERVICE_ACCOUNT` — Firebase service account JSON string (backend reads this env var, parses JSON, uses `admin.credential.cert()`). Without it the backend starts but all Firebase API calls fail. Get it from Firebase Console > Project Settings > Service Accounts > Generate new private key.
- `OPENAI_KEY`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_TO`, `AZURE_FACE_API_KEY`, `AZURE_FACE_ENDPOINT` — all optional with graceful fallbacks.

## Key code changes for Base44
- `backend/firebaseAdmin.js` — added `FIREBASE_SERVICE_ACCOUNT` env var support (JSON string → `admin.credential.cert()`), with try-catch so the backend boots without credentials.
- `backend/server.js` — CORS allows the preview origin via `BASE44_PUBLIC_HOST_SUFFIX`.
- `frontend/next.config.mjs` — `allowedDevOrigins` set from `BASE44_PUBLIC_HOST_SUFFIX` so Next.js dev accepts the preview origin.

## Verification
- `curl https://3000-$BASE44_PUBLIC_HOST_SUFFIX` — frontend landing page
- `curl https://8000-$BASE44_PUBLIC_HOST_SUFFIX/api/health` — backend health (if route exists)
- Frontend renders without backend credentials (Firebase client SDK uses public config). Backend API calls (login, messaging, reports) need `FIREBASE_SERVICE_ACCOUNT`.
