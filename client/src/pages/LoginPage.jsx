import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Info, AlertCircle, Shield } from 'lucide-react';

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

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-3xl mx-auto p-1 glass-card border border-cyan-400/50 shadow-glass-glow flex items-center justify-center bg-blue-950/80">
          <img src="/nstu-logo.png" alt="NSTU Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">Hello NSTUian Account</h1>
        <p className="text-xs text-slate-400">
          Sign in or register with your NSTU student email to track contributions.
        </p>
      </div>

      {/* Helpful Clarification Banner */}
      <div className="p-3.5 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 flex items-start gap-2.5 text-xs text-cyan-200">
        <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Open Contribution:</strong> Any student can contribute questions directly on the{' '}
          <Link to="/contribute" className="underline font-bold text-white">
            Contribute Page
          </Link>{' '}
          without needing an administrative account!
        </span>
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
            Create Account
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
                  placeholder="e.g. Student Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  NSTU Student ID / Roll (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABC0011222M"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400 font-mono"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              NSTU EduMail *
            </label>
            <input
              type="email"
              required
              placeholder="roll@student.nstu.edu.bd"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
            />
            {isRegister && (
              <p className="text-[11px] text-cyan-400/80 mt-1">Must end with @student.nstu.edu.bd</p>
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
            {loading ? 'Processing...' : isRegister ? 'Create Contributor Account' : 'Sign In'}
          </button>
        </form>
      </div>

      <div className="text-center pt-2">
        <Link
          to="/admin/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Department Administrator or Super Admin? Access Admin Portal</span>
        </Link>
      </div>
    </div>
  );
}
