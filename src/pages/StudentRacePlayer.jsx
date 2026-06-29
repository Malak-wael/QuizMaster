import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Trophy, Home } from 'lucide-react';
import { api } from '../api/client';
import toast from 'react-hot-toast';

const StudentRacePlayer = () => {
  const navigate = useNavigate();
  const [joinData, setJoinData] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [isBoost, setIsBoost] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [pin, setPin] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [joining, setJoining] = useState(false);

  const fetchState = useCallback(async (gamePin) => {
    try {
      const res = await api.get(`/games/race/state/${gamePin}`);
      setGameState(res.data);
      if (res.data.status === 'finished') setGameOver(true);
    } catch (_err) { /* ignore */ }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('raceJoinData');
    if (saved) {
      const parsed = JSON.parse(saved);
      setJoinData(parsed);
      fetchState(parsed.pin);
    }
  }, [fetchState]);

  useEffect(() => {
    if (!joinData?.pin) return;
    const interval = setInterval(() => fetchState(joinData.pin), 2000);
    return () => clearInterval(interval);
  }, [joinData, fetchState]);

  const handleJoin = async () => {
    const pinNorm = pin.replace(/\D/g, '').slice(0, 4);
    const teamNorm = teamCode.trim();
    if (pinNorm.length !== 4 || !teamNorm) { toast.error('Enter a 4-digit PIN and team code'); return; }
    setJoining(true);
    try {
      const res = await api.post('/games/race/join', { pin: pinNorm, teamCode: teamNorm });
      const data = { pin: pinNorm, team: res.data.team, questions: res.data.questions };
      setJoinData(data);
      localStorage.setItem('raceJoinData', JSON.stringify(data));
      toast.success(`Joined ${res.data.team.name}!`);
      fetchState(pinNorm);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join');
    } finally {
      setJoining(false);
    }
  };

  const handleAnswer = async (optionIndex) => {
    if (selected !== null || gameOver || !joinData) return;
    setSelected(optionIndex);
    const question = joinData.questions[currentQ];
    if (!question) return;
    const correctIdx = question.correctOptionIndex ?? question.correctAnswer;
    if (optionIndex === correctIdx) { setIsBoost(true); setTimeout(() => setIsBoost(false), 1000); }
    try {
      const res = await api.post('/games/race/answer', { pin: joinData.pin, teamCode: joinData.team.code, questionIndex: currentQ, selectedOptionIndex: optionIndex });
      setGameState(prev => ({ ...prev, teams: res.data.teams, status: res.data.gameStatus }));
      if (res.data.gameStatus === 'finished') setGameOver(true);
    } catch (err) { console.error(err); }
    setTimeout(() => {
      setSelected(null);
      setCurrentQ(prev => prev + 1 < (joinData?.questions?.length || 1) ? prev + 1 : 0);
    }, 1500);
  };

  const myTeamState = gameState?.teams?.find(t => t.id === joinData?.team?.id || t.code === joinData?.team?.code);

  // Join form
  if (!joinData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-8 max-w-sm w-full space-y-4">
          <h1 className="text-2xl font-bold text-center">Join Race 🏎️</h1>
          <input value={pin} onChange={e => setPin(e.target.value)} placeholder="Game PIN (4 digits)" className="w-full px-4 py-3 bg-slate-800 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500" maxLength={4} />
          <input value={teamCode} onChange={e => setTeamCode(e.target.value)} placeholder="Your Team Code" className="w-full px-4 py-3 bg-slate-800 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500" maxLength={6} />
          <button onClick={handleJoin} disabled={joining} className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg disabled:opacity-50">
            {joining ? 'Joining...' : 'Join Race 🏎️'}
          </button>
        </div>
      </div>
    );
  }

  // Game over
  if (gameOver && gameState) {
    const winner = gameState.winner || [...(gameState.teams || [])].sort((a, b) => b.score - a.score)[0];
    const isWinner = winner?.id === joinData.team.id;
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="glass p-8 rounded-3xl text-center max-w-md w-full border border-white/20">
          <Trophy className={`w-20 h-20 mx-auto mb-4 ${isWinner ? 'text-yellow-400' : 'text-gray-500'}`} />
          <h1 className={`text-3xl font-bold mb-6 ${isWinner ? 'text-yellow-400' : 'text-white'}`}>{isWinner ? '🏆 You Won!' : `Game Over — ${winner?.name} wins!`}</h1>
          <div className="bg-black/20 p-4 rounded-xl mb-6 text-left">
            {[...(gameState.teams || [])].sort((a, b) => b.score - a.score).map((t, i) => (
              <div key={i} className={`flex justify-between p-2 rounded mb-1 ${t.id === joinData.team.id ? 'bg-white/10 border border-white/20' : ''}`}>
                <span>{i + 1}. {t.name}</span><span className="font-bold">{t.score} pts</span>
              </div>
            ))}
          </div>
          <button onClick={() => { localStorage.removeItem('raceJoinData'); navigate('/student/join'); }} className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold flex items-center justify-center gap-2">
            <Home size={18} /> Exit
          </button>
        </motion.div>
      </div>
    );
  }

  const question = joinData.questions[currentQ];
  const myScore = myTeamState?.score ?? 0;

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white flex flex-col ${isBoost ? 'bg-green-900/10' : ''}`}>
      <div className="p-3 bg-black/40 border-b border-white/10">
        <div className="relative h-14 bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-yellow-400/20 border-l-2 border-yellow-400" />
          {(gameState?.teams || [joinData.team]).map((t, i) => {
            const isMe = t.id === joinData.team.id || t.code === joinData.team.code;
            const progress = Math.min((t.score || 0) * 10, 90);
            return (
              <motion.div key={i} className="absolute top-1/2 -translate-y-1/2" animate={{ left: `${progress}%` }} transition={{ type: 'spring', stiffness: 100 }}>
                <span className={`text-2xl ${isMe ? '' : 'opacity-50'}`}>{isMe ? '🏎️' : '🚗'}</span>
              </motion.div>
            );
          })}
          <div className="absolute top-1/2 right-8 -translate-y-1/2 text-xs text-white/60">{joinData.team.name}: {myScore} pts</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center p-6 text-center">
        {question ? (
          <>
            <motion.h2 key={currentQ} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-2xl md:text-3xl font-bold mb-8">
              {question.question || question.text}
            </motion.h2>
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto w-full">
              {question.options.map((opt, idx) => {
                const correctIdx = question.correctOptionIndex ?? question.correctAnswer;
                const isCorrect = idx === correctIdx;
                return (
                  <motion.button key={idx} whileTap={{ scale: selected !== null ? 1 : 0.97 }} onClick={() => handleAnswer(idx)} disabled={selected !== null}
                    className={`p-5 rounded-xl text-lg font-semibold border-2 transition-all relative overflow-hidden
                      ${selected === idx ? (isCorrect ? 'bg-green-600 border-green-400 scale-105 shadow-lg shadow-green-500/30' : 'bg-red-600 border-red-400') : selected !== null && isCorrect ? 'bg-green-600/40 border-green-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}>
                    {opt}
                    {selected === idx && isCorrect && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-white text-green-600 rounded-full p-1"><Check size={14} /></motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </>
        ) : <p className="text-gray-400">Waiting for next question...</p>}
      </div>
    </div>
  );
};
export default StudentRacePlayer;
