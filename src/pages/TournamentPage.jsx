import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Plus, CheckCircle, XCircle, Award, Star, Zap, Medal, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import toast from 'react-hot-toast';

function TournamentPage() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [playersInput, setPlayersInput] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchTournaments = async () => {
    try {
      const res = await api.get('/tournaments');
      setTournaments(res.data.tournaments || []);
      if (res.data.tournaments?.length > 0 && !selectedTournament) {
        setSelectedTournament(res.data.tournaments[0]);
      }
    } catch (err) {
      toast.error('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTournaments(); }, []);

  const handleCreate = async () => {
    const players = playersInput.split('\n').map(p => p.trim()).filter(Boolean);
    if (!name || players.length < 2) { toast.error('Need a name and at least 2 players'); return; }
    setCreating(true);
    try {
      const res = await api.post('/tournaments', { name, players });
      toast.success('Tournament created!');
      setTournaments(prev => [...prev, res.data.tournament]);
      setSelectedTournament(res.data.tournament);
      setShowCreate(false);
      setName('');
      setPlayersInput('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const handleMatchResult = async (matchId, winner) => {
    if (!selectedTournament) return;
    try {
      const res = await api.put(`/tournaments/${selectedTournament.id}/match/${matchId}`, { winner });
      setSelectedTournament(res.data.tournament);
      setTournaments(prev => prev.map(t => t.id === res.data.tournament.id ? res.data.tournament : t));
      toast.success(`${winner} advances!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update match');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tournaments/${id}`);
      setTournaments(prev => prev.filter(t => t.id !== id));
      if (selectedTournament?.id === id) setSelectedTournament(null);
      toast.success('Tournament deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const getRoundName = (round, total) => {
    if (round === total) return 'Final';
    if (round === total - 1) return 'Semi-Finals';
    if (round === total - 2) return 'Quarter-Finals';
    return `Round ${round}`;
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Tournament</h1>
          <p className="text-gray-400">Create and manage elimination brackets</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl flex items-center gap-2 hover:opacity-90 transition">
          <Plus size={20} /> New Tournament
        </button>
      </motion.div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="glass rounded-2xl p-8 max-w-md w-full border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Create Tournament</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Tournament Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Math Championship 2024" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Players (one per line)</label>
                  <textarea value={playersInput} onChange={e => setPlayersInput(e.target.value)} placeholder={"Alice\nBob\nCharlie\nDiana"} rows={6} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none" />
                  <p className="text-xs text-gray-500 mt-1">{playersInput.split('\n').filter(p => p.trim()).length} players entered</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-3 glass rounded-lg text-white hover:bg-white/10 transition">Cancel</button>
                <button onClick={handleCreate} disabled={creating} className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 transition disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tournament List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider text-gray-400">Your Tournaments</h3>
          {tournaments.length === 0 ? (
            <p className="text-gray-500 text-sm">No tournaments yet.</p>
          ) : (
            tournaments.map(t => (
              <div key={t.id} onClick={() => setSelectedTournament(t)}
                className={`p-4 rounded-xl cursor-pointer transition border ${selectedTournament?.id === t.id ? 'bg-purple-500/20 border-purple-500' : 'glass border-white/5 hover:border-white/20'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs mt-1">{t.players?.length} players · {t.status}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bracket */}
        <div className="lg:col-span-3">
          {!selectedTournament ? (
            <div className="glass rounded-2xl p-12 text-center">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Select a tournament or create a new one</p>
            </div>
          ) : (
            <div className="glass rounded-2xl p-6">
              {/* Champion Banner */}
              {selectedTournament.status === 'completed' && selectedTournament.champion && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500 rounded-xl text-center">
                  <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
                  <p className="text-yellow-400 font-black text-2xl">🏆 Champion: {selectedTournament.champion}</p>
                </motion.div>
              )}

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{selectedTournament.name}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedTournament.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {selectedTournament.status?.toUpperCase()}
                </span>
              </div>

              {/* Rounds */}
              <div className="flex gap-6 overflow-x-auto pb-4">
                {selectedTournament.rounds?.map((round) => (
                  <div key={round.round} className="flex-shrink-0 w-64">
                    <h3 className="text-center text-gray-400 text-sm font-bold uppercase mb-4">
                      {getRoundName(round.round, selectedTournament.rounds.length)}
                    </h3>
                    <div className="space-y-4">
                      {round.matches.map((match) => (
                        <div key={match.id} className={`p-4 rounded-xl border ${match.status === 'completed' ? 'border-green-500/30 bg-green-500/5' : round.status === 'active' ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/10 bg-white/5 opacity-50'}`}>
                          {/* Player 1 */}
                          <div className={`flex items-center justify-between p-2 rounded-lg mb-2 cursor-pointer transition ${match.winner === match.player1 ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/10 text-white'}`}
                            onClick={() => round.status === 'active' && match.status !== 'completed' && match.player2 && handleMatchResult(match.id, match.player1)}>
                            <span className="font-medium text-sm truncate">{match.player1 || '?'}</span>
                            {match.winner === match.player1 && <CheckCircle size={16} className="text-green-400 flex-shrink-0" />}
                          </div>
                          <div className="text-center text-gray-600 text-xs my-1">VS</div>
                          {/* Player 2 */}
                          <div className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${match.player2 === null ? 'opacity-40 cursor-not-allowed' : ''} ${match.winner === match.player2 ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/10 text-white'}`}
                            onClick={() => round.status === 'active' && match.status !== 'completed' && match.player2 && handleMatchResult(match.id, match.player2)}>
                            <span className="font-medium text-sm truncate">{match.player2 || 'BYE'}</span>
                            {match.winner === match.player2 && <CheckCircle size={16} className="text-green-400 flex-shrink-0" />}
                          </div>
                          {match.status === 'completed' && match.score && (
                            <p className="text-center text-xs text-gray-500 mt-2">{match.score}</p>
                          )}
                          {round.status === 'active' && match.status !== 'completed' && match.player2 && (
                            <p className="text-center text-xs text-blue-400 mt-2">Click winner to advance</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TournamentPage;
