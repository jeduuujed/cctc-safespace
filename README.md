## CCTC SafeSpace

A full-stack student safety platform with:
- AI-guided incident reporting (OpenAI)
- Role-based private messaging (student-counselor, teacher-counselor, student-teacher)
- Firebase Authentication, Firestore, and Storage
- Optional Azure Face login (server-verified, then Firebase custom token)

### Structure

- `frontend/` – Next.js app
- `backend/` – Express API
- `firestore.rules` – client access rules (deploy with Firebase CLI)

### Prerequisites

- Node.js 18+ and npm
- Firebase project `cctcsafespace`
- OpenAI API key
- SMTP/Gmail app password for report emails
- Firebase Admin service account JSON (`GOOGLE_APPLICATION_CREDENTIALS`)

### Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env` from `.env.example`. Required:

```
OPENAI_KEY=
GOOGLE_APPLICATION_CREDENTIALS=absolute_path_to_service_account.json
FIREBASE_PROJECT_ID=cctcsafespace
ADMIN_EMAILS=admin@your-school.edu
EMAIL_USER=
EMAIL_PASS=
EMAIL_TO=
```

Optional face login:

```
AZURE_FACE_API_KEY=
AZURE_FACE_ENDPOINT=https://YOUR-RESOURCE.cognitiveservices.azure.com
AZURE_FACE_PERSON_GROUP=cctc-safespace
```

```bash
npm run dev
```

API: `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_ADMIN_EMAILS=admin@your-school.edu
```

```bash
npm run dev
```

App: `http://localhost:3000`

### Firestore rules

Deploy after reviewing `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

Messaging documents are created only by the backend. Clients may **read** conversations they participate in so the chat UI can update in real time.

### Creating accounts

1. Register at `/register`. New accounts are **students**.
2. Add your admin email to `ADMIN_EMAILS` and `NEXT_PUBLIC_ADMIN_EMAILS`, then sign in. The backend promotes that email to admin on first profile create.
3. Open **Manage Users** (`/admin/users`) to assign `teacher`, `counselor`, or `admin` roles, counselor assignments, and authorized teachers.
4. Optional: `cd backend && node create-admin.js you@school.edu yourpassword`

Users cannot assign privileged roles to themselves.

### Testing messaging

1. Create student A, student B, teacher, counselor, and admin.
2. Admin assigns student A to the counselor and authorizes the teacher for student A only.
3. Student A can message that counselor and that teacher.
4. Student B cannot open student A’s conversations.
5. The teacher cannot see student-counselor chats.
6. Teacher and counselor can message each other on the Teacher/Counselor tabs.

### Face login

Face login is **not** a client-side photo match. Enrollment and verification call Azure Face from the Express server, then issue a Firebase custom token.

Required Azure setup:

1. Create an Azure AI Face resource and apply for [Face Limited Access](https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/overview-identity) if Identification is gated.
2. For production liveness, add [Azure Face liveness](https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/how-to/face-liveness) (separate SDK). This app does not fake liveness.
3. Grant the Firebase service account permission to create custom tokens.
4. Set `AZURE_FACE_API_KEY` and `AZURE_FACE_ENDPOINT` on the backend.

Until those are configured, the Face Login UI explains the missing service and password login still works.

### Incident reporting

Anonymous **incident reports** remain available. That is separate from direct messaging, which always uses the signed-in sender.

### Main endpoints

- `POST /api/chat` – AI assistant
- `POST /api/report` – submit incident report
- `GET /api/reports` – counselor/admin
- `GET /api/reports/mine` – signed-in student’s identifiable reports
- `/api/messaging/*` – authenticated conversations
- `/api/users/*` – profiles and admin access management
- `/api/face-auth/*` – optional face enrollment/verify
