import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../api/client';

const BattleArena = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [localScores, setLocalScores] = useState({ p1: 0, p2: 0 });
  const [localStatus, setLocalStatus] = useState({ p1: 'waiting', p2: 'waiting' });
  const [showResult, setShowResult] = useState(false);
  const [gamePhase, setGamePhase] = useState('loading');
  const [p1Input, setP1Input] = useState('');
  const [p2Input, setP2Input] = useState('');
  const stateRef = useRef({ localStatus: { p1:'waiting', p2:'waiting' }, showResult: false, gamePhase: 'loading' });

  useEffect(() => {
    stateRef.current.localStatus = localStatus;
    stateRef.current.showResult = showResult;
    stateRef.current.gamePhase = gamePhase;
  }, [localStatus, showResult, gamePhase]);

  const fetchState = useCallback(async (gamePin) => {
    try {
      const res = await api.get(`/games/battle/state/${gamePin}`);
      const data = res.data;
      setGameData(data);
      setLocalScores({ p1: data.players.p1.score, p2: data.players.p2.score });
      setLocalStatus({ p1: data.players.p1.status, p2: data.players.p2.status });
      if (data.status === 'gameover') setGamePhase('gameover');
      else setGamePhase('playing');
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    const savedPin = localStorage.getItem('battlePin');
    if (savedPin) { setPin(savedPin); fetchState(savedPin); }
    else setGamePhase('setup');
  }, [fetchState]);

  useEffect(() => {
    if (!pin || gamePhase === 'gameover' || gamePhase === 'setup') return;
    const interval = setInterval(() => fetchState(pin), 1500);
    return () => clearInterval(interval);
  }, [pin, gamePhase, fetchState]);

  const handleSetupStart = async () => {
    if (!p1Input.trim() || !p2Input.trim()) return;
    try {
      const res = await api.post('/games/battle/start', { player1Name: p1Input, player2Name: p2Input });
      const newPin = res.data.pin;
      localStorage.setItem('battlePin', newPin);
      setPin(newPin);
      fetchState(newPin);
    } catch (err) {
      setGamePhase('setup');
      alert(err.response?.data?.message || 'Failed to start. Create a quiz first.');
    }
  };

  const handleAction = useCallback(async (player, index) => {
    const st = stateRef.current;
    if (st.gamePhase !== 'playing') return;
    if (st.showResult) return;
    const pKey = `p${player}`;
    if (st.localStatus[pKey] !== 'waiting') return;
    const currentPin = localStorage.getItem('battlePin');
    if (!currentPin) return;
    setShowResult(true);
    try {
      const res = await api.post('/games/battle/action', { pin: currentPin, player: pKey, selectedOptionIndex: index });
      const { game } = res.data;
      setLocalStatus({ p1: game.players.p1.status, p2: game.players.p2.status });
      setLocalScores({ p1: game.players.p1.score, p2: game.players.p2.score });
      if (game.status === 'gameover') {
        setTimeout(() => setGamePhase('gameover'), 1500);
      } else {
        setTimeout(() => {
          setLocalStatus({ p1: 'waiting', p2: 'waiting' });
          setShowResult(false);
          fetchState(currentPin);
        }, 1500);
      }
    } catch (err) { console.error(err); setShowResult(false); }
  }, [fetchState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (['KeyA','KeyS','KeyD','KeyF','KeyJ','KeyK','KeyL','Semicolon'].includes(e.code)) e.preventDefault();
      switch (e.code) {
        case 'KeyA': handleAction(1, 0); break; case 'KeyS': handleAction(1, 1); break;
        case 'KeyD': handleAction(1, 2); break; case 'KeyF': handleAction(1, 3); break;
        case 'KeyJ': handleAction(2, 0); break; case 'KeyK': handleAction(2, 1); break;
        case 'KeyL': handleAction(2, 2); break; case 'Semicolon': handleAction(2, 3); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction]);

  const playAgain = () => {
    localStorage.removeItem('battlePin');
    setPin(null); setGameData(null);
    setLocalScores({ p1:0, p2:0 }); setLocalStatus({ p1:'waiting', p2:'waiting' });
    setShowResult(false); setP1Input(''); setP2Input('');
    setGamePhase('setup');
  };

  if (gamePhase === 'loading') return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center"><div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (gamePhase === 'setup') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} className="glass p-8 md:p-12 rounded-3xl border border-white/10 max-w-lg w-full">
          <div className="text-center mb-8">
            <motion.div animate={{ rotate:[0,10,-10,0] }} transition={{ duration:2, repeat:Infinity }} className="text-6xl mb-4">⚔️</motion.div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent mb-2">Battle Arena</h1>
            <p className="text-gray-400">Enter student names to start</p>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-red-400 font-bold mb-2 text-sm">🔴 Player 1</label>
              <input type="text" value={p1Input} onChange={e => setP1Input(e.target.value)} placeholder="Student name..." onKeyDown={e => e.key==='Enter' && document.getElementById('p2in')?.focus()} className="w-full p-4 bg-red-950/30 border-2 border-red-800 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none text-lg" autoFocus />
            </div>
            <div className="text-center text-2xl font-bold text-gray-600">VS</div>
            <div>
              <label className="block text-blue-400 font-bold mb-2 text-sm">🔵 Player 2</label>
              <input id="p2in" type="text" value={p2Input} onChange={e => setP2Input(e.target.value)} placeholder="Student name..." onKeyDown={e => e.key==='Enter' && handleSetupStart()} className="w-full p-4 bg-blue-950/30 border-2 border-blue-800 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-lg" />
            </div>
          </div>
          <div className="mt-8 space-y-3">
            <button onClick={handleSetupStart} disabled={!p1Input.trim() || !p2Input.trim()} className={`w-full py-4 rounded-xl font-bold text-xl transition-all ${p1Input.trim()&&p2Input.trim() ? 'bg-gradient-to-r from-red-600 to-blue-600 hover:opacity-90' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}>
              🚀 Start Battle
            </button>
            <button onClick={() => navigate('/teacher/games')} className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition">← Back to Menu</button>
          </div>
          <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
            <p className="text-center text-gray-400 text-sm mb-3">⌨️ Keyboard Controls:</p>
            <div className="flex justify-between">
              <div className="text-red-400 text-sm"><span className="text-xs text-gray-500 block mb-1">Player 1</span><div className="flex gap-1">{['A','S','D','F'].map(k=><span key={k} className="font-mono bg-red-900/50 px-2 py-1 rounded border border-red-800">{k}</span>)}</div></div>
              <div className="text-blue-400 text-sm"><span className="text-xs text-gray-500 block mb-1">Player 2</span><div className="flex gap-1">{['J','K','L',';'].map(k=><span key={k} className="font-mono bg-blue-900/50 px-2 py-1 rounded border border-blue-800">{k}</span>)}</div></div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (gamePhase === 'gameover') {
    const p1Name = gameData?.players?.p1?.name || 'Player 1';
    const p2Name = gameData?.players?.p2?.name || 'Player 2';
    const winner = localScores.p1 > localScores.p2 ? p1Name : localScores.p2 > localScores.p1 ? p2Name : "It's a Draw";
    const winnerEmoji = localScores.p1 > localScores.p2 ? '🔴' : localScores.p2 > localScores.p1 ? '🔵' : '🤝';
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-8">
        <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:200 }} className="text-center glass p-8 md:p-12 rounded-3xl border border-white/10 max-w-2xl w-full">
          <motion.div animate={{ scale:[1,1.2,1], rotate:[0,10,-10,0] }} transition={{ duration:2, repeat:Infinity }} className="text-7xl mb-4">🏆</motion.div>
          <h1 className="text-5xl font-black text-yellow-400 mb-8">Battle Over!</h1>
          <div className="flex justify-center items-center gap-4 md:gap-8 mb-10">
            <div className={`text-center p-4 md:p-6 rounded-xl border-2 flex-1 max-w-[200px] ${localScores.p1 > localScores.p2 ? 'bg-red-900/50 border-red-500 shadow-lg shadow-red-500/30' : 'bg-red-950/30 border-red-900'}`}>
              <div className="text-red-400 text-sm md:text-lg mb-2 truncate">{p1Name}</div>
              <div className="text-5xl md:text-7xl font-bold">{localScores.p1}</div>
            </div>
            <div className="text-3xl md:text-4xl font-bold text-gray-600">VS</div>
            <div className={`text-center p-4 md:p-6 rounded-xl border-2 flex-1 max-w-[200px] ${localScores.p2 > localScores.p1 ? 'bg-blue-900/50 border-blue-500 shadow-lg shadow-blue-500/30' : 'bg-blue-950/30 border-blue-900'}`}>
              <div className="text-blue-400 text-sm md:text-lg mb-2 truncate">{p2Name}</div>
              <div className="text-5xl md:text-7xl font-bold">{localScores.p2}</div>
            </div>
          </div>
          <div className="text-3xl text-green-400 font-bold mb-8">{winnerEmoji} {winner}</div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={playAgain} className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 rounded-xl font-bold text-black transition text-xl shadow-lg shadow-yellow-500/30">🔄 Play Again</button>
            <button onClick={() => navigate('/teacher/games')} className="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition text-xl">← Back to Menu</button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = gameData?.question;
  const p1Name = gameData?.players?.p1?.name || 'Player 1';
  const p2Name = gameData?.players?.p2?.name || 'Player 2';

  if (!currentQuestion) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center"><div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>;

  const getBtnClass = (player, idx) => {
    const pKey = `p${player}`;
    let base = "relative p-3 md:p-4 rounded-xl border-2 text-base md:text-lg font-bold transition-all duration-150 flex flex-col items-center justify-center gap-2 min-h-[80px] ";
    const correctIdx = currentQuestion.correctOptionIndex ?? currentQuestion.correctAnswer;
    if (showResult) {
      if (idx === correctIdx) return base + "bg-green-600 border-green-400 scale-105 shadow-lg shadow-green-500/50";
      if (localStatus[pKey] === 'wrong') return base + "bg-red-900/50 border-red-800 opacity-50";
      return base + "opacity-30";
    }
    if (player === 1) { base += "bg-red-900/40 border-red-700 hover:bg-red-800 hover:border-red-500 text-white "; if (localStatus.p1 !== 'waiting') base += "opacity-50 pointer-events-none "; }
    else { base += "bg-blue-900/40 border-blue-700 hover:bg-blue-800 hover:border-blue-500 text-white "; if (localStatus.p2 !== 'waiting') base += "opacity-50 pointer-events-none "; }
    return base;
  };

  const sBadge = (pKey) => {
    const s = localStatus[pKey];
    if (s === 'correct') return { text: '✓ Correct', cls: 'bg-green-600' };
    if (s === 'wrong') return { text: '✗ Wrong', cls: 'bg-red-600' };
    return { text: '⏳ Waiting', cls: 'bg-gray-700' };
  };
  const p1b = sBadge('p1'); const p2b = sBadge('p2');

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      <div className="w-full bg-slate-900 border-b border-slate-800 flex flex-col justify-center items-center p-4 z-10 relative">
        <div className="absolute top-0 left-0 w-full flex justify-between px-4 pt-3">
          <span className="text-red-400 bg-red-500/10 px-3 py-1 rounded-lg text-sm md:text-lg font-bold">{p1Name}: {localScores.p1}</span>
          <span className="text-gray-400 text-sm md:text-lg self-center">Q {(gameData?.currentQuestionIndex ?? 0)+1}/{gameData?.totalQuestions ?? '?'}</span>
          <span className="text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg text-sm md:text-lg font-bold">{p2Name}: {localScores.p2}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.h2 key={gameData?.currentQuestionIndex} initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }} className="text-xl md:text-3xl font-bold text-center px-4 mt-8 md:mt-4">
            {currentQuestion.question || currentQuestion.text}
          </motion.h2>
        </AnimatePresence>
        <div className="flex gap-4 mt-3">
          <span className={`text-xs px-2 py-1 rounded ${p1b.cls}`}>{p1b.text}</span>
          <span className={`text-xs px-2 py-1 rounded ${p2b.cls}`}>{p2b.text}</span>
        </div>
      </div>
      <div className="flex-1 w-full flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 bg-gradient-to-b from-red-950/30 to-black p-3 md:p-4 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center text-red-400 font-bold mb-2 text-xs md:text-sm uppercase">⌨️ A - S - D - F</div>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {currentQuestion.options.map((opt, idx) => (
                <motion.button key={`p1-${gameData?.currentQuestionIndex}-${idx}`} whileTap={{ scale:0.95 }} onClick={() => handleAction(1, idx)} className={getBtnClass(1, idx)}>
                  <span className="absolute top-1 left-1 bg-white/20 text-xs px-2 rounded font-mono">{['A','S','D','F'][idx]}</span>
                  <span className="text-sm md:text-lg mt-3 text-center leading-tight">{opt}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
        <div className="w-px bg-slate-800 hidden md:block" />
        <div className="w-full md:w-1/2 bg-gradient-to-b from-blue-950/30 to-black p-3 md:p-4 flex items-center justify-center border-t md:border-t-0 border-slate-800">
          <div className="w-full max-w-md">
            <div className="text-center text-blue-400 font-bold mb-2 text-xs md:text-sm uppercase">⌨️ J - K - L - ;</div>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {currentQuestion.options.map((opt, idx) => (
                <motion.button key={`p2-${gameData?.currentQuestionIndex}-${idx}`} whileTap={{ scale:0.95 }} onClick={() => handleAction(2, idx)} className={getBtnClass(2, idx)}>
                  <span className="absolute top-1 left-1 bg-white/20 text-xs px-2 rounded font-mono">{['J','K','L',';'][idx]}</span>
                  <span className="text-sm md:text-lg mt-3 text-center leading-tight">{opt}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BattleArena;
