# Quiz Platform Backend

Express.js backend with JWT authentication, role-based authorization, quiz management, and join-by-code sessions.

## Setup

1. Copy `.env.example` to `.env`
2. Set `JWT_SECRET`
3. Install deps:
   - `npm install`
4. Run:
   - `npm run dev`

Base URL: `http://localhost:5000/api/v1`

## Demo Users

- Teacher: `teacher1` / `password123`
- Student: `student1` / `password123`

## Endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Quizzes (teacher)

- `POST /quizzes`
- `GET /quizzes`
- `GET /quizzes/:quizId`
- `PUT /quizzes/:quizId`
- `DELETE /quizzes/:quizId`

### Sessions (join by code)

- `POST /sessions` (teacher creates live session for quiz)
- `GET /sessions` (teacher list)
- `POST /sessions/join` (student joins with code)
- `GET /sessions/:sessionId`
- `POST /sessions/:sessionId/start` (teacher starts)
- `POST /sessions/:sessionId/submit` (student submits answers)
- `GET /sessions/:sessionId/results` (teacher sees class, student sees own)
