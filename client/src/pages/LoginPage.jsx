import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Shield, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(email.trim(), password, displayName.trim(), studentId.trim());
      } else {
        await login(email.trim(), password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo 1-Click Fast Logins
  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, demoPassword);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-3xl mx-auto p-1 glass-card border border-cyan-400/50 shadow-glass-glow flex items-center justify-center bg-blue-950/80">
          <img src="/iit-crest.jpeg" alt="NSTU" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">Hello NSTUian</h1>
        <p className="text-xs text-slate-400">
          Sign in with your verified NSTU EduMail to contribute and manage examination papers.
        </p>
      </div>

      {/* Quick Demo Login Credentials Bar */}
      <div className="rounded-2xl glass-card p-4 border border-cyan-500/30 space-y-2 bg-gradient-to-r from-blue-950/60 to-cyan-950/40">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quick Testing Roles (1-Click Sign In)</span>
        </div>
        <div className="grid grid-cols-1 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleQuickLogin('superadmin@nstu.edu.bd', 'NstuAdmin@2026')}
            className="w-full py-1.5 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center justify-between transition-all cursor-pointer"
          >
            <span>👑 Super Admin</span>
            <span className="font-mono text-[10px] text-purple-300">Global Access</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('iitadmin@nstu.edu.bd', 'NstuAdmin@2026')}
            className="w-full py-1.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center justify-between transition-all cursor-pointer"
          >
            <span>🛡️ IIT Dept Admin</span>
            <span className="font-mono text-[10px] text-cyan-300">Dept 25 Scoped</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('ash2325006m@nstu.edu.bd', 'Student@2026')}
            className="w-full py-1.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-between transition-all cursor-pointer"
          >
            <span>🎓 Student Contributor</span>
            <span className="font-mono text-[10px] text-emerald-300">Verified EduMail</span>
          </button>
        </div>
      </div>

      {/* Auth Card */}
      <div className="rounded-3xl glass-panel border border-cyan-400/30 p-6 sm:p-8 bg-[#0a1226]/95 shadow-2xl space-y-6">
        {/* Toggle Mode */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/40 border border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError('');
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              !isRegister ? 'bg-cyan-500 text-white shadow-glass-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError('');
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              isRegister ? 'bg-cyan-500 text-white shadow-glass-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register EduMail
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-xs text-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ashraful Islam"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  NSTU Student ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ASH2325006M"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400 font-mono"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Official NSTU EduMail *
            </label>
            <input
              type="email"
              required
              placeholder="username@nstu.edu.bd"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
            />
            {isRegister && (
              <p className="text-[11px] text-cyan-400/80 mt-1">Must end with @nstu.edu.bd</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-glass-glow disabled:opacity-50 transition-all cursor-pointer mt-2"
          >
            {loading ? 'Processing...' : isRegister ? 'Create Verified Contributor Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
