import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp, Download, Search, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { openWhatsappResult } from '../utils/whatsapp';

function TeacherResultsPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [quizTitle, setQuizTitle] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [resultsError, setResultsError] = useState('');

  const loadSessions = async () => {
    setLoadingSessions(true);
    setSessionError('');
    try {
      const response = await api.get('/sessions');
      const loadedSessions = Array.isArray(response.data?.sessions) ? response.data.sessions : [];
      setSessions(loadedSessions);
      if (loadedSessions.length === 0) {
        setSelectedSession('');
      } else if (!loadedSessions.some((s) => String(s.id) === String(selectedSession))) {
        setSelectedSession(String(loadedSessions[0].id));
      }
    } catch {
      setSessions([]);
      setSelectedSession('');
      setSessionError('Could not load sessions right now. Please try again.');
      toast.error('Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadResults = async () => {
      if (!selectedSession) {
        setResults([]);
        setTotalQuestions(0);
        setQuizTitle('');
        setResultsError('');
        return;
      }

      setLoadingResults(true);
      setResultsError('');
      try {
        const response = await api.get(`/sessions/${selectedSession}/results`);
        const rows = (response.data.results || []).sort((a, b) => b.score - a.score);
        setResults(rows);
        setTotalQuestions(Number(response.data.totalQuestions) || 0);
        setQuizTitle(response.data.quizTitle || '');
      } catch {
        setResults([]);
        setTotalQuestions(0);
        setQuizTitle('');
        setResultsError('Could not load results for the selected session.');
        toast.error('Failed to load results');
      } finally {
        setLoadingResults(false);
      }
    };

    loadResults();
  }, [selectedSession]);

  const filteredStudents = useMemo(
    () =>
      results
        .filter((student) =>
          String(student.studentName || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((student, index) => ({ ...student, rank: index + 1 })),
    [results, searchTerm]
  );

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy size={24} className="text-yellow-400" />;
    if (rank === 2) return <Medal size={24} className="text-gray-300" />;
    if (rank === 3) return <Award size={24} className="text-orange-600" />;
    return <span className="text-gray-400 font-bold">#{rank}</span>;
  };

  const sendToParent = (student) => {
    if (!student.parentWhatsapp) {
      toast.error(`لا يوجد رقم واتساب مسجّل لولي أمر ${student.studentName}`);
      return;
    }
    const ok = openWhatsappResult({
      phone: student.parentWhatsapp,
      studentName: student.studentName,
      quizTitle: quizTitle || 'الاختبار',
      score: student.score,
      total: totalQuestions,
    });
    if (ok) toast.success(`تم فتح واتساب لإرسال نتيجة ${student.studentName}`);
  };

  const exportResults = () => {
    if (!filteredStudents.length) {
      toast.error('No results to export');
      return;
    }

    const header = 'Rank,Student,Score,Submitted At';
    const csvRows = filteredStudents.map(
      (student) =>
        `${student.rank},${student.studentName},${student.score},${student.submittedAt}`
    );
    const csv = [header, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'quiz-results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Quiz Results</h1>
          <p className="text-gray-400">Track student performance and rankings</p>
        </div>
        <button onClick={exportResults} className="px-4 py-2 glass glass-hover rounded-lg text-white flex items-center gap-2">
          <Download size={20} />
          Export Results
        </button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Participants', value: filteredStudents.length, icon: Trophy },
          {
            label: 'Average Score',
            value: filteredStudents.length
              ? Math.round(filteredStudents.reduce((acc, s) => acc + s.score, 0) / filteredStudents.length)
              : 0,
            icon: TrendingUp,
          },
          {
            label: 'Highest Score',
            value: filteredStudents.length ? Math.max(...filteredStudents.map((s) => s.score)) : 0,
            icon: Award,
          },
          { label: 'Submissions', value: filteredStudents.length, icon: Trophy },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="glass rounded-2xl p-6 card-hover">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                <Icon size={24} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            disabled={loadingSessions || sessions.length === 0}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors"
          >
            <option value="">
              {loadingSessions ? 'Loading sessions...' : 'Select Session'}
            </option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                Session #{session.id} ({session.joinCode})
              </option>
            ))}
          </select>
        </div>
        {(sessionError || resultsError) && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {sessionError || resultsError}
          </div>
        )}
        {loadingResults && (
          <div className="mt-4 text-sm text-gray-300">Loading session results...</div>
        )}
        {!loadingSessions && sessions.length === 0 && (
          <div className="mt-4 text-sm text-gray-400">No sessions found yet.</div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass rounded-2xl overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">All Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Rank</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Student Name</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Score</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Submitted At</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Notify Parent</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <motion.tr
                    key={`${student.studentId}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-4">{getRankIcon(student.rank)}</td>
                    <td className="py-4 px-4"><div className="text-white font-medium">{student.studentName}</div></td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-emerald-400">
                        {student.score}{totalQuestions ? ` / ${totalQuestions}` : ''}
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="text-gray-300">{student.submittedAt || '-'}</div></td>
                    <td className="py-4 px-4">
                      {student.parentWhatsapp ? (
                        <button
                          type="button"
                          onClick={() => sendToParent(student)}
                          title={`إرسال النتيجة إلى ولي أمر ${student.studentName} عبر واتساب`}
                          className="px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm font-semibold flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all"
                        >
                          <MessageCircle size={16} />
                          WhatsApp
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">No number</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filteredStudents.length && !loadingResults && (
            <p className="text-gray-400 mt-4">
              {selectedSession ? 'No submissions yet for this session.' : 'Select a session to view results.'}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default TeacherResultsPage;
