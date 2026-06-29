import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Copy, Play, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api/client';

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange'];

const TeamRaceSetup = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([
    { name: 'Team Alpha', code: '1111', color: 'red' },
    { name: 'Team Beta', code: '2222', color: 'blue' },
  ]);
  const [loading, setLoading] = useState(false);

  const addTeam = () => {
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    setTeams([...teams, { name: `Team ${teams.length + 1}`, code: newCode, color: COLORS[teams.length % COLORS.length] }]);
  };

  const removeTeam = (index) => {
    if (teams.length <= 2) { toast.error('Need at least 2 teams'); return; }
    setTeams(teams.filter((_, i) => i !== index));
  };

  const copyCode = (code) => { navigator.clipboard.writeText(code); toast.success('Code copied!'); };

  const startRace = async () => {
    setLoading(true);
    try {
      const res = await api.post('/games/race/create', { teams });
      const { pin, game } = res.data;
      localStorage.setItem('racePin', pin);
      localStorage.setItem('raceTeams', JSON.stringify(game.teams));
      toast.success(`Race created! PIN: ${pin}`);
      navigate('/teacher/games/team-monitor');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start race. Create a quiz first!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Setup Team Race</h1>
          <p className="text-gray-400">Give each team their unique code to join on their devices</p>
        </div>
        <div className="space-y-4 mb-8">
          {teams.map((team, index) => (
            <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass p-6 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-12 h-12 rounded-full bg-${team.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                  <Users className={`text-${team.color}-400`} />
                </div>
                <input type="text" value={team.name}
                  onChange={(e) => { const u = [...teams]; u[index] = { ...u[index], name: e.target.value }; setTeams(u); }}
                  className="bg-transparent text-xl font-bold border-b border-transparent hover:border-white/40 focus:border-white outline-none flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
                  <span className="font-mono text-2xl tracking-widest text-yellow-400">{team.code}</span>
                  <button onClick={() => copyCode(team.code)} className="text-gray-400 hover:text-white transition-colors"><Copy size={18} /></button>
                </div>
                <button onClick={() => removeTeam(index)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={18} /></button>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-center gap-4">
          <button onClick={addTeam} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors">
            <Plus size={20} /> Add Team
          </button>
          <button onClick={startRace} disabled={loading} className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play size={20} />}
            {loading ? 'Creating...' : 'Start Race'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default TeamRaceSetup;
