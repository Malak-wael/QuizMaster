import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogIn, UserPlus, GraduationCap, Users, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { getCurrentUser, setAuthSession } from "../utils/auth";

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [parentWhatsapp, setParentWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    redirectUser(user);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !password) {
      toast.error("Please fill all fields");
      return;
    }
    if (role === "student" && !parentWhatsapp.trim()) {
      toast.error("رقم واتساب ولي الأمر مطلوب");
      return;
    }

    try {
      setLoading(true);
      const payload = { name, password, role };
      if (role === "student") {
        payload.parentWhatsapp = parentWhatsapp.trim();
      }
      const response = await api.post("/auth/register", payload);
      setAuthSession(response.data.token, response.data.user);
      toast.success("Account created successfully!");
      redirectUser(response.data.user);
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!name || !password) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/login", { name, password });
      setAuthSession(response.data.token, response.data.user);
      toast.success(`Welcome back, ${response.data.user.name}!`);
      redirectUser(response.data.user);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (user) => {
    if (user.role === "teacher") {
      navigate("/teacher");
    } else {
      navigate("/student/join");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full filter blur-[150px] opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full filter blur-[150px] opacity-20 translate-x-1/2 translate-y-1/2"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-orange-400 to-emerald-400 mb-2">
            QUIZ MASTER
          </h1>
          <p className="text-gray-400">Enter the classroom of the future</p>
        </div>

        {/* Card */}
        <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl">
          
          {/* Tabs */}
          <div className="flex mb-6 bg-slate-800/50 p-1 rounded-xl">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${isLogin ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${!isLogin ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder={isLogin ? "teacher1 or student1" : "Choose a username"}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Role Selection (Only for Register) */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm text-gray-400 mb-2">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all
                        ${role === "student" 
                          ? 'border-blue-500 bg-blue-500/10 text-white' 
                          : 'border-slate-700 text-gray-400 hover:border-slate-500'}`}
                    >
                      <Users size={24} />
                      <span className="text-sm font-semibold">Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("teacher")}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all
                        ${role === "teacher" 
                          ? 'border-purple-500 bg-purple-500/10 text-white' 
                          : 'border-slate-700 text-gray-400 hover:border-slate-500'}`}
                    >
                      <GraduationCap size={24} />
                      <span className="text-sm font-semibold">Teacher</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Parent's WhatsApp (Only for Register + Student) */}
            <AnimatePresence>
              {!isLogin && role === "student" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm text-gray-400 mb-1" dir="rtl">
                    رقم واتساب ولي الأمر
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="tel"
                      value={parentWhatsapp}
                      onChange={(e) => setParentWhatsapp(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="01012345678 or +201012345678"
                      dir="ltr"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1" dir="rtl">
                    سيتم استخدامه لإرسال نتائج الاختبارات إلى ولي الأمر عبر واتساب.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-gradient-to-r from-orange-500 to-purple-500 text-white rounded-lg hover:from-orange-600 hover:to-purple-600  transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                "Please wait..."
              ) : isLogin ? (
                <>Login <LogIn size={20} /></>
              ) : (
                <>Create Account <UserPlus size={20} /></>
              )}
            </button>
          </form>

          {/* Quick Access for Testing */}
          <div className="mt-6 pt-6 border-t border-slate-700 text-center text-xs text-gray-500">
            <p>Just want to look around?</p>
            <div className="flex justify-center gap-4 mt-2">
                <button onClick={() => { setName("teacher1"); setPassword("password123"); setIsLogin(true); }} className="text-purple-400 hover:underline">Use Teacher Demo</button>
                <span>|</span>
                <button onClick={() => { setName("student1"); setPassword("password123"); setIsLogin(true); }} className="text-blue-400 hover:underline">Use Student Demo</button>
            </div>
                <button onClick={() => navigate('/home')} className="text-orange-400 hover:underline">Maybe Login Later</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
