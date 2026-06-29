import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateQuizPage from './pages/CreateQuizPage';
import UploadPDFPage from './pages/UploadPDFPage';
import FileViewerPage from './pages/FileViewerPage';
import TeacherResultsPage from './pages/TeacherResultsPage';
import TournamentPage from './pages/TournamentPage';
import StudentJoinPage from './pages/StudentJoinPage';
import StudentQuizPage from './pages/StudentQuizPage';
import StudentResultsPage from './pages/StudentResultsPage';
import StudentLiveGamesPage from './pages/StudentLiveGamesPage';
import StudentTournamentPage from './pages/StudentTournamentPage';

// Games Pages (الملفات الجديدة اللي هتعمليها)
import TeacherGamesHub from './pages/TeacherGamesHub'; // صفحة اختيار اللعبة
import BattlePicker from './pages/BattlePicker';       // صفحة اختيار الطلاب
import BattleArena from './pages/BattleArena';         // شاشة اللعب
import BossSetup from './pages/BossSetup';
import BossBattleMonitor from './pages/BossBattleMonitor';
import BossBattlePlayer from './pages/BossBattlePlayer';



import TeamRaceSetup from './pages/TeamRaceSetup';
import TeamRaceMonitor from './pages/TeamRaceMonitor';
import StudentRacePlayer from './pages/StudentRacePlayer';

// Layouts
import MainLayout from './layouts/MainLayout';
import { GuestOnlyRoute, ProtectedRoute } from './components/RouteGuards';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-bg text-white">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<GuestOnlyRoute><AuthPage /></GuestOnlyRoute>} /> 
          <Route path="/auth" element={<GuestOnlyRoute><AuthPage /></GuestOnlyRoute>} /> 
          <Route path="/home" element={<LandingPage />} />

          {/* Teacher Routes (مع اللوك اووت) */}
          <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><MainLayout><TeacherDashboard /></MainLayout></ProtectedRoute>} />
          <Route path="/teacher/create-quiz" element={<ProtectedRoute allowedRoles={['teacher']}><MainLayout><CreateQuizPage /></MainLayout></ProtectedRoute>} />
          <Route path="/teacher/upload-pdf" element={<ProtectedRoute allowedRoles={['teacher']}><MainLayout><UploadPDFPage /></MainLayout></ProtectedRoute>} />
          <Route path="/file/:id/view" element={<ProtectedRoute allowedRoles={['teacher']}><MainLayout><FileViewerPage /></MainLayout></ProtectedRoute>} />
          <Route path="/teacher/results" element={<ProtectedRoute allowedRoles={['teacher']}><MainLayout><TeacherResultsPage /></MainLayout></ProtectedRoute>} />
          <Route path="/teacher/tournament" element={<ProtectedRoute allowedRoles={['teacher']}><MainLayout><TournamentPage /></MainLayout></ProtectedRoute>} />

          {/* Teacher Games Routes (جزء الألعاب الجديد) */}
          <Route path="/teacher/games" element={<ProtectedRoute allowedRoles={['teacher']}><MainLayout><TeacherGamesHub /></MainLayout></ProtectedRoute>} />
          <Route path="/teacher/games/battle-setup" element={<ProtectedRoute allowedRoles={['teacher']}><MainLayout><BattlePicker /></MainLayout></ProtectedRoute>} />          {/* شاشة اللعب خليتها بدون MainLayout عشان تظهر بملء الشاشة للطلاب */}
          <Route path="/teacher/games/battle-arena" element={<ProtectedRoute allowedRoles={['teacher']}><BattleArena /></ProtectedRoute>} />
          <Route path="/teacher/games/team-setup" element={<ProtectedRoute allowedRoles={['teacher']}><MainLayout><TeamRaceSetup /></MainLayout></ProtectedRoute>} />
          <Route path="/teacher/games/team-monitor" element={<ProtectedRoute allowedRoles={['teacher']}><TeamRaceMonitor /></ProtectedRoute>} />
          <Route path="/student/race-player" element={<ProtectedRoute allowedRoles={['student']}><StudentRacePlayer /></ProtectedRoute>} />
          <Route path="/teacher/games/boss-setup" element={<ProtectedRoute allowedRoles={['teacher']}><MainLayout><BossSetup /></MainLayout></ProtectedRoute>} />
          <Route path="/teacher/games/boss-arena" element={<ProtectedRoute allowedRoles={['teacher']}><BossBattleMonitor /></ProtectedRoute>} />
          <Route path="/student/boss-player" element={<ProtectedRoute allowedRoles={['student']}><BossBattlePlayer /></ProtectedRoute>} />

          {/* Student Routes */}
          <Route path="/student/join" element={<ProtectedRoute allowedRoles={['student']}><StudentJoinPage /></ProtectedRoute>} />
          <Route path="/student/quiz" element={<ProtectedRoute allowedRoles={['student']}><StudentQuizPage /></ProtectedRoute>} />
          <Route path="/student/results" element={<ProtectedRoute allowedRoles={['student']}><StudentResultsPage /></ProtectedRoute>} />
          <Route path="/student/live-games" element={<ProtectedRoute allowedRoles={['student']}><StudentLiveGamesPage /></ProtectedRoute>} />
          <Route path="/student/tournament" element={<ProtectedRoute allowedRoles={['student']}><StudentTournamentPage /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;