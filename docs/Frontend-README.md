# Quiz Platform - Frontend Documentation

## Overview
A modern, interactive quiz platform built with React, Vite, and Tailwind CSS. The platform supports both teachers and students with features like quiz creation, tournaments, PDF uploads, and real-time results.

## Tech Stack
- **Frontend**: React 18.2.0
- **Build Tool**: Vite 8.0.8
- **Styling**: Tailwind CSS 3.3.3
- **Routing**: React Router DOM 6.15.0
- **Animations**: Framer Motion 10.16.4
- **Icons**: Lucide React 0.279.0
- **Notifications**: React Hot Toast 2.4.1

## Project Structure
```
src/
  components/     # Reusable UI components
  data/          # Mock data and API helpers
  layouts/       # Layout components
  pages/         # Page components
  assets/        # Static assets
  styles/        # Global styles
```

## Key Features

### Teacher Features
- **Dashboard**: Overview of quizzes, students, and statistics
- **Quiz Creation**: Manual quiz creation with multiple choice questions
- **PDF Upload**: Convert PDF content to quiz questions
- **Results Management**: View and analyze student performance
- **Tournament Management**: Create and manage quiz tournaments

### Student Features
- **Quiz Joining**: Join quizzes via unique codes
- **Interactive Quiz Interface**: Real-time quiz taking experience
- **Results Viewing**: View individual scores and rankings
- **Tournament Participation**: Compete in quiz tournaments

## Available Pages & Routes

### Public Routes
- `/` - Landing page with role selection

### Teacher Routes
- `/teacher` - Teacher dashboard
- `/teacher/create-quiz` - Create new quiz
- `/teacher/upload-pdf` - Upload PDF to generate quiz
- `/teacher/results` - View quiz results
- `/teacher/tournament` - Manage tournaments

### Student Routes
- `/student/join` - Join quiz page
- `/student/quiz` - Active quiz interface
- `/student/results` - View results

## Data Structure

### Quiz Object
```javascript
{
  id: number,
  title: string,
  questions: [
    {
      id: number,
      question: string,
      options: string[],
      correctAnswer: number
    }
  ],
  createdAt: string,
  status: "active" | "completed"
}
```

### Student Object
```javascript
{
  id: number,
  name: string,
  score: number,
  rank: number,
  quizId: number
}
```

### Tournament Object
```javascript
{
  id: number,
  name: string,
  rounds: [
    {
      round: number,
      matches: [
        {
          id: number,
          player1: string,
          player2: string,
          winner: string,
          score: string
        }
      ]
    }
  ]
}
```

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

## API Integration

### Current State
- Uses mock data from `src/data/mockData.js`
- All data is stored locally in component state
- No real backend integration yet

### Required API Endpoints
```javascript
// Quiz Management
POST   /api/quizzes              // Create quiz
GET    /api/quizzes              // Get all quizzes
GET    /api/quizzes/:id          // Get specific quiz
PUT    /api/quizzes/:id          // Update quiz
DELETE /api/quizzes/:id          // Delete quiz

// Student Management
POST   /api/students/join        // Student joins quiz
POST   /api/students/submit      // Submit quiz answers
GET    /api/students/results/:id // Get student results

// Tournament Management
POST   /api/tournaments          // Create tournament
GET    /api/tournaments/:id      // Get tournament details
PUT    /api/tournaments/:id      // Update tournament

// PDF Processing
POST   /api/pdf/upload           // Upload PDF for quiz generation
```

## Environment Variables
```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

## Styling & Theming
- **Theme**: Dark theme with glassmorphism effects
- **Colors**: Primary blues and purples with white text
- **Animations**: Smooth transitions using Framer Motion
- **Responsive**: Mobile-first design approach

## Key Components
- `MainLayout` - Main app layout with navigation
- `QuizCard` - Quiz display component
- `TournamentBracket` - Tournament visualization
- `ProgressBar` - Progress indicators
- `ScoreCard` - Score display components

## State Management
- Currently using React state and context
- Consider Redux/Zustand for larger scale
- Real-time updates needed for live quizzes

## Performance Considerations
- Lazy loading for large quiz lists
- Virtual scrolling for tournament brackets
- Optimized re-renders with React.memo
- Code splitting by routes

## Security Notes
- Input validation for quiz creation
- XSS protection for user-generated content
- CSRF protection for API calls
- Rate limiting for quiz submissions

## Future Enhancements
- Real-time WebSocket integration
- Advanced quiz question types
- Video/audio support
- Analytics dashboard
- Multi-language support
- Accessibility improvements

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing
1. Follow the existing code style
2. Add components to appropriate directories
3. Update mock data when adding new features
4. Test on multiple screen sizes
5. Document new components and features
