
## Key Features

### Core Features
- **Authentication System**: Role-based login (Teacher/Student) with LocalStorage simulation.
- **Quiz Management**: Create, Edit, Delete quizzes manually or via PDF upload.
- **Results & Analytics**: Detailed score breakdowns and leaderboards.
- **Tournament System**: Championship brackets (Quarter-finals, Semi-finals, Finals).

### Live Games (Gamification Modes)
- **1. Random Duel (Battle Arena)**:
  - Teacher selects 2 random students from class count.
  - Split-screen interface for head-to-head combat.
  - Keyboard controls (Player 1: ASDF, Player 2: JKL;).
  - Visual feedback for correct/wrong answers.
  
- **2. Team Race**:
  - Teacher creates teams and distributes unique PINs.
  - Students join on their own devices.
  - Visual race track with moving cars (CSS/SVG).
  - "Boss Attack" mechanic for wrong answers.
  - Live leaderboard on teacher screen.

- **3. Boss Battle**:
  - Cooperative mode: All teams vs. One Boss (Dragon/Robot/Demon).
  - SVG-based vector graphics for Bosses (dynamic & lightweight).
  - Damage calculation and HP tracking.
  - Victory/Defeat screens with detailed stats (MVP, Damage Dealt).

## Available Pages & Routes

### Public Routes
- `/` - Authentication Page (Login/Register)
- `/auth` - Authentication Page (Alternative)

### Teacher Routes
- `/teacher` - Dashboard (Overview)
- `/teacher/create-quiz` - Manual Quiz Creator
- `/teacher/upload-pdf` - PDF Parser Interface
- `/teacher/results` - Historical Results
- `/teacher/tournament` - Tournament Management (Brackets)

#### Live Games Hub
- `/teacher/games` - **Games Hub** (Central access for all modes)
- `/teacher/games/battle-setup` - Setup Random Duel
- `/teacher/games/team-setup` - Setup Team Race
- `/teacher/games/boss-setup` - Setup Boss Battle

#### Live Monitors (Projector Screens)
- `/teacher/games/battle-arena` - Monitor: Duel Screen
- `/teacher/games/team-arena` - Monitor: Race Track
- `/teacher/games/boss-arena` - Monitor: Boss Fight

### Student Routes
- `/student/join` - Unified Entry Point (Detects Game Type via PIN)
- `/student/quiz` - Traditional Quiz Interface
- `/student/race-player` - Team Race Interface
- `/student/boss-player` - Boss Battle Interface
- `/student/results` - Quiz Results

## Data Structures

### Auth Object
```javascript
{
  id: string,
  name: string,
  email: string,
  role: "teacher" | "student",
  avatar: string (URL)
}
## Quiz Object
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

##Game Session Objects (Required for Backend)
{
  raceId: string,
  teams: [
    {
      id: string,
      name: string,
      code: string, // e.g., "1234"
      color: "red" | "blue" | "green" | "yellow",
      score: number,
      damage: number // Points per correct answer
    }
  ],
  currentQuestionIndex: number,
  status: "waiting" | "active" | "finished"
}
##Boss Battle State
{
  battleId: string,
  boss: {
    name: string,
    emoji: string, // Reference to SVG component
    hp: number,
    currentHp: number,
    damagePerHit: number
  },
  teams: [
    {
      id: string,
      name: string,
      code: string,
      score: number, // Hits
      damage: number,
      hp: number, // Current HP
      maxHp: number
    }
  ],
  status: "active" | "victory" | "defeat"
}
##Tournament Object
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
notic!!!!!!

API Integration Guide (For Backend Developer)
Current Architecture
Storage: Browser localStorage.
Sync: Uses storage events to simulate real-time updates between Teacher Monitor and Student Player tabs.
State Management: React useState and Context API.
Mock Data: Located in src/data/mockData.js.
Required Backend Implementation
1. Authentication Endpoints
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

2. Game Management Endpoints
The backend must handle state logic (calculating HP, validating answers).

#Battle Mode
POST /api/games/battle/start     -> Returns { gamePin, playerKeys }
POST /api/games/battle/action    -> { gamePin, player, answer }
GET  /api/games/battle/state/:pin
#Team Race
POST /api/games/race/create      -> Saves teams & generates PINs
POST /api/games/race/join        -> { pin, teamCode, studentName }
POST /api/games/race/answer      -> Validates answer, updates score
GET  /api/games/race/state/:pin  -> Returns full race state
#Boss Battle
POST /api/games/boss/create      -> Initializes Boss HP & Teams
POST /api/games/boss/attack      -> { pin, teamId, answer }
  -> Logic: If correct -> reduce Boss HP. If wrong -> reduce Team HP.
GET  /api/games/boss/state/:pin

3. Real-Time Synchronization (Crucial)
Since localStorage is not scalable for multiple users, the backend developer must implement WebSockets (Socket.io) or Server-Sent Events (SSE).

Required Events:

join_game (Student joins room)
game_update (Server pushes new state to all clients)
submit_answer (Client sends answer)
game_over (Server declares winner)
4. Migration Path
Replace localStorage.getItem with axios.get.
Replace localStorage.setItem with socket.emit.
Move mockData.js logic to Database.
#Required API Endpoints (Summary)
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

Environment Variables
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000

Styling & Theming
Theme: Dark theme (Slate 950 base) with Neon accents.
Effects: Glassmorphism (glass class), Glow effects, SVG animations.
Custom CSS: Checkered patterns for race tracks, specific boss gradients (defined in index.css).
Responsive: Mobile-first design approach.
Key Components
MainLayout - Main app layout with navigation sidebar.
AuthPage - Login/Register interface.
TeacherGamesHub - Card-based hub for selecting game modes.
BattleArena - Split-screen controller for 1v1.
TeamRaceMonitor - Race track visualization.
BossBattleMonitor - Boss SVG rendering and HP bars.
QuizCard - Quiz display component.
TournamentBracket - Tournament visualization.
State Management
Currently using React state and Context API.
localStorage is used to persist game state across tabs (Simulation).
Consider Redux/Zustand for larger scale.

Performance Considerations
Lazy loading for large quiz lists.
Virtual scrolling for tournament brackets.
Optimized re-renders with React.memo.
Code splitting by routes.

Security Notes
Input validation for quiz creation.
XSS protection for user-generated content.
CSRF protection for API calls.
Rate limiting for quiz submissions.

Future Roadmap
 Backend Integration (Node.js/Laravel)
 Real Database persistence (MongoDB/PostgreSQL)
 Leaderboard History
 Mobile App version
 Accessibility improvements
 
Browser Support
Chrome 90+
Firefox 88+
Safari 14+
Edge 90+

Contributing
Follow the existing code style.
Add components to appropriate directories.
Update mock data when adding new features.
Test on multiple screen sizes.
Document new components and features.