import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Hash, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { validateEmail, sanitizeInput } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const showSetPassword = searchParams.get('setPassword') === '1';

  const [loginMode, setLoginMode] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailOtpSubmitting, setEmailOtpSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordSubmitting, setForgotPasswordSubmitting] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);

  const { currentUser, supabase, ensureProfile, signInWithOtpEmail, verifyOtpEmail, signInWithPassword, signInWithGoogle, resetPassword } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.id && ensureProfile && showSetPassword) {
      ensureProfile(currentUser);
    }
  }, [currentUser, ensureProfile, showSetPassword]);

  // Already logged in and not on set-password step -> go to dashboard (e.g. user clicked Login link while signed in)
  useEffect(() => {
    if (currentUser?.id && !showSetPassword) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser?.id, showSetPassword, navigate]);

  const handleSendEmailOtp = async (e) => {
    e.preventDefault();
    setEmailError('');
    const trimmed = sanitizeInput(email).toLowerCase().trim();
    if (!trimmed) {
      setEmailError('Enter your email address');
      return;
    }
    if (!validateEmail(trimmed)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setEmailSubmitting(true);
    try {
      await signInWithOtpEmail(trimmed);
      setEmailOtpSent(true);
      setEmailOtp('');
      toast({ title: 'OTP sent', description: 'Check your email (from info@ahnupha.com) for the 6-digit code.', duration: 5000 });
    } catch (err) {
      const errMsg = err.message || 'Could not send OTP.';
      setEmailError(errMsg);
      toast({ title: 'OTP failed', description: errMsg, variant: 'destructive' });
    } finally {
      setEmailSubmitting(false);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    const code = String(emailOtp).replace(/\D/g, '').trim();
    if (code.length !== 6) {
      toast({ title: 'Invalid OTP', description: 'Enter the 6-digit code from your email', variant: 'destructive' });
      return;
    }
    setEmailOtpSubmitting(true);
    try {
      await verifyOtpEmail(email, code);
      toast({ title: 'Signed in!', description: 'Taking you to your orders.' });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast({ title: 'Verification failed', description: err.message || 'Invalid or expired OTP. Request a new one.', variant: 'destructive' });
    } finally {
      setEmailOtpSubmitting(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    const trimmed = sanitizeInput(email).toLowerCase().trim();
    if (!trimmed || !validateEmail(trimmed)) {
      setEmailError('Enter a valid email');
      return;
    }
    if (!password || password.length < 6) {
      setPasswordError('Enter your password (min 6 characters)');
      return;
    }
    setPasswordSubmitting(true);
    try {
      await signInWithPassword(trimmed, password);
      toast({ title: 'Welcome back!', description: "You're signed in." });
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('invalid') || msg.includes('credentials')) {
        setPasswordError('Wrong email or password. Try OTP instead?');
      } else {
        setPasswordError(err.message || 'Sign in failed. Try OTP?');
      }
      toast({ title: "Couldn't sign in", description: 'Wrong email or password. Use OTP for a quick sign in.', variant: 'destructive' });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleSuccessNavigate = () => navigate('/dashboard');

  const handleSetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: 'Password too short', description: 'Use at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Passwords don't match", description: 'Please re-enter.', variant: 'destructive' });
      return;
    }
    setSetPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Password set', description: "You can use it next time to sign in.", duration: 3000 });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast({ title: 'Could not set password', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSetPasswordLoading(false);
    }
  };

  const handleSetPasswordSkip = () => {
    navigate('/dashboard', { replace: true });
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    const trimmed = sanitizeInput(email).toLowerCase().trim();
    if (!trimmed || !validateEmail(trimmed)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setForgotPasswordSubmitting(true);
    try {
      await resetPassword(trimmed);
      toast({ title: 'Reset link sent', description: 'Check your email for the password reset link.', duration: 5000 });
      setShowForgotPassword(false);
    } catch (err) {
      setEmailError(err.message || 'Could not send reset link.');
      toast({ title: 'Failed to send', description: err.message || 'Try again or use the Email tab to sign in with a code.', variant: 'destructive' });
    } finally {
      setForgotPasswordSubmitting(false);
    }
  };

  if (showSetPassword && currentUser) {
    return (
      <div className="min-h-[80vh] sm:min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-rose-50/20 to-amber-50/20 px-3 sm:px-4 py-6 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/95 backdrop-blur-md p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-gray-100/50"
        >
          <div className="text-center mb-5 sm:mb-6">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-rose-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Create a password</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Use it next time to sign in quickly. You can skip and set it later.</p>
          </div>
          <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="min-h-[48px] h-11 text-base"
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <Input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter password"
                className="min-h-[48px] h-11 text-base"
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full min-h-[48px] h-11 bg-rose-600 hover:bg-rose-700 touch-manipulation" disabled={setPasswordLoading}>
              {setPasswordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Save & continue</>}
            </Button>
            <button type="button" onClick={handleSetPasswordSkip} className="w-full min-h-[44px] py-2 text-sm text-gray-500 hover:text-gray-700 touch-manipulation">
              Skip for now
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (showSetPassword && !currentUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] sm:min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-rose-50/20 to-amber-50/20 px-3 sm:px-4 py-6 sm:py-12 relative overflow-x-hidden">
      <div className="absolute top-20 right-20 w-32 h-32 bg-rose-200/20 rounded-full blur-2xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-40 h-40 bg-amber-200/20 rounded-full blur-2xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/95 backdrop-blur-md p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-gray-100/50 relative z-10"
      >
        <div className="text-center mb-4 sm:mb-5">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Quick sign in</h2>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">New? No lengthy signup – enter email, get a code, you're in</p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full min-h-[48px] sm:h-12 rounded-xl border-2 border-gray-200 hover:bg-gray-50 mb-4 font-semibold touch-manipulation"
          onClick={() => signInWithGoogle().catch((err) => toast({ title: 'Google sign-in failed', description: err?.message || 'Try another method.', variant: 'destructive' }))}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or</span></div>
        </div>

        <div className="flex rounded-xl bg-gray-100 p-1 mb-5" role="tablist" aria-label="Sign in method">
          <button
            type="button"
            role="tab"
            aria-selected={loginMode === 'email'}
            onClick={() => { setLoginMode('email'); setEmailOtpSent(false); setEmailError(''); setPasswordError(''); }}
            className={`flex-1 min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all touch-manipulation ${loginMode === 'email' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900 active:bg-gray-200'}`}
          >
            Email
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={loginMode === 'password'}
            onClick={() => { setLoginMode('password'); setEmailOtpSent(false); setShowForgotPassword(false); setEmailError(''); setPasswordError(''); }}
            className={`flex-1 min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all touch-manipulation ${loginMode === 'password' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900 active:bg-gray-200'}`}
          >
            Password
          </button>
        </div>

        <AnimatePresence mode="wait">
          {loginMode === 'email' ? (
            <motion.div key="email" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
              {!emailOtpSent ? (
                <form onSubmit={handleSendEmailOtp} className="space-y-4">
                  <div>
                    <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-rose-500" />
                      Email address
                    </label>
                    <Input
                      id="login-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(sanitizeInput(e.target.value)); setEmailError(''); }}
                      placeholder="you@example.com"
                      className={`min-h-[48px] h-12 pl-10 rounded-xl border-2 text-base ${emailError ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    <p className="text-xs text-gray-500 mt-1.5">One-time code. New users get an account in seconds.</p>
                    {emailError && <p className="mt-2 text-sm text-red-600">{emailError}</p>}
                  </div>
                  <Button type="submit" className="w-full min-h-[48px] h-12 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold rounded-xl touch-manipulation" disabled={emailSubmitting || !validateEmail(email)}>
                    {emailSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP...</> : 'Send OTP'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                  <div>
                    <label htmlFor="login-email-otp" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-rose-500" />
                      Enter OTP
                    </label>
                    <Input
                      id="login-email-otp"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onPaste={(e) => {
                        const pasted = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
                        if (pasted) {
                          e.preventDefault();
                          setEmailOtp(pasted);
                        }
                      }}
                      placeholder="6-digit code from email"
                      className="min-h-[48px] h-12 pl-10 rounded-xl border-2 border-gray-200 text-lg tracking-widest"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">Code sent to {email} from info@ahnupha.com. Enter it above to sign in.</p>
                  </div>
                  <Button type="submit" className="w-full min-h-[48px] h-12 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold rounded-xl touch-manipulation" disabled={emailOtpSubmitting || emailOtp.replace(/\D/g, '').length !== 6}>
                    {emailOtpSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : 'Verify & Continue'}
                  </Button>
                  <button type="button" onClick={() => { setEmailOtpSent(false); setEmailOtp(''); }} className="w-full min-h-[44px] py-2 text-sm text-rose-600 hover:text-rose-700 font-medium touch-manipulation">
                    Change email / Resend OTP
                  </button>
                </form>
              )}
            </motion.div>
          ) : (
            <motion.div key="password" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
              {showForgotPassword ? (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <p className="text-sm text-gray-600">Enter your email and we'll send you a link to reset your password.</p>
                  <div>
                    <label htmlFor="forgot-email" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-rose-500" />
                      Email
                    </label>
                    <Input
                      id="forgot-email"
                      type="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => { setEmail(sanitizeInput(e.target.value)); setEmailError(''); }}
                      placeholder="you@example.com"
                      className={`min-h-[48px] h-12 pl-10 rounded-xl border-2 text-base ${emailError ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {emailError && <p className="mt-2 text-sm text-red-600">{emailError}</p>}
                  </div>
                  <Button type="submit" className="w-full min-h-[48px] h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl touch-manipulation" disabled={forgotPasswordSubmitting}>
                    {forgotPasswordSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Send reset link'}
                  </Button>
                  <button type="button" onClick={() => { setShowForgotPassword(false); setEmailError(''); }} className="w-full min-h-[44px] py-2 text-sm text-rose-600 hover:text-rose-700 font-medium touch-manipulation">
                    Back to sign in
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label htmlFor="login-pw-email" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-rose-500" />
                      Email
                    </label>
                    <Input
                      id="login-pw-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(sanitizeInput(e.target.value)); setEmailError(''); }}
                      placeholder="you@example.com"
                      className={`min-h-[48px] h-12 pl-10 rounded-xl border-2 text-base ${emailError ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {emailError && <p className="mt-2 text-sm text-red-600">{emailError}</p>}
                  </div>
                  <div>
                    <label htmlFor="login-pw-password" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-rose-500" />
                      Password
                    </label>
                    <Input
                      id="login-pw-password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                      placeholder="••••••••"
                      className={`min-h-[48px] h-12 pl-10 rounded-xl border-2 text-base ${passwordError ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {passwordError && <p className="mt-2 text-sm text-red-600">{passwordError}</p>}
                    <p className="text-xs text-gray-500 mt-1.5">No password? Use the Email tab – we'll send you a code.</p>
                    <button type="button" onClick={() => setShowForgotPassword(true)} className="mt-1.5 min-h-[44px] py-2 text-sm text-rose-600 hover:text-rose-700 font-medium touch-manipulation">
                      Forgot password?
                    </button>
                  </div>
                  <Button type="submit" className="w-full min-h-[48px] h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl touch-manipulation" disabled={passwordSubmitting}>
                    {passwordSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : 'Sign in'}
                  </Button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default LoginPage;