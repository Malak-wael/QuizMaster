import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skull, Heart, Swords, Plus, Trash2, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../api/client';

const BOSS_OPTIONS = [
  { name: 'Dark Dragon', hp: 1000, emoji: '🐉' },
  { name: 'Cyber Robot', hp: 1500, emoji: '🤖' },
  { name: 'Ancient Demon', hp: 2000, emoji: '👹' },
];
const COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];

const BossSetup = () => {
  const navigate = useNavigate();
  const [boss, setBoss] = useState(BOSS_OPTIONS[0]);
  const [teams, setTeams] = useState([
    { name: 'Warriors', code: 'W111', color: 'red' },
    { name: 'Mages', code: 'M222', color: 'blue' },
  ]);
  const [loading, setLoading] = useState(false);

  const addTeam = () => {
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    setTeams([...teams, { name: `Team ${teams.length + 1}`, code: newCode, color: COLORS[teams.length % COLORS.length] }]);
  };

  const removeTeam = (index) => {
    if (teams.length <= 1) { toast.error('Need at least 1 team'); return; }
    setTeams(teams.filter((_, i) => i !== index));
  };

  const copyCode = (code) => { navigator.clipboard.writeText(code); toast.success('Code copied!'); };

  const startBattle = async () => {
    setLoading(true);
    try {
      const res = await api.post('/games/boss/create', { boss, teams });
      const { pin, game } = res.data;
      localStorage.setItem('bossPin', pin);
      localStorage.setItem('bossGameData', JSON.stringify(game));
      toast.success(`Battle started! PIN: ${pin}`);
      navigate('/teacher/games/boss-arena');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed. Create a quiz first!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Skull className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold">Boss Battle Setup</h1>
          <p className="text-gray-400 mt-2">Choose your enemy and prepare your heroes!</p>
        </div>
        <div className="glass p-6 rounded-xl mb-8 border border-red-500/30">
          <h2 className="text-xl font-bold mb-4 text-red-400">Select Boss</h2>
          <div className="grid grid-cols-3 gap-4">
            {BOSS_OPTIONS.map(b => (
              <button key={b.name} onClick={() => setBoss(b)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center transition-all ${boss.name === b.name ? 'border-red-500 bg-red-500/20' : 'border-slate-700 hover:border-slate-500'}`}>
                <span className="text-5xl mb-2">{b.emoji}</span>
                <span className="font-bold">{b.name}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Heart size={12} className="text-red-500" /> {b.hp} HP</span>
              </button>
            ))}
          </div>
        </div>
        <div className="glass p-6 rounded-xl mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Heroes ({teams.length} teams)</h2>
            <button onClick={addTeam} className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded flex items-center gap-1 transition-colors">
              <Plus size={14} /> Add Team
            </button>
          </div>
          <div className="space-y-3">
            {teams.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/5">
                <input value={t.name} onChange={e => { const u = [...teams]; u[i] = { ...u[i], name: e.target.value }; setTeams(u); }}
                  className="bg-transparent font-bold text-lg border-b border-transparent hover:border-white/40 focus:border-white outline-none flex-1" />
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-lg">
                  <span className="font-mono text-yellow-400 text-lg tracking-widest">{t.code}</span>
                  <button onClick={() => copyCode(t.code)} className="text-gray-400 hover:text-white"><Copy size={14} /></button>
                </div>
                <button onClick={() => removeTeam(i)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={16} /></button>
              </motion.div>
            ))}
          </div>
        </div>
        <button onClick={startBattle} disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white text-2xl font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity">
          {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Swords size={24} />}
          {loading ? 'Starting...' : 'START BATTLE'}
        </button>
      </div>
    </div>
  );
};
export default BossSetup;
