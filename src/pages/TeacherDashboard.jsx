import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { getCurrentUser } from '../utils/auth';
import { FileText, Users, TrendingUp, Clock, Plus, Play, Eye, Calendar, Award, Activity, Gamepad2, Trash2 } from 'lucide-react';

const STAT_ICONS = [FileText, Users, Clock, TrendingUp];

function TeacherDashboard() {
  const [stats, setStats] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState('');
  const user = getCurrentUser();

  const handleDeleteQuiz = async (quizId, quizTitle) => {
    const confirmed = window.confirm(`Delete quiz "${quizTitle}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.delete(`/quizzes/${quizId}`);
      setQuizzes((prev) => prev.filter((quiz) => quiz.id !== quizId));
      toast.success('Quiz deleted successfully.');
    } catch {
      toast.error('Failed to delete quiz. Please try again.');
    }
  };

  const fetchDashboard = async () => {
    setActivityLoading(true);
    setActivityError('');
    try {
      const [statsRes, quizzesRes] = await Promise.all([
        api.get('/stats/teacher'),
        api.get('/quizzes?limit=5'),
      ]);

      setStats([
        { label: 'Total Quizzes', value: statsRes.data.totalQuizzes ?? 0 },
        { label: 'Total Students', value: statsRes.data.totalStudents ?? 0 },
        { label: 'Active Sessions', value: statsRes.data.activeQuizzes ?? 0 },
        { label: 'Average Score', value: statsRes.data.averageScore ?? 0 },
      ]);

      setQuizzes(quizzesRes.data.quizzes || []);
      setActivity(statsRes.data.recentActivity || []);
    } catch (err) {
      console.error('Dashboard error:', err);
      setStats([
        { label: 'Total Quizzes', value: 0 },
        { label: 'Total Students', value: 0 },
        { label: 'Active Sessions', value: 0 },
        { label: 'Average Score', value: 0 },
      ]);
      setActivity([]);
      setActivityError('Unable to load recent activity right now.');
    } finally {
      setActivityLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="text-white flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const quickActions = [
    { title: 'Create New Quiz', description: 'Design a custom quiz from scratch', icon: Plus, path: '/teacher/create-quiz', gradient: 'from-orange-500 to-red-500' },
    { title: 'Upload PDF', description: 'Generate questions from documents', icon: FileText, path: '/teacher/upload-pdf', gradient: 'from-purple-500 to-indigo-500' },
    { title: 'View Results', description: 'Check student performance', icon: Eye, path: '/teacher/results', gradient: 'from-emerald-500 to-teal-500' },
    { title: 'Tournament', description: 'Host a competitive bracket', icon: Award, path: '/teacher/tournament', gradient: 'from-blue-500 to-cyan-500' },
    { title: 'Live Games', description: 'Start Battle, Race or Boss fight', icon: Gamepad2, path: '/teacher/games', gradient: 'from-pink-500 to-rose-500' },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-1">Welcome back, {user?.name || 'Teacher'} 👋</h1>
          <p className="text-gray-400">Here's what's happening in your classroom.</p>
        </div>
        <div className="px-4 py-2 glass rounded-lg text-white flex items-center gap-2 text-sm">
          <Calendar size={18} />
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = STAT_ICONS[index] || Activity;
          return (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Icon className="text-orange-400" size={22} />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} to={action.path} className="glass rounded-2xl p-5 hover:bg-white/10 transition-colors group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3`}>
                  <Icon className="text-white" size={22} />
                </div>
                <h3 className="text-white font-bold group-hover:text-orange-400 transition-colors text-sm">{action.title}</h3>
                <p className="text-gray-400 text-xs mt-1">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Quizzes */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recent Quizzes</h2>
          <Link to="/teacher/create-quiz" className="text-sm text-orange-400 hover:underline">+ New Quiz</Link>
        </div>
        {quizzes.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">No quizzes yet. <Link to="/teacher/create-quiz" className="text-orange-400 hover:underline">Create your first quiz!</Link></p>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div>
                  <h3 className="text-white font-medium">{quiz.title}</h3>
                  <p className="text-gray-400 text-sm">{quiz.questionsCount ?? quiz.questions_count ?? 0} questions</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                    className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                    aria-label={`Delete ${quiz.title}`}
                    title="Delete quiz"
                  >
                    <Trash2 size={18} />
                  </button>
                  <Link to="/teacher/games" className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                    <Play size={18} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity size={20} className="text-purple-400" /> Recent Activity
          </h2>
          <button
            onClick={fetchDashboard}
            className="text-xs px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
        {activityLoading ? (
          <p className="text-gray-400 text-sm">Loading activity...</p>
        ) : activityError ? (
          <div className="text-sm rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 p-3">
            {activityError}
          </div>
        ) : activity.length === 0 ? (
          <div className="text-sm rounded-lg border border-white/10 bg-white/5 text-gray-300 p-3">
            No activity yet. Publish a quiz and let students submit to see updates here.
          </div>
        ) : (
          <div className="space-y-3">
            {activity.map((a, i) => (
              <div key={a.id || i} className="flex items-start gap-3 text-gray-300">
                <span className="mt-1 w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                <span>
                  {a.message}
                  {a.timestamp ? ` · ${new Date(a.timestamp).toLocaleString()}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherDashboard;
