import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Users, Skull, Zap, Info, X, CheckCircle, AlertCircle, Target } from 'lucide-react'; // ضفنا أيقونات جديدة

const TeacherGamesHub = () => {
  const [selectedGame, setSelectedGame] = useState(null); // لتخزين اللعبة اللي عايزين نشرحها

  // بيانات الألعاب مع إضافة حقل instructions
  const games = [
    {
      title: "Random Duel",
      description: "Pick 2 random students to compete 1v1 on the screen.",
      icon: Swords,
      link: "/teacher/games/battle-setup",
      color: "from-red-500 to-orange-500",
      status: "Ready",
      instructions: {
        objective: "Two students compete head-to-head to answer questions fastest.",
        steps: [
          "Teacher enters the total number of students in class.",
          "System randomly selects 2 students to duel.",
          "They use the shared computer: Player 1 uses keys (A,S,D,F) and Player 2 uses (J,K,L,;).",
          "First to answer correctly gets the point.",
          "First to reach the score limit wins."
        ],
        tips: "Great for quick engagement and energizing the class."
      }
    },
    {
      title: "Team Race",
      description: "Teams race on a track. First to finish wins!",
      icon: Users,
      link: "/teacher/games/team-setup",
      color: "from-blue-500 to-cyan-500",
      status: "Ready",
      instructions: {
        objective: "Teams compete to advance their car on the race track.",
        steps: [
          "Teacher creates teams and gets a unique code for each team.",
          "Students join on their own devices (tablets/phones).",
          "Every correct answer moves the team's car forward.",
          "Watch the live leaderboard on the main screen.",
          "First team to cross the finish line wins."
        ],
        tips: "Perfect for group collaboration and revision."
      }
    },
    {
      title: "Boss Battle",
      description: "All classes unite to defeat a powerful boss monster!",
      icon: Skull,
      link: "/teacher/games/boss-setup",
      color: "from-purple-600 to-red-600",
      status: "Ready",
      instructions: {
        objective: "Cooperative mode where the whole class fights a Boss.",
        steps: [
          "Teacher selects a Boss (Dragon, Robot, etc.).",
          "Students join teams using their codes.",
          "Correct answers deal damage to the Boss.",
          "Wrong answers cause the Boss to attack the team!",
          "Defeat the Boss before all teams run out of HP."
        ],
        tips: "Encourages teamwork. If one team falls, others can still win."
      }
    }
  ];

  return (
    <div className="p-6 md:p-8 relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Live Classroom Games</h1>
        <p className="text-gray-400 mt-2">Select a game mode to start an interactive session.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game, index) => {
          const Icon = game.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className={`relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full hover:border-slate-600 transition-all flex flex-col`}>
                
                {/* Status Badge */}
                {game.status !== "Ready" && (
                  <span className="absolute top-4 right-4 px-2 py-1 bg-slate-700 text-gray-400 text-xs rounded-full">
                    {game.status}
                  </span>
                )}

                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="text-white" size={28} />
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {game.title}
                </h3>
                <p className="text-gray-400 text-sm mb-6 flex-grow">
                  {game.description}
                </p>

                {/* Buttons Area */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => setSelectedGame(game)}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors text-gray-300"
                  >
                    <Info size={16} />
                    How to Play
                  </button>
                  
                  <Link 
                    to={game.link} 
                    className="flex-1 text-center px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors text-white"
                  >
                    <Zap size={16} />
                    Start
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* --- Instructions Modal --- */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedGame(null)} // Close on backdrop click
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-8 shadow-2xl relative"
              onClick={e => e.stopPropagation()} // Prevent close on card click
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedGame(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedGame.color} flex items-center justify-center`}>
                  <selectedGame.icon className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-white">{selectedGame.title}</h2>
              </div>

              {/* Objective */}
              <div className="mb-6">
                <h3 className="text-sm uppercase tracking-wider text-blue-400 font-semibold mb-2 flex items-center gap-2">
                  <Target size={16} /> Objective
                </h3>
                <p className="text-gray-300">{selectedGame.instructions.objective}</p>
              </div>

              {/* Steps */}
              <div className="mb-6">
                <h3 className="text-sm uppercase tracking-wider text-green-400 font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle size={16} /> How to Play
                </h3>
                <ul className="space-y-3">
                  {selectedGame.instructions.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-400">
                      <span className="bg-slate-800 text-xs font-bold text-white w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                        {i+1}
                      </span>
                      <span className="text-gray-300">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tips */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <h3 className="text-sm uppercase tracking-wider text-yellow-400 font-semibold mb-1 flex items-center gap-2">
                  <AlertCircle size={16} /> Pro Tip
                </h3>
                <p className="text-sm text-yellow-200">{selectedGame.instructions.tips}</p>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setSelectedGame(null)}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-white transition-colors"
                >
                  Cancel
                </button>
                <Link 
                  to={selectedGame.link}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold text-center hover:opacity-90 transition-opacity"
                >
                  Start Game
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeacherGamesHub;