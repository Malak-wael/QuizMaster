import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Skull, Heart, Swords, Trophy, Home } from 'lucide-react';
import { api } from '../api/client';

const DragonSVG = ({ isDead }) => (
  <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-[0_0_30px_rgba(255,0,0,0.3)] ${isDead ? 'opacity-20' : ''}`}>
    <defs><linearGradient id="dgM" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#b91c1c"/><stop offset="100%" stopColor="#450a0a"/></linearGradient></defs>
    <motion.g animate={isDead ? {} : { y:[0,-5,0] }} transition={{ duration:3, repeat:Infinity }}>
      <path d="M40,100 Q20,40 80,80 L70,110 Z" fill="#7f1d1d" opacity="0.8"/>
      <path d="M160,100 Q180,40 120,80 L130,110 Z" fill="#7f1d1d" opacity="0.8"/>
      <ellipse cx="100" cy="130" rx="50" ry="40" fill="url(#dgM)"/>
      <path d="M70,110 Q100,60 130,110 Q115,130 100,130 Q85,130 70,110" fill="#b91c1c"/>
      {isDead ? <g stroke="black" strokeWidth="3"><line x1="84" y1="96" x2="92" y2="104"/><line x1="92" y1="96" x2="84" y2="104"/><line x1="108" y1="96" x2="116" y2="104"/><line x1="116" y1="96" x2="108" y2="104"/></g>
        : <><circle cx="88" cy="100" r="4" fill="#fbbf24"/><circle cx="112" cy="100" r="4" fill="#fbbf24"/></>}
      <path d="M75,85 L65,60 L82,95" fill="#1e293b"/><path d="M125,85 L135,60 L118,95" fill="#1e293b"/>
    </motion.g>
  </svg>
);
const RobotSVG = ({ isDead }) => (
  <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-[0_0_30px_rgba(59,130,246,0.3)] ${isDead ? 'opacity-20' : ''}`}>
    <defs><linearGradient id="rbM" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#1e293b"/></linearGradient></defs>
    <motion.g animate={isDead ? {} : { rotate:[0,2,-2,0] }} transition={{ duration:2, repeat:Infinity }}>
      <rect x="50" y="90" width="100" height="70" rx="10" fill="url(#rbM)" stroke="#60a5fa" strokeWidth="2"/>
      <rect x="65" y="40" width="70" height="50" rx="5" fill="#334155" stroke="#60a5fa" strokeWidth="2"/>
      {isDead ? <rect x="75" y="55" width="50" height="15" rx="5" fill="#1e293b" stroke="red" strokeWidth="1"/>
        : <motion.rect x="75" y="55" width="50" height="15" rx="5" fill="#3b82f6"><motion.animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/></motion.rect>}
      <rect x="20" y="100" width="30" height="15" rx="5" fill="#475569"/><rect x="150" y="100" width="30" height="15" rx="5" fill="#475569"/>
    </motion.g>
  </svg>
);
const DemonSVG = ({ isDead }) => (
  <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-[0_0_30px_rgba(139,92,246,0.3)] ${isDead ? 'opacity-20' : ''}`}>
    <defs><linearGradient id="dmM" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#1e1b4b"/></linearGradient></defs>
    <motion.g animate={isDead ? {} : { scale:[1,1.02,1] }} transition={{ duration:1.5, repeat:Infinity }}>
      <ellipse cx="100" cy="150" rx="70" ry="40" fill="#1e1b4b" opacity="0.6"/>
      <path d="M60,150 Q100,40 140,150" fill="url(#dmM)" opacity="0.9"/>
      <ellipse cx="100" cy="110" rx="30" ry="25" fill="#1e1b4b"/>
      {isDead ? <g stroke="gray" strokeWidth="3"><line x1="84" y1="106" x2="92" y2="116"/><line x1="92" y1="106" x2="84" y2="116"/><line x1="108" y1="106" x2="116" y2="116"/><line x1="116" y1="106" x2="108" y2="116"/></g>
        : <><motion.path d="M85,110 L95,100 L95,115 Z" fill="#fbbf24"><motion.animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/></motion.path><motion.path d="M115,110 L105,100 L105,115 Z" fill="#fbbf24"><motion.animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/></motion.path></>}
      <path d="M70,80 Q80,40 90,80" fill="none" stroke="#1e1b4b" strokeWidth="8"/>
      <path d="M130,80 Q120,40 110,80" fill="none" stroke="#1e1b4b" strokeWidth="8"/>
    </motion.g>
  </svg>
);

const BossBattleMonitor = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [pin, setPin] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [bossHit, setBossHit] = useState(false);
  const pinRef = React.useRef(localStorage.getItem('bossPin'));

  const fetchState = useCallback(async (gamePin) => {
    try {
      const res = await api.get(`/games/boss/state/${gamePin}`);
      setGameState(prev => {
        if (prev && res.data.boss.currentHp < prev.boss.currentHp) {
          setBossHit(true); setTimeout(() => setBossHit(false), 400);
        }
        return res.data;
      });
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    const savedPin = pinRef.current;
    if (!savedPin) { navigate('/teacher/games/boss-setup'); return; }
    setPin(savedPin);
    fetchState(savedPin);
  }, [navigate, fetchState]);

  useEffect(() => {
    if (!pin) return;
    const interval = setInterval(() => fetchState(pin), 2000);
    return () => clearInterval(interval);
  }, [pin, fetchState]);

  const renderBoss = (isDead = false) => {
    if (!gameState) return null;
    if (gameState.boss.name === 'Dark Dragon') return <DragonSVG isDead={isDead} />;
    if (gameState.boss.name === 'Cyber Robot') return <RobotSVG isDead={isDead} />;
    return <DemonSVG isDead={isDead} />;
  };

  if (!gameState) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center"><div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"/></div>;

  const { boss, teams, status, currentQuestion, mvp } = gameState;
  const hpPercent = boss.hp > 0 ? (boss.currentHp / boss.hp) * 100 : 0;

  if (status === 'victory' || status === 'defeat') {
    const isVictory = status === 'victory';
    const rankedTeams = [...teams].sort((a, b) => b.damage - a.damage);
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 overflow-y-auto">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 100 }}
          className={`glass p-8 rounded-3xl border-2 ${isVictory ? 'border-yellow-500 shadow-yellow-500/30' : 'border-red-500 shadow-red-500/30'} shadow-2xl max-w-3xl w-full text-center`}>
          <Trophy className={`w-20 h-20 mx-auto mb-4 ${isVictory ? 'text-yellow-400' : 'text-red-400'}`} />
          <h1 className={`text-5xl font-black mb-2 uppercase ${isVictory ? 'text-yellow-400' : 'text-red-400'}`}>{isVictory ? 'VICTORY!' : 'DEFEAT!'}</h1>
          <p className="text-gray-400 mb-8">{isVictory ? 'The Boss has been defeated!' : 'The Boss has won!'}</p>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left">
              <thead><tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
                <th className="p-2">Rank</th><th className="p-2">Team</th><th className="p-2 text-center">HP</th><th className="p-2 text-center">Damage</th><th className="p-2 text-center">Status</th>
              </tr></thead>
              <tbody>
                {rankedTeams.map((t, i) => (
                  <motion.tr key={t.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className={`border-b border-white/5 ${i === 0 ? 'bg-yellow-500/10' : ''}`}>
                    <td className="p-2 font-bold">{i === 0 ? '👑 1st' : i === 1 ? '🥈 2nd' : i === 2 ? '🥉 3rd' : `${i+1}.`}</td>
                    <td className="p-2 font-bold text-white">{t.name}</td>
                    <td className="p-2 text-center"><span className={t.hp > 0 ? 'text-green-400' : 'text-red-400'}>{t.hp > 0 ? `${t.hp} HP` : 'DEAD'}</span></td>
                    <td className="p-2 text-center font-mono text-blue-400">{t.damage}</td>
                    <td className="p-2 text-center"><span className={`px-2 py-0.5 rounded text-xs ${t.hp > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{t.hp > 0 ? 'Survived' : 'Eliminated'}</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {mvp && <div className="bg-yellow-500/10 border border-yellow-500 px-6 py-3 rounded-xl mb-6 inline-block"><p className="text-xs text-yellow-400 uppercase">MVP</p><p className="text-xl font-bold">{mvp.name} — {mvp.damage} dmg</p></div>}
          <button onClick={() => { localStorage.removeItem('bossPin'); navigate('/teacher'); }} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold flex items-center gap-2 mx-auto transition">
            <Home /> Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <div className="p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold text-red-400 flex items-center gap-2 uppercase"><Skull /> {boss.name}</h1>
          <span className="font-mono text-white">{boss.currentHp} / {boss.hp}</span>
          {pin && <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-mono">PIN: {pin}</span>}
        </div>
        <div className="w-full h-6 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
          <motion.div className="h-full bg-gradient-to-r from-red-700 to-red-500" animate={{ width: `${hpPercent}%` }} transition={{ duration: 0.5 }} />
          <div className="absolute inset-0 flex justify-center items-center text-xs font-bold text-white drop-shadow">{Math.round(hpPercent)}%</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div animate={{ scale: bossHit ? [1,0.85,1.1,1] : 1, filter: bossHit ? 'brightness(2)' : 'brightness(1)' }} transition={{ duration: 0.3 }} className="w-52 h-52 md:w-64 md:h-64">
          {renderBoss()}
        </motion.div>
        {bossHit && <motion.div initial={{ y:0, opacity:1 }} animate={{ y:-60, opacity:0 }} className="text-4xl font-black text-yellow-400 mt-2">HIT!</motion.div>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-8">
          {teams.map(team => (
            <div key={team.id} className="glass p-4 rounded-xl text-center relative">
              <h3 className="font-bold text-sm text-white mb-1">{team.name}</h3>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
                <motion.div className="h-full bg-pink-500" animate={{ width: `${team.maxHp > 0 ? (team.hp / team.maxHp) * 100 : 0}%` }} />
              </div>
              <p className="text-xs text-gray-400 flex justify-between px-1">
                <span><Heart size={10} className="inline text-pink-400" /> {team.hp}</span>
                <span><Swords size={10} className="inline text-yellow-400" /> {team.damage}</span>
              </p>
              {team.hp <= 0 && <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-xl"><span className="text-red-500 font-bold border border-red-500 px-2 py-1 rounded text-xs">DEAD</span></div>}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-900 p-6 border-t border-slate-800 text-center">
        {currentQuestion ? (
          <>
            <motion.h2 key={currentQuestion.question} initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-xl md:text-2xl font-bold mb-3">
              {currentQuestion.question || currentQuestion.text}
            </motion.h2>
            {showAnswer && (
              <div className="flex justify-center gap-3 flex-wrap">
                {currentQuestion.options.map((opt, i) => {
                  const correctIdx = currentQuestion.correctOptionIndex ?? currentQuestion.correctAnswer;
                  return <span key={i} className={`px-4 py-2 rounded text-sm ${i === correctIdx ? 'bg-green-600 ring-2 ring-green-400' : 'bg-slate-700 opacity-50'}`}>{opt}</span>;
                })}
              </div>
            )}
            <div className="mt-4 flex justify-center gap-3">
              <button onClick={() => setShowAnswer(v => !v)} className="px-5 py-2 bg-yellow-500 text-black hover:bg-yellow-400 rounded font-semibold">{showAnswer ? 'Hide' : 'Reveal'} Answer</button>
            </div>
          </>
        ) : <p className="text-gray-500">Waiting for students to answer...</p>}
      </div>
    </div>
  );
};
export default BossBattleMonitor;
