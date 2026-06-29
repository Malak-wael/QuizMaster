import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trophy, Target, RotateCcw, Home } from 'lucide-react';
import { api } from '../api/client';

function StudentResultsPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const result = useMemo(() => {
    const raw = localStorage.getItem('lastResult');
    if (!raw) return { score: 0, correctAnswers: 0, totalQuestions: 0 };

    try {
      return JSON.parse(raw);
    } catch (_error) {
      return { score: 0, correctAnswers: 0, totalQuestions: 0 };
    }
  }, []);

  useEffect(() => {
    const loadLeaderboard = async () => {
      const rawSession = localStorage.getItem('currentSession');
      if (!rawSession) return;
      try {
        const session = JSON.parse(rawSession);
        const res = await api.get(`/sessions/${session.id}/leaderboard`);
        setLeaderboard(res.data.leaderboard || []);
      } catch (_error) {
        setLeaderboard([]);
      }
    };
    loadLeaderboard();
  }, []);

  const getScoreMessage = () => {
    if (result.score >= 90) return "Outstanding! You're a quiz master!";
    if (result.score >= 80) return 'Excellent work! Keep it up!';
    if (result.score >= 70) return 'Good job! Room for improvement.';
    return "Keep practicing! You'll do better next time.";
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-8 max-w-xl w-full text-center space-y-6"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto">
          <Trophy size={40} className="text-white" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h1>
          <p className="text-gray-300">{getScoreMessage()}</p>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="text-5xl font-bold text-emerald-400 mb-2">{result.score}%</div>
          <div className="text-gray-300 flex items-center justify-center gap-2">
            <Target size={18} />
            {result.correctAnswers}/{result.totalQuestions} correct answers
          </div>
        </div>

        {leaderboard.length > 0 && (
          <div className="glass rounded-xl p-6 text-left">
            <h3 className="text-lg font-bold text-white mb-3">Class Ranking</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {leaderboard.slice(0, 5).map((item) => (
                <div key={`${item.studentId}-${item.rank}`} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                  <span className="text-gray-200">#{item.rank} {item.studentName}</span>
                  <span className="text-emerald-400 font-semibold">{item.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            to="/student/join"
            className="flex-1 px-4 py-3 glass glass-hover rounded-lg text-white flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            Join Another
          </Link>
          <Link
            to="/"
            className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default StudentResultsPage;
