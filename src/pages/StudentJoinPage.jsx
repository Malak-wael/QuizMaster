import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom'; 
import { User, ArrowRight, Users, Zap, Gamepad2, HelpCircle, LogOut, Trophy, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { getCurrentUser } from '../utils/auth';
import { clearAuthSession } from '../utils/auth';

function StudentJoinPage() {
  const [studentName, setStudentName] = useState('');
  const [quizCode, setQuizCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [quickAccessCodes, setQuickAccessCodes] = useState([]);
  const [featuredSessions, setFeaturedSessions] = useState([]);
  const navigate = useNavigate(); // استبدلنا window.location بـ navigate

  const handleLogout = () => {
    clearAuthSession();
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  useEffect(() => {
    const loadSessionShowcase = async () => {
      try {
        const response = await api.get('/sessions/public');
        const activeSessions = response.data.sessions || [];
        setQuickAccessCodes(activeSessions.map((session) => session.joinCode).slice(0, 5));
        setFeaturedSessions(activeSessions.slice(0, 6));
      } catch (_error) {
        setQuickAccessCodes([]);
        setFeaturedSessions([]);
      }
    };

    loadSessionShowcase();
  }, []);

  // --- اللوجيك الجديد والمرتب ---
  const handleJoinQuiz = async () => {
    if (!quizCode.trim()) {
      toast.error('Please enter a code');
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast.error('Please login first');
      navigate('/auth');
      return;
    }

    if (currentUser.role !== 'student') {
      toast.error('Please login as student');
      return;
    }

    setIsJoining(true);

    try {
      const response = await api.post('/sessions/join', { code: quizCode });
      const session = response.data.session;
      localStorage.setItem('currentSession', JSON.stringify(session));
      localStorage.setItem('participantName', studentName || currentUser.name);
      toast.success('Joined quiz successfully');
      navigate('/student/quiz');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join session');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="max-w-6xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-end mb-4">
            <button
              onClick={handleLogout}
              className="px-4 py-2 glass glass-hover rounded-lg text-white flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(16, 185, 129, 0.5)",
                "0 0 40px rgba(16, 185, 129, 0.8)",
                "0 0 20px rgba(16, 185, 129, 0.5)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-6"
          >
            <span className="px-4 py-2 glass rounded-full text-emerald-400 font-semibold flex items-center gap-2">
              <Gamepad2 size={18}/> Student Portal
            </span>
          </motion.div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            Join the Arena
          </h1>
          <p className="text-xl text-gray-300">
            Enter your code to start a Quiz or join a Live Game
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Join Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-8 border border-white/10"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <User size={24} className="text-emerald-400"/> Student Details
            </h2>
            
            <div className="space-y-6">
              {/* Name Input */}
              <div>
                <label className="block text-gray-300 font-medium mb-2">Your Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter your nickname"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Unified Code Input */}
              <div>
                <label className="block text-gray-300 font-medium mb-2">Game PIN or Quiz Code</label>
                <input
                  type="text"
                  value={quizCode}
                  onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                  placeholder="e.g., 1234 (Game) or MATH101 (Quiz)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-center text-xl tracking-widest"
                  maxLength={10}
                />
                {/* توضيح الفرق للطالب */}
                <div className="mt-3 flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-sm text-blue-200">
                  <HelpCircle size={16} className="mt-0.5 flex-shrink-0"/>
                  <div>
                    <span className="font-bold text-white">How it works:</span><br/>
                    Use a <span className="text-yellow-400 font-mono">PIN (Numbers)</span> for Live Games (Race/Boss) or a <span className="text-emerald-400 font-mono">Code (Text)</span> for Quizzes.
                  </div>
                </div>
              </div>

              {/* Join Button */}
              <button
                onClick={handleJoinQuiz}
                disabled={isJoining}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xl font-bold rounded-xl hover:from-emerald-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
              >
                {isJoining ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    Let's Go!
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>

            {/* Quick Access */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap size={18} className="text-yellow-400"/> Quick Access (Try these)
              </h3>
              <div className="space-y-2">
                {quickAccessCodes.length > 0 ? (
                  quickAccessCodes.map((code) => (
                    <button
                      key={code}
                      onClick={() => setQuizCode(code)}
                      className="w-full p-3 glass glass-hover rounded-lg text-left text-white hover:bg-white/10 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">LIVE</span>
                          <span>Active Session</span>
                        </div>
                        <span className="text-emerald-400 font-mono group-hover:scale-110 transition-transform">{code}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 rounded-lg bg-white/5 text-sm text-gray-400">
                    No active session codes yet. Ask your teacher to create a quiz session.
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Featured Quizzes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-white">Featured Quizzes</h2>
            
            {featuredSessions.length > 0 ? featuredSessions.map((session, index) => {
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="glass rounded-2xl p-6 card-hover cursor-pointer border border-white/5 hover:border-white/20"
                  onClick={() => setQuizCode(session.joinCode)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-500/20">
                      <Zap size={24} className="text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">{session.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${session.status === 'live' ? 'bg-purple-500 text-white animate-pulse' : 'bg-blue-500/20 text-blue-300'}`}>
                          {session.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {session.participants} joined
                        </span>
                      </div>
                      <div className="mt-3">
                        <span className="font-mono font-semibold text-emerald-400">{session.joinCode}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            }) : (
              <div className="p-4 glass rounded-xl text-gray-400">
                No featured quizzes yet. Once teachers create sessions, they will appear here.
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Link to="/student/results" className="glass rounded-xl p-4 hover:bg-white/10 transition-colors flex items-center gap-3">
            <BarChart3 className="text-emerald-400" size={20} />
            <div>
              <p className="text-white font-semibold">Results</p>
              <p className="text-xs text-gray-400">See your latest score</p>
            </div>
          </Link>
          <Link to="/student/tournament" className="glass rounded-xl p-4 hover:bg-white/10 transition-colors flex items-center gap-3">
            <Trophy className="text-yellow-400" size={20} />
            <div>
              <p className="text-white font-semibold">Tournament</p>
              <p className="text-xs text-gray-400">Friends ranking & top student</p>
            </div>
          </Link>
          <Link to="/student/live-games" className="glass rounded-xl p-4 hover:bg-white/10 transition-colors flex items-center gap-3">
            <Gamepad2 className="text-purple-400" size={20} />
            <div>
              <p className="text-white font-semibold">Live Games</p>
              <p className="text-xs text-gray-400">Join Race and Boss Battle</p>
            </div>
          </Link>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <Link
            to="/auth"
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 justify-center"
          >
            <ArrowRight size={20} className="rotate-180" />
            Back to Home / Login
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default StudentJoinPage;