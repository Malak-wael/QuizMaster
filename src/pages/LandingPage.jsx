import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Trophy, 
  Zap, 
  Brain, 
  Target,
  ArrowRight,
  Star,
  CheckCircle,
  User
} from 'lucide-react';

function LandingPage() {
  const [activeSection, setActiveSection] = useState('features');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userRole, setUserRole] = useState('');

  const navigate = useNavigate();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  const handleAuth = (role) => {
    setUserRole(role);
    setShowAuthModal(false);
    // Navigate to appropriate dashboard
    if (role === 'teacher') {
      window.location.href = '/teacher';
    } else if (role === 'student') {
      window.location.href = '/student/join';
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-72 glass border-r border-white/10 z-40 overflow-y-auto scrollbar-hide">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Guest </h2>
              <p className="text-sm text-gray-400">Teacher</p>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-2 mb-8">
            <button
              onClick={() => scrollToSection('features')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                activeSection === 'features' 
                  ? 'bg-orange-500/20 text-orange-400 border-r-4 border-orange-500' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                activeSection === 'how-it-works' 
                  ? 'bg-orange-500/20 text-orange-400 border-r-4 border-orange-500' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('roles')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                activeSection === 'roles' 
                  ? 'bg-orange-500/20 text-orange-400 border-r-4 border-orange-500' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Teacher vs Student
            </button>
          </div>

          {/* Quick Access */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Access</h3>
            <div className="space-y-3">
              <Link
                to="/teacher"
                className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                <span>👨‍🏫</span>
                Teacher Dashboard
              </Link>
              <Link
                to="/student/join"
                className="w-full px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
              >
                <span>👨‍🎓</span>
                Student Join
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="border-t border-white/10 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Platform Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Active Users</span>
                <span className="text-emerald-400 font-semibold">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Quizzes</span>
                <span className="text-orange-400 font-semibold">567</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Completed</span>
                <span className="text-purple-400 font-semibold">8,901</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Header */}
      <div className="fixed top-0 left-72 right-0 z-50 glass border-b border-white/10">
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Platform Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">Q</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">QuizMaster</h1>
              <p className="text-sm text-gray-400">Interactive Learning Platform</p>
            </div>
          </div>

          {/* User Area */}
          <div className="flex items-center gap-4">
            {userRole ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-gray-400">Welcome back</p>
                  <p className="font-semibold text-white">{userRole === 'teacher' ? 'Teacher' : 'Student'}</p>
                </div>
                <button 
                  onClick={() => setUserRole('')}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
              onClick={() => navigate('/')} // هيروح لصفحة اللوجين (AuthPage) اللي هي الـ Root (/)
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-purple-500 text-white rounded-lg hover:from-orange-600 hover:to-purple-600 transition-all flex items-center gap-2"
              >
                <User size={20} />
                Login / Register
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-orange-900/20 to-emerald-900/20"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-6 max-w-6xl mx-auto"
        >
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(139, 92, 246, 0.5)",
                "0 0 40px rgba(139, 92, 246, 0.8)",
                "0 0 20px rgba(139, 92, 246, 0.5)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-6"
          >
            <span className="px-4 py-2 glass rounded-full text-purple-400 font-semibold">
              Next-Gen Quiz Platform
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-orange-400 to-emerald-400 bg-clip-text text-transparent"
          >
            Transform Learning
            <br />
            Into Adventure
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            Engage students with interactive quizzes, AI-powered questions, 
            and exciting tournaments. Make learning fun and effective.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/teacher"
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2 orange-glow"
            >
              Start as Teacher
              <ArrowRight size={20} />
            </Link>
            
            <Link
              to="/student/join"
              className="px-8 py-4 glass glass-hover text-white font-bold rounded-xl flex items-center justify-center gap-2"
            >
              Join as Student
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </motion.div>

        {/* Floating elements */}
        <motion.div
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-20 left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{ y: [20, -20, 20] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute bottom-20 right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-xl"
        />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
              Why Choose QuizMaster?
            </h2>
            <p className="text-xl text-gray-300">
              Everything you need to create engaging learning experiences
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI-Powered Questions",
                description: "Generate questions automatically from PDFs and documents",
                color: "purple"
              },
              {
                icon: Trophy,
                title: "Tournament Mode",
                description: "Competitive bracket-style competitions for students",
                color: "orange"
              },
              {
                icon: Users,
                title: "Real-time Collaboration",
                description: "Live quizzes with instant feedback and results",
                color: "emerald"
              },
              {
                icon: Target,
                title: "Detailed Analytics",
                description: "Track progress and identify areas for improvement",
                color: "purple"
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Optimized performance for seamless experience",
                color: "orange"
              },
              {
                icon: BookOpen,
                title: "Rich Content",
                description: "Support for multiple question types and media",
                color: "emerald"
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-2xl p-8 card-hover group"
                >
                  <div className={`w-16 h-16 bg-${feature.color}-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon size={32} className={`text-${feature.color}-400`} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-gray-300">
              Get started in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Account",
                description: "Sign up as teacher or student in seconds",
                features: ["Free registration", "No credit card required", "Instant access"]
              },
              {
                step: "02",
                title: "Create or Join",
                description: "Teachers create quizzes, students join with code",
                features: ["AI question generation", "Custom quizzes", "PDF import"]
              },
              {
                step: "03",
                title: "Learn & Compete",
                description: "Take quizzes and track your progress",
                features: ["Real-time results", "Leaderboards", "Achievements"]
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="glass rounded-2xl p-8 card-hover">
                  <div className="text-6xl font-bold text-purple-400/20 mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-300 mb-6">
                    {step.description}
                  </p>
                  <ul className="space-y-2">
                    {step.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-400">
                        <CheckCircle size={16} className="text-emerald-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-emerald-400 bg-clip-text text-transparent">
              Choose Your Role
            </h2>
            <p className="text-xl text-gray-300">
              Different experiences for teachers and students
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-8 card-hover border-orange-500/20"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Users size={32} className="text-orange-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white">Teacher</h3>
                  <p className="text-orange-400">Create & Manage</p>
                </div>
              </div>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-2">
                  <Star size={16} className="text-orange-400" />
                  Create unlimited quizzes
                </li>
                <li className="flex items-center gap-2">
                  <Star size={16} className="text-orange-400" />
                  Upload PDFs for AI questions
                </li>
                <li className="flex items-center gap-2">
                  <Star size={16} className="text-orange-400" />
                  Track student progress
                </li>
                <li className="flex items-center gap-2">
                  <Star size={16} className="text-orange-400" />
                  Organize tournaments
                </li>
              </ul>
              <Link
                to="/teacher"
                className="mt-6 w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                Start Teaching
                <ArrowRight size={20} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-8 card-hover border-emerald-500/20"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <BookOpen size={32} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white">Student</h3>
                  <p className="text-emerald-400">Learn & Compete</p>
                </div>
              </div>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-2">
                  <Star size={16} className="text-emerald-400" />
                  Join quizzes with codes
                </li>
                <li className="flex items-center gap-2">
                  <Star size={16} className="text-emerald-400" />
                  Real-time feedback
                </li>
                <li className="flex items-center gap-2">
                  <Star size={16} className="text-emerald-400" />
                  Compete in tournaments
                </li>
                <li className="flex items-center gap-2">
                  <Star size={16} className="text-emerald-400" />
                  Track your progress
                </li>
              </ul>
              <Link
                to="/student/join"
                className="mt-6 w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
              >
                Start Learning
                <ArrowRight size={20} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-orange-400 to-emerald-400 bg-clip-text text-transparent mb-4">
              QuizMaster Platform
            </h2>
            <p className="text-gray-400">
              Transforming education through interactive learning experiences
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-gray-400">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Features</a>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
          
          <div className="mt-8 text-gray-500">
            2024 QuizMaster. All rights reserved.
          </div>
        </div>
      </footer>
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <User size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to QuizMaster</h2>
                <p className="text-gray-300 mb-6">Choose your role to get started</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleAuth('teacher')}
                  className="w-full px-6 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-3"
                >
                  <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👨‍🏫</span>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold">I'm a Teacher</div>
                    <p className="text-sm text-gray-300">Create quizzes, manage students, track progress</p>
                  </div>
                </button>

                <button
                  onClick={() => handleAuth('student')}
                  className="w-full px-6 py-4 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"
                >
                  <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👨‍🎓</span>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold">I'm a Student</div>
                    <p className="text-sm text-gray-300">Join quizzes, compete, learn effectively</p>
                  </div>
                </button>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LandingPage;
