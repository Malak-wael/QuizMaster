import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Trophy, RotateCcw } from 'lucide-react';
import { api } from '../api/client';

const TEAM_STYLES = {
  red:    { text: 'text-red-400',    emoji: '🏎️' },
  blue:   { text: 'text-blue-400',   emoji: '🚙' },
  green:  { text: 'text-green-400',  emoji: '🚕' },
  yellow: { text: 'text-yellow-400', emoji: '🚌' },
  purple: { text: 'text-purple-400', emoji: '🚎' },
  pink:   { text: 'text-pink-400',   emoji: '🚐' },
  orange: { text: 'text-orange-400', emoji: '🚑' },
};

const TeamRaceMonitor = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState(null);
  const [teams, setTeams] = useState([]);
  const [question, setQuestion] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [winner, setWinner] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const fetchState = useCallback(async (gamePin) => {
    try {
      const res = await api.get(`/games/race/state/${gamePin}`);
      const { teams: t, question: q, currentQuestionIndex, totalQuestions: total, winner: w, status } = res.data;
      setTeams(t);
      setQuestion(q);
      setQuestionIndex(currentQuestionIndex);
      setTotalQuestions(total);
      if (w || status === 'finished') setWinner(w || [...t].sort((a, b) => b.score - a.score)[0]);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    const savedPin = localStorage.getItem('racePin');
    const savedTeams = localStorage.getItem('raceTeams');
    if (!savedPin) { navigate('/teacher/games/team-setup'); return; }
    setPin(savedPin);
    if (savedTeams) setTeams(JSON.parse(savedTeams));
    fetchState(savedPin);
  }, [navigate, fetchState]);

  useEffect(() => {
    if (!pin) return;
    const interval = setInterval(() => fetchState(pin), 2000);
    return () => clearInterval(interval);
  }, [pin, fetchState]);

  const nextQuestion = async () => {
    if (!pin) return;
    setShowAnswer(false);
    try { await api.post('/games/race/next', { pin }); fetchState(pin); } catch (err) { console.error(err); }
  };

  const handleExit = () => {
    localStorage.removeItem('racePin');
    localStorage.removeItem('raceTeams');
    navigate('/teacher');
  };

  if (winner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 text-white flex flex-col items-center justify-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 100 }}
          className="text-center glass p-12 rounded-3xl border-2 border-yellow-500 shadow-2xl shadow-yellow-500/30 max-w-2xl w-full mx-4">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}>
            <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
          </motion.div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4 uppercase">Winner!</h1>
          <div className={`text-3xl font-bold mb-8 ${TEAM_STYLES[winner.color]?.text || 'text-white'}`}>{winner.name}</div>
          <div className="mb-8 bg-black/40 p-4 rounded-xl border border-white/10">
            <h3 className="text-sm text-gray-400 mb-3 text-center uppercase tracking-widest">Final Standings</h3>
            {[...teams].sort((a, b) => b.score - a.score).map((t, i) => (
              <div key={i} className={`flex justify-between items-center p-3 rounded-lg mb-1 ${t.name === winner.name ? 'bg-yellow-500/10 border border-yellow-500/30' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 w-6">{i + 1}.</span>
                  <span className={`font-semibold ${TEAM_STYLES[t.color]?.text || 'text-white'}`}>{t.name}</span>
                </div>
                <span className="font-mono font-bold">{t.score} Pts</span>
              </div>
            ))}
          </div>
          <button onClick={handleExit} className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold flex items-center gap-2 mx-auto transition">
            <Home /> Exit
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b border-slate-800 bg-slate-900/80 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <h1 className="text-xl font-bold uppercase tracking-wider">Live Race Monitor</h1>
          {pin && <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-mono">PIN: {pin}</span>}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-gray-400 text-sm">Q {questionIndex + 1}/{totalQuestions || '?'}</span>
          <button onClick={nextQuestion} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-semibold transition">Next Q</button>
          <button onClick={() => setShowAnswer(v => !v)} className="px-4 py-2 bg-yellow-500 text-black hover:bg-yellow-400 rounded text-sm font-semibold transition">
            {showAnswer ? 'Hide' : 'Reveal'}
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 flex flex-col justify-center gap-5">
        {teams.map((team, index) => {
          const style = TEAM_STYLES[team.color] || TEAM_STYLES.blue;
          const progress = Math.min(team.score * 10, 90);
          return (
            <div key={team.id || index} className="flex items-center gap-4">
              <div className={`w-28 text-left font-bold truncate text-sm md:text-base ${style.text}`}>{team.name}</div>
              <div className="flex-1 relative">
                <div className="h-16 bg-slate-800 rounded-lg relative overflow-hidden border-2 border-slate-700">
                  <div className="absolute right-0 top-0 bottom-0 w-10 bg-yellow-400/20 border-l-4 border-yellow-400" />
                  <motion.div className="absolute top-1/2 -translate-y-1/2 z-20 text-4xl" animate={{ left: `${progress}%` }} transition={{ type: 'spring', stiffness: 60, damping: 15 }}>
                    <motion.span animate={{ rotate: [-1, 1, -1] }} transition={{ duration: 0.3, repeat: Infinity }}>{style.emoji}</motion.span>
                  </motion.div>
                </div>
              </div>
              <div className={`w-14 text-xl font-black text-center ${style.text} bg-black/20 py-2 rounded-lg border border-white/10`}>{team.score}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900 p-6 border-t border-slate-800 text-center z-20">
        {question ? (
          <>
            <motion.h3 key={questionIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-xl md:text-2xl font-bold mb-4">
              {question.question || question.text}
            </motion.h3>
            {showAnswer && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center gap-3 flex-wrap">
                {question.options.map((opt, i) => {
                  const correctIdx = question.correctOptionIndex ?? question.correctAnswer;
                  return (
                    <span key={i} className={`px-5 py-2 rounded-lg text-sm font-semibold ${i === correctIdx ? 'bg-green-600 text-white ring-2 ring-green-400 scale-110' : 'bg-slate-700 text-gray-400 line-through opacity-50'}`}>{opt}</span>
                  );
                })}
              </motion.div>
            )}
          </>
        ) : <p className="text-gray-500">Waiting for questions...</p>}
      </div>
    </div>
  );
};
export default TeamRaceMonitor;
