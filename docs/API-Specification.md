# Quiz Platform - Complete API Specification

## Base URL
```
Development: http://localhost:3000/api
Production: https://api.quizplatform.com/v1
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All API responses follow this structure:
```javascript
{
  "success": true,
  "data": {}, // Response data
  "message": "Operation successful", // Optional
  "timestamp": "2024-04-11T18:16:00.000Z"
}
```

Error responses:
```javascript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Additional error details
  },
  "timestamp": "2024-04-11T18:16:00.000Z"
}
```

## Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "teacher" // or "student"
}
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "teacher",
      "createdAt": "2024-04-11T18:16:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "avatar": "base64_image_data"
}
```

## Quiz Management Endpoints

### Get All Quizzes (Teacher)
```http
GET /quizzes
Authorization: Bearer <token>
Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- status: string (optional: "draft", "active", "completed")
- search: string (optional)
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "quizzes": [
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "title": "Math Fundamentals",
        "description": "Basic mathematics quiz",
        "status": "active",
        "joinCode": "A7B9C2",
        "questionsCount": 10,
        "participantsCount": 25,
        "createdAt": "2024-04-11T18:16:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "pages": 5
    }
  }
}
```

### Create Quiz
```http
POST /quizzes
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Math Fundamentals",
  "description": "Basic mathematics quiz",
  "questions": [
    {
      "question": "What is 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": 1,
      "timeLimit": 30
    }
  ],
  "settings": {
    "timeLimit": 30, // minutes
    "allowRetake": false,
    "showResults": true,
    "randomizeQuestions": false
  }
}
```

### Get Quiz by ID
```http
GET /quizzes/{quizId}
Authorization: Bearer <token>
```

### Update Quiz
```http
PUT /quizzes/{quizId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Math Quiz",
  "description": "Updated description",
  "questions": [...],
  "settings": {...}
}
```

### Delete Quiz
```http
DELETE /quizzes/{quizId}
Authorization: Bearer <token>
```

### Publish Quiz
```http
POST /quizzes/{quizId}/publish
Authorization: Bearer <token>
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "joinCode": "A7B9C2",
    "publishedAt": "2024-04-11T18:16:00.000Z"
  }
}
```

## Quiz Session Endpoints

### Join Quiz (Student)
```http
POST /quizzes/join
Content-Type: application/json

{
  "joinCode": "A7B9C2",
  "studentName": "John Doe"
}
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "sessionId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "quiz": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "title": "Math Fundamentals",
      "timeLimit": 30,
      "questions": [
        {
          "id": 1,
          "question": "What is 2 + 2?",
          "options": ["3", "4", "5", "6"],
          "timeLimit": 30
        }
      ]
    },
    "student": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "John Doe"
    }
  }
}
```

### Get Quiz by Join Code
```http
GET /quizzes/join/{joinCode}
```

### Submit Quiz Answers
```http
POST /quizzes/{quizId}/submit
Content-Type: application/json

{
  "sessionId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "answers": [
    {
      "questionId": 1,
      "selectedAnswer": 1,
      "timeSpent": 25
    }
  ],
  "completedAt": "2024-04-11T18:45:00.000Z"
}
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "score": 85,
    "totalQuestions": 10,
    "correctAnswers": 8,
    "timeSpent": 1800, // seconds
    "rank": 3,
    "results": [
      {
        "questionId": 1,
        "correct": true,
        "selectedAnswer": 1,
        "correctAnswer": 1
      }
    ]
  }
}
```

### Get Quiz Results
```http
GET /quizzes/{quizId}/results
Authorization: Bearer <token>
Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
```

### Get Quiz Leaderboard
```http
GET /quizzes/{quizId}/leaderboard
Query Parameters:
- limit: number (default: 10)
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "studentId": "64f8a1b2c3d4e5f6a7b8c9d2",
        "studentName": "Alice Johnson",
        "score": 95,
        "timeSpent": 1650,
        "completedAt": "2024-04-11T18:30:00.000Z"
      }
    ]
  }
}
```

## Student Management Endpoints

### Get All Students (Teacher)
```http
GET /students
Authorization: Bearer <token>
```

### Get Student Profile
```http
GET /students/{studentId}
Authorization: Bearer <token>
```

### Get Student Quiz History
```http
GET /students/{studentId}/results
Authorization: Bearer <token>
Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
```

### Start Quiz Session
```http
POST /students/{studentId}/quiz/{quizId}
Authorization: Bearer <token>
```

## Tournament Management Endpoints

### Get All Tournaments
```http
GET /tournaments
Authorization: Bearer <token>
```

### Create Tournament
```http
POST /tournaments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Math Championship 2024",
  "description": "Annual mathematics competition",
  "quizId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "maxParticipants": 32,
  "settings": {
    "matchTimeLimit": 10, // minutes per match
    "bracketType": "single_elimination"
  }
}
```

### Get Tournament Details
```http
GET /tournaments/{tournamentId}
```

### Update Tournament
```http
PUT /tournaments/{tournamentId}
Authorization: Bearer <token>
```

### Delete Tournament
```http
DELETE /tournaments/{tournamentId}
Authorization: Bearer <token>
```

### Register for Tournament
```http
POST /tournaments/{tournamentId}/register
Content-Type: application/json

{
  "studentId": "64f8a1b2c3d4e5f6a7b8c9d2",
  "studentName": "John Doe"
}
```

### Update Match Result
```http
POST /tournaments/{tournamentId}/match/{matchId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "winner": "64f8a1b2c3d4e5f6a7b8c9d2",
  "score": {
    "player1": 3,
    "player2": 1
  },
  "matchDuration": 450 // seconds
}
```

### Get Tournament Bracket
```http
GET /tournaments/{tournamentId}/bracket
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "tournament": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "name": "Math Championship 2024",
      "status": "active",
      "currentRound": 2
    },
    "rounds": [
      {
        "roundNumber": 1,
        "status": "completed",
        "matches": [
          {
            "matchId": 1,
            "player1": {
              "id": "64f8a1b2c3d4e5f6a7b8c9d2",
              "name": "Alice Johnson"
            },
            "player2": {
              "id": "64f8a1b2c3d4e5f6a7b8c9d4",
              "name": "Bob Smith"
            },
            "winner": "64f8a1b2c3d4e5f6a7b8c9d2",
            "score": { "player1": 3, "player2": 1 },
            "status": "completed"
          }
        ]
      }
    ]
  }
}
```

## PDF Processing Endpoints

### Upload PDF
```http
POST /pdf/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [PDF file]
title: "Generated from PDF"
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "uploadId": "64f8a1b2c3d4e5f6a7b8c9d5",
    "filename": "document.pdf",
    "status": "processing"
  }
}
```

### Get Processing Status
```http
GET /pdf/{uploadId}/status
Authorization: Bearer <token>
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "status": "completed", // "processing", "completed", "failed"
    "progress": 100,
    "extractedText": "Extracted text content...",
    "generatedQuestions": [
      {
        "question": "What is the capital of France?",
        "options": ["London", "Paris", "Berlin", "Madrid"],
        "correctAnswer": 1
      }
    ]
  }
}
```

### Get Generated Questions
```http
GET /pdf/{uploadId}/questions
Authorization: Bearer <token>
```

### Confirm and Create Quiz
```http
POST /pdf/{uploadId}/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Quiz from PDF",
  "description": "Generated from document.pdf",
  "selectedQuestions": [0, 1, 2], // indices of questions to include
  "settings": {
    "timeLimit": 30,
    "allowRetake": false,
    "showResults": true
  }
}
```

## Analytics & Statistics Endpoints

### Get Teacher Dashboard Stats
```http
GET /stats/teacher
Authorization: Bearer <token>
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "totalQuizzes": 12,
    "totalStudents": 45,
    "activeQuizzes": 3,
    "averageScore": 82.5,
    "recentActivity": [
      {
        "type": "quiz_created",
        "message": "Created new quiz: History Quiz",
        "timestamp": "2024-04-11T16:16:00.000Z"
      }
    ],
    "performanceData": {
      "daily": [
        {
          "date": "2024-04-10",
          "quizzesTaken": 25,
          "averageScore": 85
        }
      ]
    }
  }
}
```

### Get Quiz Statistics
```http
GET /stats/quiz/{quizId}
Authorization: Bearer <token>
```

### Get Student Performance Stats
```http
GET /stats/student/{studentId}
Authorization: Bearer <token>
```

### Get Tournament Statistics
```http
GET /stats/tournament/{tournamentId}
Authorization: Bearer <token>
```

## WebSocket Events

### Connection
```javascript
// Connect to WebSocket
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'jwt_token'
  }
});
```

### Quiz Events

#### Join Quiz Room
```javascript
// Client -> Server
socket.emit('join-quiz', {
  sessionId: '64f8a1b2c3d4e5f6a7b8c9d1'
});

// Server -> Client
socket.emit('quiz-joined', {
  sessionId: '64f8a1b2c3d4e5f6a7b8c9d1',
  participants: 15
});
```

#### Quiz Start/End
```javascript
// Server -> Client
socket.emit('quiz-started', {
  startTime: '2024-04-11T18:30:00.000Z',
  duration: 1800
});

socket.emit('quiz-ended', {
  endTime: '2024-04-11T19:00:00.000Z',
  results: [...]
});
```

#### Question Timer
```javascript
// Server -> Client
socket.emit('question-timer', {
  questionId: 1,
  timeLeft: 25,
  totalTime: 30
});
```

#### Live Leaderboard
```javascript
// Server -> Client
socket.emit('leaderboard-update', {
  leaderboard: [
    {
      rank: 1,
      studentName: "Alice Johnson",
      score: 95,
      progress: 80
    }
  ]
});
```

### Tournament Events

#### Tournament Updates
```javascript
// Server -> Client
socket.emit('tournament-updated', {
  tournament: {...},
  nextMatch: {...}
});
```

#### Match Events
```javascript
// Server -> Client
socket.emit('match-started', {
  matchId: 1,
  player1: "Alice",
  player2: "Bob",
  startTime: '2024-04-11T18:30:00.000Z'
});

socket.emit('match-ended', {
  matchId: 1,
  winner: "Alice",
  finalScore: { player1: 3, player2: 1 }
});
```

## Error Codes

### Authentication Errors
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Invalid token
- `AUTH_004`: Insufficient permissions

### Validation Errors
- `VALID_001`: Required field missing
- `VALID_002`: Invalid email format
- `VALID_003`: Password too weak
- `VALID_004`: Invalid file type

### Business Logic Errors
- `BIZ_001`: Quiz not found
- `BIZ_002`: Quiz already active
- `BIZ_003`: Join code invalid
- `BIZ_004`: Student already joined
- `BIZ_005`: Tournament full
- `BIZ_006`: Match already completed

### System Errors
- `SYS_001`: Database error
- `SYS_002`: File upload error
- `SYS_003`: External service error
- `SYS_004`: Rate limit exceeded

## Rate Limiting

### Endpoints Limits
- Authentication: 5 requests per minute
- Quiz creation: 10 requests per hour
- PDF upload: 3 requests per hour
- General API: 100 requests per minute

### Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1649692800
```

## Pagination

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field
- `order`: Sort order (asc, desc)

### Response Format
```javascript
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "pages": 16,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## File Upload

### Supported Formats
- PDF: `.pdf` (max 10MB)
- Images: `.jpg`, `.jpeg`, `.png`, `.gif` (max 5MB)

### Upload Process
1. Client uploads file to `/upload` endpoint
2. Server stores file and returns file ID
3. Client uses file ID in subsequent requests

### Response
```javascript
{
  "success": true,
  "data": {
    "fileId": "64f8a1b2c3d4e5f6a7b8c9d6",
    "filename": "document.pdf",
    "size": 1048576,
    "mimeType": "application/pdf",
    "url": "/files/64f8a1b2c3d4e5f6a7b8c9d6"
  }
}
```
