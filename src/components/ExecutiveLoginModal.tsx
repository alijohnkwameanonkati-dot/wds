import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Lock,
  ShieldCheck,
  Mail,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';

interface ExecutiveLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExecutiveLoginModal: React.FC<ExecutiveLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    loginWithGoogle,
    loginWithEmail,
    sendAdminPasswordReset,
    authError,
    clearAuthError,
    isAdmin,
    authLoading,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [resetSentMsg, setResetSentMsg] = useState('');

  useEffect(() => {
    if (isOpen && isAdmin) {
      onSuccess();
      onClose();
    }
  }, [isOpen, isAdmin, onSuccess, onClose]);

  if (!isOpen) return null;

  const displayError = localError || authError;

  const handleGoogleSignIn = async () => {
    setLocalError('');
    clearAuthError();
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearAuthError();

    if (!email.trim() || !password) {
      setLocalError('Please enter both your administrator email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const ok = await loginWithEmail(email, password);
      if (ok) {
        setPassword('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setResetSentMsg('');
    clearAuthError();

    if (!email.trim()) {
      setLocalError('Please enter your administrator email address.');
      return;
    }

    setSubmitting(true);
    try {
      await sendAdminPasswordReset(email);
      setResetSentMsg(
        `Password reset instructions have been dispatched to ${email.trim()} if an authorized account exists.`
      );
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to send reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111622]/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#111622] text-white p-6 relative border-b border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => {
              clearAuthError();
              setLocalError('');
              setResetSentMsg('');
              onClose();
            }}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-lg cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 pr-8">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-crest font-bold text-lg text-white leading-tight">
                Authorized Admin Sign-In
              </h3>
              <p className="text-xs text-stone-300 font-serif-literary">
                Our Lady of Grace Senior High School (OLAG) • WDS
              </p>
            </div>
          </div>

          <div className="mt-3.5 p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-stone-300 leading-relaxed">
            <strong className="text-amber-300">Public Access Notice:</strong> Students never sign in or create accounts. This gateway is verified strictly for authorized WDS Super Admins, Editors, and Moderators.
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {displayError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{displayError}</span>
            </div>
          )}

          {resetSentMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{resetSentMsg}</span>
            </div>
          )}

          {mode === 'signin' ? (
            <>
              {/* Google Sign-In */}
              <button
                type="button"
                disabled={submitting || authLoading}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF8F3] border border-stone-300 rounded-xl text-xs font-bold text-[#111622] transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>{submitting ? 'Verifying Credentials...' : 'Continue with Authorized Google Account'}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200" />
                <span className="flex-shrink mx-3 text-[10px] font-mono uppercase tracking-widest text-stone-400">
                  Or Sign In With Email
                </span>
                <div className="flex-grow border-t border-stone-200" />
              </div>

              <form onSubmit={handleEmailSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#111622] mb-1">
                    Administrator Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="authorized.admin@olag.edu.gh"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 bg-[#FAF8F3]/50 focus:bg-white text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#111622]">Password *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('reset');
                        setLocalError('');
                        setResetSentMsg('');
                      }}
                      className="text-[11px] font-semibold text-amber-700 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your Firebase Auth password"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 bg-[#FAF8F3]/50 focus:bg-white text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || authLoading}
                  className="w-full py-2.5 bg-[#111622] hover:bg-[#1a2234] disabled:opacity-60 text-amber-300 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submitting ? 'Signing In...' : 'Sign In to Admin Suite'}</span>
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <p className="text-xs text-stone-600 leading-relaxed">
                Enter your authorized administrator email address to receive a Firebase password reset link.
              </p>
              <div>
                <label className="block text-xs font-bold text-[#111622] mb-1">
                  Administrator Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="authorized.admin@olag.edu.gh"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 bg-[#FAF8F3]/50 focus:bg-white text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[#111622] hover:bg-[#1a2234] disabled:opacity-60 text-amber-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {submitting ? 'Sending Reset Link...' : 'Send Password Reset Email'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setLocalError('');
                  setResetSentMsg('');
                }}
                className="w-full py-2 text-xs font-semibold text-stone-600 hover:text-[#111622] flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
