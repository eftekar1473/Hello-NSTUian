import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Lock } from 'lucide-react';

export default function VerifyAdminPage() {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [roll, setRoll] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.verifyDeptAdmin({
        email: email.trim(),
        roll: roll.trim(),
      });
      setSuccess(true);
      setMessage(res.message || 'Department Admin account verified successfully! You can now log in.');
    } catch (err) {
      setError(err.message || 'Verification failed. Please ensure the EduMail matches your assigned account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-3xl mx-auto p-2 glass-card border border-emerald-400/50 shadow-[0_0_25px_rgba(16,185,129,0.25)] flex items-center justify-center bg-[#0d1e1c]">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">Department Admin Verification</h1>
        <p className="text-xs text-slate-400">
          Verify your official NSTU EduMail to activate your Department Administrator account.
        </p>
      </div>

      <div className="rounded-3xl glass-panel border border-emerald-500/30 p-6 sm:p-8 bg-[#091522]/95 shadow-2xl space-y-5">
        {success ? (
          <div className="space-y-4 text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">EduMail Successfully Verified!</h3>
            <p className="text-xs text-slate-300">{message}</p>
            <div className="pt-2">
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Go to Admin Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Your EduMail *
              </label>
              <input
                type="email"
                required
                placeholder="roll@student.nstu.edu.bd"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400 border-emerald-500/30 focus:border-emerald-400"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Enter the EduMail specified by the Super Administrator.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Your Student Roll / ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ABC0011222M"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400 font-mono border-emerald-500/30 focus:border-emerald-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-md disabled:opacity-50 transition-all cursor-pointer mt-2"
            >
              {loading ? 'Verifying...' : 'Verify EduMail & Activate Account'}
            </button>
          </form>
        )}
      </div>

      <div className="text-center">
        <Link
          to="/admin/login"
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Already verified? Sign in to Admin Portal →
        </Link>
      </div>
    </div>
  );
}
