# Quiz Platform - Backend Documentation

## Overview
Backend API for the Quiz Platform. This document provides the complete API specification and implementation guidelines for developers working on the backend services.

## Tech Stack Recommendations
- **Runtime**: Node.js 18+
- **Framework**: Express.js or Fastify
- **Database**: PostgreSQL or MongoDB
- **Authentication**: JWT
- **Real-time**: Socket.io
- **File Processing**: PDF-parse
- **Validation**: Joi or Zod
- **Testing**: Jest + Supertest

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: string,
  password: string, // hashed
  role: "teacher" | "student",
  name: string,
  avatar?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Quizzes Collection
```javascript
{
  _id: ObjectId,
  title: string,
  description?: string,
  teacherId: ObjectId,
  questions: [
    {
      id: number,
      question: string,
      options: string[],
      correctAnswer: number,
      timeLimit?: number // seconds
    }
  ],
  settings: {
    timeLimit: number, // total quiz time in minutes
    allowRetake: boolean,
    showResults: boolean,
    randomizeQuestions: boolean
  },
  status: "draft" | "active" | "completed",
  joinCode: string, // 6-digit code
  createdAt: Date,
  updatedAt: Date
}
```

### Quiz Sessions Collection
```javascript
{
  _id: ObjectId,
  quizId: ObjectId,
  studentId: ObjectId,
  startTime: Date,
  endTime?: Date,
  answers: [
    {
      questionId: number,
      selectedAnswer: number,
      timeSpent: number // seconds
    }
  ],
  score: number,
  totalQuestions: number,
  status: "in_progress" | "completed" | "abandoned",
  createdAt: Date
}
```

### Tournaments Collection
```javascript
{
  _id: ObjectId,
  name: string,
  description?: string,
  teacherId: ObjectId,
  quizId: ObjectId,
  participants: [
    {
      studentId: ObjectId,
      name: string,
      status: "registered" | "eliminated" | "winner"
    }
  ],
  rounds: [
    {
      roundNumber: number,
      matches: [
        {
          matchId: number,
          player1: ObjectId,
          player2: ObjectId,
          winner?: ObjectId,
          score: {
            player1: number,
            player2: number
          },
          status: "pending" | "in_progress" | "completed"
        }
      ],
      status: "pending" | "active" | "completed"
    }
  ],
  status: "registration" | "active" | "completed",
  createdAt: Date,
  updatedAt: Date
}
```

### PDF Uploads Collection
```javascript
{
  _id: ObjectId,
  teacherId: ObjectId,
  filename: string,
  originalName: string,
  fileSize: number,
  mimeType: string,
  extractedText: string,
  generatedQuestions: [
    {
      question: string,
      options: string[],
      correctAnswer: number
    }
  ],
  status: "processing" | "completed" | "failed",
  createdAt: Date
}
```

## API Endpoints

### Authentication
```javascript
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
PUT    /api/auth/profile
```

### Quizzes
```javascript
GET    /api/quizzes                    // Get all quizzes (teacher's quizzes)
POST   /api/quizzes                    // Create new quiz
GET    /api/quizzes/:id                // Get specific quiz
PUT    /api/quizzes/:id                // Update quiz
DELETE /api/quizzes/:id                // Delete quiz
POST   /api/quizzes/:id/publish        // Publish quiz (generate join code)
```

### Quiz Sessions
```javascript
POST   /api/quizzes/join               // Student joins quiz
GET    /api/quizzes/:joinCode          // Get quiz by join code
POST   /api/quizzes/:id/submit         // Submit quiz answers
GET    /api/quizzes/:id/results        // Get quiz results
GET    /api/quizzes/:id/leaderboard    // Get quiz leaderboard
```

### Students
```javascript
GET    /api/students                   // Get all students (for teacher)
GET    /api/students/:id               // Get student profile
GET    /api/students/:id/results       // Get student's quiz history
POST   /api/students/:id/quiz/:id      // Start quiz session
```

### Tournaments
```javascript
GET    /api/tournaments                // Get all tournaments
POST   /api/tournaments                // Create tournament
GET    /api/tournaments/:id            // Get tournament details
PUT    /api/tournaments/:id            // Update tournament
DELETE /api/tournaments/:id            // Delete tournament
POST   /api/tournaments/:id/register   // Student registers
POST   /api/tournaments/:id/match/:id  // Update match result
GET    /api/tournaments/:id/bracket    // Get tournament bracket
```

### PDF Processing
```javascript
POST   /api/pdf/upload                 // Upload PDF for processing
GET    /api/pdf/:id/status             // Get processing status
GET    /api/pdf/:id/questions          // Get generated questions
POST   /api/pdf/:id/confirm            // Confirm and create quiz
```

### Analytics & Stats
```javascript
GET    /api/stats/teacher              // Teacher dashboard stats
GET    /api/stats/quiz/:id             // Quiz-specific stats
GET    /api/stats/student/:id          // Student performance stats
GET    /api/stats/tournament/:id       // Tournament statistics
```

## Request/Response Examples

### Create Quiz
```javascript
// POST /api/quizzes
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
    "timeLimit": 30,
    "allowRetake": false,
    "showResults": true,
    "randomizeQuestions": false
  }
}

// Response
{
  "success": true,
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "title": "Math Fundamentals",
    "joinCode": "A7B9C2",
    "status": "draft",
    "createdAt": "2024-04-11T18:16:00.000Z"
  }
}
```

### Join Quiz
```javascript
// POST /api/quizzes/join
{
  "joinCode": "A7B9C2",
  "studentName": "John Doe"
}

// Response
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
    }
  }
}
```

## WebSocket Events

### Real-time Quiz Updates
```javascript
// Client -> Server
socket.emit('join-quiz', { sessionId: '...' })
socket.emit('submit-answer', { sessionId: '...', questionId: 1, answer: 1 })

// Server -> Client
socket.emit('quiz-started', { startTime: '...' })
socket.emit('question-timer', { questionId: 1, timeLeft: 25 })
socket.emit('quiz-ended', { results: [...] })
socket.emit('leaderboard-update', { leaderboard: [...] })
```

### Tournament Updates
```javascript
// Server -> Client
socket.emit('tournament-updated', { tournament: {...} })
socket.emit('match-started', { match: {...} })
socket.emit('match-ended', { match: {...} })
socket.emit('tournament-ended', { winner: {...} })
```

## Error Handling
```javascript
// Standard error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "message": "Email is required"
    }
  }
}

// Common error codes
VALIDATION_ERROR      // 400
UNAUTHORIZED          // 401
FORBIDDEN            // 403
NOT_FOUND            // 404
CONFLICT             // 409
RATE_LIMIT_EXCEEDED  // 429
INTERNAL_ERROR       // 500
```

## Environment Variables
```bash
# Database
DATABASE_URL=mongodb://localhost:27017/quiz-platform
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  // 10MB

# External Services
PDF_SERVICE_URL=http://localhost:3001
EMAIL_SERVICE_API_KEY=your-email-api-key

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## Security Implementation

### Authentication
- JWT tokens with expiration
- Refresh token rotation
- Password hashing with bcrypt
- Rate limiting on auth endpoints

### Data Validation
- Input sanitization
- SQL injection prevention
- XSS protection
- File upload validation

### Authorization
- Role-based access control
- Resource ownership checks
- API key authentication for services

## Performance Considerations

### Database Optimization
- Proper indexing on frequently queried fields
- Connection pooling
- Query optimization
- Caching strategies

### API Performance
- Response compression
- Pagination for large datasets
- Lazy loading for related data
- CDN for static assets

### Real-time Features
- Socket.io room management
- Efficient event broadcasting
- Connection state management
- Automatic reconnection

## Testing Strategy

### Unit Tests
- Model validation
- Business logic
- Utility functions
- API endpoints

### Integration Tests
- Database operations
- Authentication flow
- File upload process
- WebSocket connections

### Load Testing
- Concurrent quiz sessions
- Tournament performance
- PDF processing queue
- Database connection limits

## Deployment

### Docker Setup
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Production Checklist
- Environment variables configuration
- Database migrations
- SSL certificates
- Backup strategy
- Monitoring setup
- Log aggregation
- Error tracking

## Monitoring & Logging

### Metrics to Track
- API response times
- Database query performance
- Active quiz sessions
- WebSocket connections
- File processing queue
- Error rates

### Logging Strategy
- Structured logging with JSON
- Different log levels (error, warn, info, debug)
- Request/response logging
- Performance metrics
- Security events

## Scaling Considerations

### Horizontal Scaling
- Load balancer configuration
- Session management (Redis)
- Database read replicas
- Microservices architecture

### Feature Flags
- New feature rollouts
- A/B testing
- Gradual user migration
- Emergency disable switches

## Development Guidelines

### Code Organization
- Layered architecture (controllers, services, models)
- Dependency injection
- Error handling middleware
- Consistent naming conventions

### API Design Principles
- RESTful conventions
- Consistent response formats
- Proper HTTP status codes
- Comprehensive documentation

### Git Workflow
- Feature branches
- Pull request reviews
- Automated testing
- Semantic versioning
