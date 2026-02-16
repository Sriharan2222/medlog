# 🏥 MedLog — Secure Medication Logger

A role-based medication logging and QR-based access system for patients and doctors.

## Features

- **Doctor Dashboard** — Register patients, prescribe medications, manage change requests
- **Patient Dashboard** — View prescriptions (read-only), QR code for instant access, submit change requests
- **QR Code Flow** — Scan a patient's QR to instantly view their active medications (no login required)
- **Immutable Prescriptions** — Old prescriptions are replaced, never edited
- **Audit Trail** — Every action is logged for compliance

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) |
| Backend | Express.js |
| Database | SQLite (via Prisma — upgradeable to PostgreSQL) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| QR | qrcode (npm) |

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
node src/index.js
```
Server runs at `http://localhost:5000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs at `http://localhost:3000`

## User Roles

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| **Doctor** | Register patients, prescribe, respond to change requests | Edit old prescriptions |
| **Patient** | View prescriptions, QR code, submit change requests | Edit or delete prescriptions |
| **Public (QR)** | View active medications | See personal info or edit anything |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register doctor or patient |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | ✅ | Get profile |
| POST | `/api/doctor/patients` | 🩺 | Register patient |
| GET | `/api/doctor/patients` | 🩺 | List patients |
| POST | `/api/doctor/prescriptions` | 🩺 | Create prescription |
| GET | `/api/doctor/change-requests` | 🩺 | View change requests |
| GET | `/api/patient/prescriptions` | 🧑 | View own prescriptions |
| GET | `/api/patient/qr` | 🧑 | Get QR code |
| POST | `/api/patient/change-requests` | 🧑 | Submit change request |
| GET | `/api/public/patient/:qrToken` | — | Public medication view |

## License

MIT
