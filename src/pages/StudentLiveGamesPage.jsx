import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Gamepad2, Flag, Skull, ArrowRight } from 'lucide-react';

function StudentLiveGamesPage() {
  const games = [
    {
      title: 'Team Race',
      description: 'Join your team and race by answering questions correctly.',
      path: '/student/race-player',
      icon: Flag,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Boss Battle',
      description: 'Fight the boss with your team and track live damage.',
      path: '/student/boss-player',
      icon: Skull,
      gradient: 'from-purple-500 to-rose-500',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-white mb-2">Live Games</h1>
        <p className="text-gray-400">Choose a game mode and join using the code from your teacher.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game) => {
          const Icon = game.icon;
          return (
            <motion.div key={game.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${game.gradient} flex items-center justify-center mb-4`}>
                <Icon size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{game.title}</h3>
              <p className="text-gray-400 mb-6">{game.description}</p>
              <Link to={game.path} className="inline-flex items-center gap-2 px-5 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                <Gamepad2 size={18} />
                Join {game.title}
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default StudentLiveGamesPage;
