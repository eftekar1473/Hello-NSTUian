import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, AlertCircle, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email.trim(), password);
      // Verify that the user has admin rights
      const permissions = res?.user?.admin_permissions || [];
      const hasAdmin = permissions.some((p) => p.role === 'SUPER_ADMIN' || p.role === 'DEPARTMENT_ADMIN');
      if (!hasAdmin) {
        throw new Error('Access denied. This account does not possess Department or Super Admin privileges.');
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick dev switch for admin testing
  const handleQuickAdminLogin = async (adminEmail, adminPass) => {
    setError('');
    setLoading(true);
    try {
      await login(adminEmail, adminPass);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14 space-y-6">
      {/* Brand & Portal Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-3xl mx-auto p-2 glass-card border border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.25)] flex items-center justify-center bg-[#130f2e]">
          <Shield className="w-8 h-8 text-amber-400" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-400/30 uppercase tracking-wider">
          <Lock className="w-3 h-3" />
          <span>Restricted Admin Portal</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">Administrative Sign In</h1>
        <p className="text-xs text-slate-400">
          Secure access for NSTU Department Administrators and Super Administrators.
        </p>
      </div>

      {/* Admin Auth Form */}
      <div className="rounded-3xl glass-panel border border-amber-500/30 p-6 sm:p-8 bg-[#0d122b]/95 shadow-2xl space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-500/30 text-xs text-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <span>{error}</span>
              {error.toLowerCase().includes('verification') && (
                <div className="mt-2">
                  <Link
                    to="/verify-admin"
                    className="underline font-bold text-cyan-300 hover:text-white"
                  >
                    Click here to verify your Department Admin EduMail
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admin EduMail *
            </label>
            <input
              type="email"
              required
              placeholder="admin@student.nstu.edu.bd"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400 border-amber-500/30 focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              placeholder="Password given by Super Admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400 border-amber-500/30 focus:border-amber-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              For Department Admins: use the password configured by your Super Administrator.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-md disabled:opacity-50 transition-all cursor-pointer mt-2"
          >
            {loading ? 'Authenticating Admin...' : 'Enter Admin Dashboard'}
          </button>
        </form>

        {/* Quick Testing Admin Accounts for convenience */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300/80 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Developer Fast Switch</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickAdminLogin('iitadmin@nstu.edu.bd', 'NstuAdmin@2026')}
              className="py-1.5 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium text-left truncate cursor-pointer"
            >
              Dept Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdminLogin('superadmin@nstu.edu.bd', 'NstuAdmin@2026')}
              className="py-1.5 px-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[11px] font-medium text-left truncate cursor-pointer"
            >
              Super Admin
            </button>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Hello NSTUian Home</span>
        </Link>
      </div>
    </div>
  );
}
