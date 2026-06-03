# 🎯 DSA Revision Tracker Pro
> A full-stack spaced-repetition system to help you **master Data Structures & Algorithms** — not just memorize them.

Built with **React + TypeScript** on the frontend and **Node.js + Express + MongoDB Atlas** on the backend, deployed on Vercel.

---
## ✨ Features
| Feature | Description |
|---|---|
| 📚 **Question Bank** | Add, edit, duplicate, and organize DSA problems with platform tags, difficulty, and approach notes |
| 🔁 **Spaced Repetition** | Smart revision scheduling based on confidence level — problems resurface exactly when you're about to forget them |
| 📊 **Analytics** | Visual breakdowns of your performance across difficulty, topic, and platform |
| 🧠 **Mistake Intelligence** | Track mistake patterns and weak spots to focus your revision where it matters most |
| 🔥 **Streak & XP System** | Gamified progression with daily streaks, XP points, level-ups, and unlockable achievements |
| 📤 **Import / Export** | Backup and restore your entire question bank as JSON |
| 🔒 **Auth** | JWT-based authentication with secure per-user data isolation |
---
## 🖼️ Pages
- **Dashboard** — Stats overview, due-today list, XP progress, recent revisions, and achievements
- **Question Bank** — Full CRUD with search, filters, and bulk import
- **Revision Queue** — Focused revision mode with confidence rating (1–5)
- **Analytics** — Charts for confidence distribution, revision history, and tag breakdown
- **Mistake Intelligence** — AI-style pattern detection on your weakest questions
- **Settings** — Profile, data export/import, and reset
---
## 🛠️ Tech Stack
**Frontend**
- React 18 + TypeScript
- Vite (Rolldown)
- Tailwind CSS + shadcn/ui (Radix UI)
- Framer Motion for animations
- React Hook Form + Zod for validation
- Recharts / Chart.js for data visualization
- React Router v7
**Backend**
- Node.js + Express
- MongoDB Atlas + Mongoose
- JWT authentication (jsonwebtoken + bcryptjs)
- REST API with full CRUD + `/revise`, `/duplicate`, `/import`, `/reset` endpoints
**DevOps**
- Vercel (frontend deployment)
- CORS with multi-origin support
- Environment-based config (`.env`)
---
## 🚀 Getting Started
### Prerequisites
- Node.js ≥ 20
- npm ≥ 10
- MongoDB Atlas account
### Frontend
```bash
# Install dependencies
npm install
# Start dev server
npm run dev
```
### Backend
```bash
cd backend
# Install dependencies
npm install
# Configure environment
cp .env.example .env
# → Fill in MONGO_URI, JWT_SECRET, CLIENT_URL
# Start dev server
npm run dev
```
### Environment Variables
**Root `.env`**
```
VITE_API_URL=http://localhost:5000/api
```
**`backend/.env`**
```
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```
---
## 📡 API Overview
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/questions` | Fetch all questions for the logged-in user |
| `POST` | `/api/questions` | Add a new question |
| `PUT` | `/api/questions/:id` | Update a question |
| `DELETE` | `/api/questions/:id` | Delete a question |
| `POST` | `/api/questions/:id/duplicate` | Duplicate a question |
| `POST` | `/api/questions/:id/revise` | Mark as revised with a confidence score (1–5) |
| `POST` | `/api/questions/import` | Bulk import (replaces all existing data) |
| `POST` | `/api/questions/reset` | Reset all questions and stats |
| `GET` | `/api/stats` | Get XP, streak, level, and achievements |
| `GET` | `/api/health` | Health check |
All routes (except `/auth`) require a valid `Authorization: Bearer <token>` header.
---
## 🧩 Project Structure
```
DSA/
├── src/
│   ├── api/            # Axios API client & typed endpoints
│   ├── components/     # Shared UI components (shadcn/ui + custom)
│   ├── contexts/       # React context providers
│   ├── hooks/          # Custom hooks (animated counter, auth, etc.)
│   ├── pages/          # Route-level pages
│   │   ├── Dashboard.tsx
│   │   ├── QuestionBank.tsx
│   │   ├── RevisionQueue.tsx
│   │   ├── Analytics.tsx
│   │   ├── MistakeIntelligence.tsx
│   │   └── Settings.tsx
│   ├── services/       # Business logic / data services
│   ├── types/          # Shared TypeScript types
│   └── utils/          # Helpers (confidence labels, date formatting, etc.)
└── backend/
    ├── config/         # DB connection
    ├── middleware/      # JWT auth middleware
    ├── models/         # Mongoose schemas (User, Question)
    ├── routes/         # Express route handlers
    └── utils/          # XP, streak, and achievement logic
```
---
## 📈 Spaced Repetition Logic
When you revise a question and rate your confidence (1–5), the backend calculates the **next revision date** using a spaced repetition algorithm:
- **Confidence 1** → review in 1 day
- **Confidence 2** → review in 3 days
- **Confidence 3** → review in 7 days
- **Confidence 4** → review in 14 days
- **Confidence 5 (Mastered)** → review in 30 days
Each revision also awards **XP**, updates your **streak**, and checks for **achievement unlocks**.
---
## 🏆 Gamification
- **XP System** — Earn XP for adding questions, completing revisions, and mastering problems
- **Levels** — Progress through levels as your XP grows
- **Streaks** — Maintain daily revision streaks (tracked and stored per user)
- **Achievements** — Unlock badges for milestones (e.g., first question, 10 mastered, DP expert)
---
<p align="center">Built with ❤️ to make DSA prep actually stick.</p>
