import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Upload, 
  Trophy, 
  BarChart3, 
  Menu, 
  X,
  User,
  LogOut, // 1. استيراد الأيقونة
  Gamepad2
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // 2. استيراد useNavigate
import { clearAuthSession, getCurrentUser } from '../utils/auth';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher' },
  { icon: FileText, label: 'Create Quiz', path: '/teacher/create-quiz' },
  { icon: Upload, label: 'Upload PDF', path: '/teacher/upload-pdf' },
  { icon: BarChart3, label: 'Results', path: '/teacher/results' },
  { icon: Trophy, label: 'Tournament', path: '/teacher/tournament' },
  { icon: Gamepad2, label: 'Live Games', path: '/teacher/games' },
];

function Sidebar({ isOpen = true, setIsOpen }) {
  const location = useLocation();
  const navigate = useNavigate(); // 3. تعريف الـ navigate

  // 4. جلب بيانات المستخدم
  const user = getCurrentUser() || { name: 'Guest', role: 'Teacher' };

  // 5. دالة تسجيل الخروج
  const handleLogout = () => {
    clearAuthSession();
    navigate('/auth'); // يرجعه لصفحة اللوجين
  };

  const toggleSidebar = () => setIsOpen && setIsOpen(!isOpen);
  const isTeacherPage = location.pathname.startsWith('/teacher');

  return (
    <>
      {/* Mobile menu button */}
      {isTeacherPage && (
        <button
          onClick={toggleSidebar}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 glass rounded-lg orange-glow"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: 0 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-full w-72 glass border-r border-white/10 z-40 lg:translate-x-0 lg:static lg:z-0 flex flex-col" // Added flex flex-col
      >
        <div className="p-6 flex-1"> {/* flex-1 to push footer down */}
          {/* User Info */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div>
              {/* 6. عرض الاسم الحقيقي */}
              <h2 className="text-xl font-bold text-white truncate">{user.name}</h2>
              <p className="text-sm text-gray-400">{user.role}</p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={index}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setIsOpen(false);
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-orange-500/20 text-orange-400 border-l-4 border-orange-500'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Button - في الأسفل */}
        <div className="p-6 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}

export default Sidebar;