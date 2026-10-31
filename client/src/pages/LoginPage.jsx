import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Info, AlertCircle, Shield, CheckCircle2, KeyRound, ArrowLeft, Mail, RefreshCw, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [verifyEmailAddress, setVerifyEmailAddress] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const { login, register, verifyEmail, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await register(email.trim(), password, displayName.trim(), studentId.trim());
        setIsVerifying(true);
        setVerifyEmailAddress(email.trim());
        setGeneratedCode(res.verificationCode || '');
        setSuccessMsg(res.message || 'Account registered! Please enter the 6-digit OTP verification code below to verify your EduMail.');
        return;
      } else {
        await login(email.trim(), password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      if (
        err.status === 403 ||
        err.message?.toLowerCase().includes('verification') ||
        err.message?.toLowerCase().includes('unverified')
      ) {
        setIsVerifying(true);
        setVerifyEmailAddress(email.trim());
        if (err.data?.verificationCode) {
          setGeneratedCode(err.data.verificationCode);
        }
        setError(err.message || 'Your account requires email verification. Please enter the OTP code.');
      } else {
        setError(err.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!verifyEmailAddress) return;
    setResending(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await resendOtp(verifyEmailAddress);
      setGeneratedCode(res.verificationCode || '');
      setSuccessMsg(res.message || 'A new verification code has been generated and sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyEmail(verifyEmailAddress, verifyCode.trim(), studentId.trim());
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your verification code.');
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
      {!isVerifying && (
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
      )}

      {/* Auth Card */}
      <div className="rounded-3xl glass-panel border border-cyan-400/30 p-6 sm:p-8 bg-[#0a1226]/95 shadow-2xl space-y-6">
        {isVerifying ? (
          /* EduMail Verification Screen */
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mx-auto text-cyan-300">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">Verify Your NSTU EduMail</h2>
              <p className="text-xs text-slate-300">
                We sent a 6-digit verification code to:
                <br />
                <span className="font-mono text-cyan-300 font-bold">{verifyEmailAddress}</span>
              </p>
            </div>

            {generatedCode && (
              <div className="p-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-center space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                  Verification Code
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-mono font-extrabold tracking-widest text-cyan-300">
                    {generatedCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => setVerifyCode(generatedCode)}
                    className="text-[10px] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/40 font-semibold cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  6-Digit Verification Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  className="w-full p-3 rounded-xl glass-input text-center text-lg font-mono tracking-widest text-white placeholder-slate-500 focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-slate-400">Didn't receive code?</span>
                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResendOtp}
                  className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer disabled:opacity-50"
                >
                  {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>{resending ? 'Sending...' : 'Resend OTP Code'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !verifyCode.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Verify EduMail & Activate Account'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsVerifying(false);
                  setError('');
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors py-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </form>
          </div>
        ) : (
          <>
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
          </>
        )}
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
