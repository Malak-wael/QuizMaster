import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Swords, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../api/client';

const BattlePicker = () => {
  const navigate = useNavigate();
  const [studentCount, setStudentCount] = useState(30);
  const [fighter1, setFighter1] = useState(null);
  const [fighter2, setFighter2] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickFighters = () => {
    if (studentCount < 2) { toast.error('Need at least 2 students'); return; }
    setIsSpinning(true);
    setFighter1(null); setFighter2(null);
    const interval = setInterval(() => {
      setFighter1(Math.floor(Math.random() * studentCount) + 1);
      setFighter2(Math.floor(Math.random() * studentCount) + 1);
    }, 50);
    setTimeout(() => {
      clearInterval(interval);
      let f1 = Math.floor(Math.random() * studentCount) + 1;
      let f2 = Math.floor(Math.random() * studentCount) + 1;
      while (f1 === f2) f2 = Math.floor(Math.random() * studentCount) + 1;
      setFighter1(f1); setFighter2(f2); setIsSpinning(false);
    }, 3000);
  };

  const startGame = async () => {
    setLoading(true);
    try {
      const res = await api.post('/games/battle/start', { player1Name: `Player ${fighter1}`, player2Name: `Player ${fighter2}` });
      localStorage.setItem('battlePin', res.data.pin);
      toast.success(`Battle started! PIN: ${res.data.pin}`);
      navigate('/teacher/games/battle-arena');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed. Create a quiz first!');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500 mb-4">CLASSROOM BATTLE</h1>
        <p className="text-gray-400">Select random students to compete!</p>
      </div>
      <div className="mb-12 flex items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <label className="text-slate-400">Number of Students:</label>
        <input type="number" value={studentCount} onChange={e => setStudentCount(parseInt(e.target.value) || 0)}
          className="w-20 bg-slate-800 text-center text-white text-xl font-bold rounded-lg p-2 border border-slate-700 outline-none focus:border-red-500" />
      </div>
      <div className="flex items-center justify-center gap-8 md:gap-24 mb-12">
        <motion.div animate={{ scale: fighter1 && !isSpinning ? [1,1.1,1] : 1 }} className="relative">
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-lg shadow-red-500/30 border-4 border-red-500">
            {fighter1 ? <span className="text-6xl md:text-8xl font-black text-white">{fighter1}</span> : <Users className="text-red-400" size={64} />}
          </div>
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-red-500 px-4 py-1 rounded-full text-sm font-bold">PLAYER 1</span>
        </motion.div>
        <div className="text-4xl font-black text-yellow-500 animate-pulse">VS</div>
        <motion.div animate={{ scale: fighter2 && !isSpinning ? [1,1.1,1] : 1 }} className="relative">
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center shadow-lg shadow-blue-500/30 border-4 border-blue-500">
            {fighter2 ? <span className="text-6xl md:text-8xl font-black text-white">{fighter2}</span> : <Users className="text-blue-400" size={64} />}
          </div>
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-blue-500 px-4 py-1 rounded-full text-sm font-bold">PLAYER 2</span>
        </motion.div>
      </div>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={pickFighters} disabled={isSpinning}
        className="px-12 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-2xl font-bold rounded-full shadow-xl flex items-center gap-3 disabled:opacity-50">
        {isSpinning ? <><RefreshCw className="animate-spin" /> PICKING...</> : <><Swords size={28} /> PICK FIGHTERS</>}
      </motion.button>
      {fighter1 && fighter2 && !isSpinning && (
        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={startGame} disabled={loading}
          className="mt-8 px-8 py-3 bg-green-600 rounded-lg text-xl font-bold hover:bg-green-500 transition flex items-center gap-2 disabled:opacity-50">
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
          {loading ? 'Starting...' : 'Start Battle Game'}
        </motion.button>
      )}
    </div>
  );
};
export default BattlePicker;
