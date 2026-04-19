# Cuemath Flashcard Engine

An AI-powered spaced repetition flashcard platform built for Cuemath. Upload a PDF, and the engine automatically generates structured flashcards using the Claude AI API, then schedules your study sessions using the SM-2 algorithm — with a unique Topology Gate that enforces correct learning order.

---

## Architecture

```
React 18 + Vite (frontend/)          Spring Boot 3.2.5 (src/)
       │                                       │
       │  REST / JSON over HTTP                │
       └──────────────────────────────────────►│
                                               ├─ Auth (JWT, refresh tokens)
                                               ├─ Decks (PDF upload, async processing)
                                               ├─ Cards (AI generation via Claude API)
                                               ├─ Study (SM-2 scheduler + Topology Gate)
                                               ├─ Progress (mastery tracking)
                                               └─ PostgreSQL 16 (Flyway migrations)
```

**Tech stack:** Java 21 · Spring Boot 3.2.5 · Spring Security 6 · Spring Data JPA · PostgreSQL 16 · Apache PDFBox 3.0.2 · Flyway 10 · React 18 · Vite · Zustand · Axios · React Router v6 · Bucket4j

---

## SM-2 Algorithm

The engine uses the [SM-2 spaced repetition algorithm](https://www.supermemo.com/en/articles/sm2):

- After each card review you rate your recall quality from **0 (complete blackout)** to **5 (perfect recall)**.
- **Rating < 3:** the card resets — repetitions go to 0, interval returns to 1 day.
- **Rating ≥ 3:** the easiness factor (EF) is updated: `new_EF = EF + 0.1 − (5−q)×(0.08 + (5−q)×0.02)`, floored at 1.3. The interval grows: 1 day → 6 days → `round(prev_interval × EF)` on subsequent reviews.
- `next_review_at = today + interval_days`

This means cards you know well surface less and less frequently, while cards you struggle with come back sooner.

---

## Topology Gate — The Differentiator

Most flashcard apps let you study cards in any order. The Flashcard Engine enforces **prerequisite mastery** before unlocking dependent cards.

### How it works

1. When generating flashcards from a PDF, the AI (Claude) identifies **prerequisite relationships** between concepts — e.g. you cannot understand "Derivative Rules" without first mastering "Limits".
2. These relationships are stored as a directed graph in `card_dependencies`.
3. When building the study queue, the Topology Gate checks every card's prerequisites:
   - A prerequisite is **mastered** when `repetitions ≥ 2 AND easiness_factor ≥ 2.0`.
   - If **any** prerequisite is not yet mastered → the card is **excluded** from the queue.
   - Only cards with **all prerequisites mastered** (or no prerequisites at all) and a `next_review_at ≤ today` enter the queue.

### Why this matters

Students often struggle because they try to learn advanced concepts before solidifying the foundations. The Topology Gate makes this impossible — you are guided through the knowledge graph in the correct dependency order, ensuring every concept you encounter rests on a solid base.

---

## Running Locally

### Prerequisites
- Java 21+
- Node.js 18+
- Docker & Docker Compose

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set a real JWT_SECRET (32+ chars) and your CLAUDE_API_KEY
```

### 3. Run the backend

```bash
export $(cat .env | xargs)
./mvnw spring-boot:run
# API available at http://localhost:8080
```

### 4. Run the frontend

```bash
cd frontend
cp .env.example .env    # VITE_API_BASE_URL=http://localhost:8080
npm install
npm run dev
# App available at http://localhost:5173
```

---

## Required Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | JDBC URL, e.g. `jdbc:postgresql://localhost:5432/flashcard` |
| `DATABASE_USERNAME` | PostgreSQL username |
| `DATABASE_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | HS256 signing secret — minimum 32 characters |
| `JWT_ACCESS_EXPIRY_MS` | Access token lifetime in ms (default: 900000 = 15 min) |
| `JWT_REFRESH_EXPIRY_MS` | Refresh token lifetime in ms (default: 604800000 = 7 days) |
| `CLAUDE_API_KEY` | Anthropic API key (`sk-ant-...`) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins, e.g. `http://localhost:5173` |

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, get JWT |
| POST | `/api/auth/refresh` | — | Refresh access token |
| GET | `/api/decks` | ✓ | List user's decks |
| POST | `/api/decks` | ✓ | Upload PDF (rate limited: 5/hr) |
| GET | `/api/decks/{id}` | ✓ | Get deck details |
| DELETE | `/api/decks/{id}` | ✓ | Delete deck |
| GET | `/api/decks/{id}/cards` | ✓ | List AI-generated cards |
| GET | `/api/decks/{id}/graph` | ✓ | Prerequisite dependency graph |
| GET | `/api/study/queue` | ✓ | Topology-gated study queue |
| POST | `/api/study/review` | ✓ | Submit SM-2 review rating |
| GET | `/api/progress/summary` | ✓ | Global mastery summary |
| GET | `/api/progress/deck/{id}` | ✓ | Per-deck mastery breakdown |

---

## Flyway Migrations

| Version | Description |
|---|---|
| V1 | Create users table |
| V2 | Create refresh_tokens table |
| V3 | Create decks table |
| V4 | Create cards table |
| V5 | Create card_dependencies table |
| V6 | Create card_reviews table |
| V7 | Create misconception_logs table |
| V8 | Index on card_reviews(user_id, next_review_at) |
