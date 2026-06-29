import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Skull, Shield, AlertTriangle, Home, Trophy } from 'lucide-react';
import { api } from '../api/client';
import toast from 'react-hot-toast';

const DragonSVG = ({ isDead }) => (
  <svg viewBox="0 0 200 200" className={`w-full h-full ${isDead ? 'opacity-20' : ''}`}>
    <defs><linearGradient id="dgP" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#b91c1c"/><stop offset="100%" stopColor="#450a0a"/></linearGradient></defs>
    <motion.g animate={isDead ? {} : { y:[0,-5,0] }} transition={{ duration:3, repeat:Infinity }}>
      <path d="M40,100 Q20,40 80,80 L70,110 Z" fill="#7f1d1d" opacity="0.8"/>
      <path d="M160,100 Q180,40 120,80 L130,110 Z" fill="#7f1d1d" opacity="0.8"/>
      <ellipse cx="100" cy="130" rx="50" ry="40" fill="url(#dgP)"/>
      <path d="M70,110 Q100,60 130,110 Q115,130 100,130 Q85,130 70,110" fill="#b91c1c"/>
      {isDead ? <g stroke="black" strokeWidth="3"><line x1="84" y1="96" x2="92" y2="104"/><line x1="92" y1="96" x2="84" y2="104"/><line x1="108" y1="96" x2="116" y2="104"/><line x1="116" y1="96" x2="108" y2="104"/></g>
        : <><circle cx="88" cy="100" r="4" fill="#fbbf24"/><circle cx="112" cy="100" r="4" fill="#fbbf24"/></>}
      <path d="M75,85 L65,60 L82,95" fill="#1e293b"/><path d="M125,85 L135,60 L118,95" fill="#1e293b"/>
    </motion.g>
  </svg>
);
const RobotSVG = ({ isDead }) => (
  <svg viewBox="0 0 200 200" className={`w-full h-full ${isDead ? 'opacity-20' : ''}`}>
    <defs><linearGradient id="rbP" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#1e293b"/></linearGradient></defs>
    <motion.g animate={isDead ? {} : { rotate:[0,2,-2,0] }} transition={{ duration:2, repeat:Infinity }}>
      <rect x="50" y="90" width="100" height="70" rx="10" fill="url(#rbP)" stroke="#60a5fa" strokeWidth="2"/>
      <rect x="65" y="40" width="70" height="50" rx="5" fill="#334155" stroke="#60a5fa" strokeWidth="2"/>
      {isDead ? <rect x="75" y="55" width="50" height="15" rx="5" fill="#1e293b" stroke="red" strokeWidth="1"/>
        : <motion.rect x="75" y="55" width="50" height="15" rx="5" fill="#3b82f6"><motion.animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/></motion.rect>}
      <rect x="20" y="100" width="30" height="15" rx="5" fill="#475569"/><rect x="150" y="100" width="30" height="15" rx="5" fill="#475569"/>
    </motion.g>
  </svg>
);
const DemonSVG = ({ isDead }) => (
  <svg viewBox="0 0 200 200" className={`w-full h-full ${isDead ? 'opacity-20' : ''}`}>
    <defs><linearGradient id="dmP" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#1e1b4b"/></linearGradient></defs>
    <motion.g animate={isDead ? {} : { scale:[1,1.02,1] }} transition={{ duration:1.5, repeat:Infinity }}>
      <ellipse cx="100" cy="150" rx="70" ry="40" fill="#1e1b4b" opacity="0.6"/>
      <path d="M60,150 Q100,40 140,150" fill="url(#dmP)" opacity="0.9"/>
      <ellipse cx="100" cy="110" rx="30" ry="25" fill="#1e1b4b"/>
      {isDead ? <g stroke="gray" strokeWidth="3"><line x1="84" y1="106" x2="92" y2="116"/><line x1="92" y1="106" x2="84" y2="116"/><line x1="108" y1="106" x2="116" y2="116"/><line x1="116" y1="106" x2="108" y2="116"/></g>
        : <><motion.path d="M85,110 L95,100 L95,115 Z" fill="#fbbf24"><motion.animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/></motion.path><motion.path d="M115,110 L105,100 L105,115 Z" fill="#fbbf24"><motion.animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/></motion.path></>}
      <path d="M70,80 Q80,40 90,80" fill="none" stroke="#1e1b4b" strokeWidth="8"/>
      <path d="M130,80 Q120,40 110,80" fill="none" stroke="#1e1b4b" strokeWidth="8"/>
    </motion.g>
  </svg>
);

const BossBattlePlayer = () => {
  const navigate = useNavigate();
  const [joinData, setJoinData] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [battleAnim, setBattleAnim] = useState(null);
  const [pin, setPin] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [joining, setJoining] = useState(false);

  const fetchState = useCallback(async (gamePin) => {
    try {
      const res = await api.get(`/games/boss/state/${gamePin}`);
      setGameState(res.data);
    } catch (_err) { /* ignore */ }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('bossJoinData');
    if (saved) { const parsed = JSON.parse(saved); setJoinData(parsed); fetchState(parsed.pin); }
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
      const res = await api.post('/games/boss/join', { pin: pinNorm, teamCode: teamNorm });
      const data = { pin: pinNorm, team: res.data.team, boss: res.data.boss, questions: res.data.questions };
      setJoinData(data);
      localStorage.setItem('bossJoinData', JSON.stringify(data));
      toast.success(`Joined ${res.data.team.name}!`);
      fetchState(pinNorm);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to join'); }
    finally { setJoining(false); }
  };

  const handleAnswer = async (optionIndex) => {
    if (selected !== null || !joinData) return;
    setSelected(optionIndex);
    const question = joinData.questions[currentQ];
    if (!question) return;
    const correctIdx = question.correctOptionIndex ?? question.correctAnswer;
    const isCorrect = optionIndex === correctIdx;
    setBattleAnim(isCorrect ? 'hit' : 'miss');
    setTimeout(() => setBattleAnim(null), 1000);
    try {
      const res = await api.post('/games/boss/attack', { pin: joinData.pin, teamCode: joinData.team.code, questionIndex: currentQ, selectedOptionIndex: optionIndex });
      setGameState(prev => ({ ...prev, ...res.data }));
    } catch (err) { console.error(err); }
    setTimeout(() => { setSelected(null); setCurrentQ(prev => prev + 1 < (joinData?.questions?.length || 1) ? prev + 1 : 0); }, 1200);
  };

  const renderBoss = (isDead = false) => {
    const name = joinData?.boss?.name || gameState?.boss?.name || '';
    if (name === 'Dark Dragon') return <DragonSVG isDead={isDead} />;
    if (name === 'Cyber Robot') return <RobotSVG isDead={isDead} />;
    return <DemonSVG isDead={isDead} />;
  };

  const myTeam = gameState?.teams?.find(t => t.id === joinData?.team?.id || t.code === joinData?.team?.code);
  const bossState = gameState?.boss || joinData?.boss;

  if (!joinData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-8 max-w-sm w-full space-y-4">
          <Skull className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-center">Join Boss Battle</h1>
          <input value={pin} onChange={e => setPin(e.target.value)} placeholder="Game PIN" className="w-full px-4 py-3 bg-slate-800 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500" maxLength={4} />
          <input value={teamCode} onChange={e => setTeamCode(e.target.value)} placeholder="Your Team Code" className="w-full px-4 py-3 bg-slate-800 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500" maxLength={6} />
          <button onClick={handleJoin} disabled={joining} className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-lg disabled:opacity-50">
            {joining ? 'Joining...' : '⚔️ Join Battle'}
          </button>
        </div>
      </div>
    );
  }

  if (gameState?.status === 'victory' || gameState?.status === 'defeat') {
    const isVictory = gameState.status === 'victory';
    return (
      <div className={`min-h-screen ${isVictory ? 'bg-slate-950' : 'bg-red-950'} text-white flex items-center justify-center p-4`}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="glass p-8 rounded-3xl text-center max-w-sm w-full">
          <div className="w-40 h-40 mx-auto mb-4">{renderBoss(!isVictory)}</div>
          <h1 className={`text-4xl font-black mb-2 ${isVictory ? 'text-green-400' : 'text-red-400'}`}>{isVictory ? 'BOSS SLAIN! 🎉' : 'DEFEATED! 💀'}</h1>
          <p className="text-gray-400 mb-6">{isVictory ? `You defeated the ${bossState?.name}` : `The ${bossState?.name} won`}</p>
          {myTeam && (
            <div className="glass p-4 rounded-xl mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 p-3 rounded-lg"><p className="text-2xl font-bold text-yellow-400">{myTeam.damage}</p><p className="text-xs text-gray-400">Damage Dealt</p></div>
                <div className="bg-black/20 p-3 rounded-lg"><p className="text-2xl font-bold text-pink-400">{myTeam.hp}</p><p className="text-xs text-gray-400">HP Left</p></div>
              </div>
            </div>
          )}
          <button onClick={() => { localStorage.removeItem('bossJoinData'); navigate('/student/join'); }} className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold flex items-center justify-center gap-2">
            <Home size={18} /> Exit
          </button>
        </motion.div>
      </div>
    );
  }

  const question = joinData.questions[currentQ % joinData.questions.length];
  const bossHpPct = bossState ? (bossState.currentHp / bossState.hp) * 100 : 100;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <div className="p-3 bg-slate-900 border-b border-slate-800">
        <div className="flex justify-between text-xs text-red-400 mb-1">
          <span className="flex items-center gap-1"><Skull size={12} /> {bossState?.name}</span>
          <span>{bossState?.currentHp} / {bossState?.hp} HP</span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-red-700 to-red-500" animate={{ width: `${bossHpPct}%` }} transition={{ duration: 0.4 }} />
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <motion.div
          animate={battleAnim === 'hit' ? { scale:[1,0.8,1.1,1], filter:['brightness(1)','brightness(3)','brightness(1)'] } : battleAnim === 'miss' ? { x:[0,-10,10,0] } : {}}
          transition={{ duration: 0.4 }} className="w-40 h-40">{renderBoss()}</motion.div>
        <AnimatePresence>
          {battleAnim === 'hit' && (
            <motion.div initial={{ opacity:1, y:0, scale:1 }} animate={{ opacity:0, y:-60, scale:2 }} exit={{}} className="absolute text-3xl font-black text-yellow-400 pointer-events-none">CRITICAL HIT! ⚔️</motion.div>
          )}
          {battleAnim === 'miss' && (
            <motion.div initial={{ opacity:1 }} animate={{ opacity:0 }} exit={{}} className="absolute inset-0 bg-red-900/40 flex items-center justify-center z-30">
              <AlertTriangle className="w-16 h-16 text-orange-500 animate-bounce" />
            </motion.div>
          )}
        </AnimatePresence>
        {myTeam && (
          <div className="absolute top-4 right-4 glass p-3 rounded-xl min-w-[130px]">
            <div className="flex items-center gap-2 mb-1"><Shield size={14} className="text-blue-400" /><span className="font-bold text-sm truncate">{myTeam.name}</span></div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
              <motion.div className="h-full bg-green-500" animate={{ width: `${myTeam.maxHp > 0 ? (myTeam.hp / myTeam.maxHp) * 100 : 100}%` }} />
            </div>
            <p className="text-xs text-right text-gray-400">{myTeam.hp} HP · {myTeam.damage} dmg</p>
          </div>
        )}
      </div>
      <div className="p-4 bg-slate-900/80 border-t border-white/10 backdrop-blur-sm">
        <AnimatePresence mode="wait">
          <motion.div key={currentQ} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
            <h2 className="text-lg md:text-xl font-bold text-center mb-4">{question?.question || question?.text}</h2>
            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
              {question?.options.map((opt, idx) => {
                const correctIdx = question.correctOptionIndex ?? question.correctAnswer;
                const isCorrect = idx === correctIdx;
                return (
                  <motion.button key={idx} whileTap={{ scale: selected !== null ? 1 : 0.95 }} onClick={() => handleAnswer(idx)} disabled={selected !== null}
                    className={`p-3 rounded-xl text-sm font-semibold border-2 transition-all
                      ${selected === idx ? (isCorrect ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400') : selected !== null && isCorrect ? 'bg-green-500/30 border-green-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                    {opt}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
export default BossBattlePlayer;
