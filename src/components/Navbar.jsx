import { motion } from 'framer-motion';
import { Bell, Search, LogOut, Home, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthSession, getCurrentUser } from '../utils/auth';

function Navbar() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    clearAuthSession();
    navigate('/auth');
  };

  const handleGoBack = () => {
    // Use browser history to go back
    window.history.back();
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-30 glass border-b border-white/10"
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Search bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search quizzes, students..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={handleGoBack}
              className="p-2 glass rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              title="Go Back"
            >
              <ArrowLeft size={20} className="text-white" />
              <span className="hidden sm:inline text-white">Back</span>
            </button>
            
            <Link 
              to="/" 
              className="p-2 glass rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              title="Back to Home"
            >
              <Home size={20} className="text-white" />
              <span className="hidden sm:inline text-white">Home</span>
            </Link>
            
            <button className="relative p-2 glass rounded-lg hover:bg-white/10 transition-colors">
              <Bell size={20} className="text-white" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
            </button>
            
            <button 
              onClick={handleLogout}
              className="p-2 glass rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              title="Logout"
            >
              <LogOut size={20} className="text-white" />
              <span className="hidden sm:inline text-white">Logout</span>
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{currentUser?.name || 'Guest'}</p>
                <p className="text-xs text-gray-400 capitalize">{currentUser?.role || 'viewer'}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{(currentUser?.name || 'G').slice(0, 2).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;
