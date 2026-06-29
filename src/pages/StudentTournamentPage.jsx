import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';
import { api } from '../api/client';
import toast from 'react-hot-toast';

function StudentTournamentPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      const rawSession = localStorage.getItem('currentSession');
      if (!rawSession) {
        setLoading(false);
        return;
      }

      try {
        const session = JSON.parse(rawSession);
        const res = await api.get(`/sessions/${session.id}/leaderboard`);
        setLeaderboard(res.data.leaderboard || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  const rankBadge = (rank) => {
    if (rank === 1) return <Trophy className="text-yellow-400" size={20} />;
    if (rank === 2) return <Medal className="text-gray-300" size={20} />;
    if (rank === 3) return <Award className="text-orange-500" size={20} />;
    return <span className="text-gray-400 font-bold">#{rank}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-white mb-2">Tournament Leaderboard</h1>
        <p className="text-gray-400">See friends scores and who is currently first.</p>
      </motion.div>

      <div className="glass rounded-2xl p-6">
        {loading ? (
          <p className="text-gray-300">Loading leaderboard...</p>
        ) : leaderboard.length === 0 ? (
          <p className="text-gray-400">No scores yet. Join and submit a quiz/game session first.</p>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((student) => (
              <div key={`${student.studentId}-${student.rank}`} className="p-4 bg-white/5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {rankBadge(student.rank)}
                  <div>
                    <p className="text-white font-semibold">{student.studentName}</p>
                    <p className="text-xs text-gray-400">Rank #{student.rank}</p>
                  </div>
                </div>
                <p className="text-emerald-400 font-bold text-lg">{student.score}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentTournamentPage;
