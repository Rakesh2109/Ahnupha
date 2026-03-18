import React, { lazy, Suspense, useState, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider, useCart } from '@/context/CartContext';
import { Link } from 'react-router-dom';
import { SupabaseAuthProvider, useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { WishlistProvider, useWishlist } from '@/context/WishlistContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Loader2, Shield, FileText, ShoppingBag, Plus, Minus, Trash2, Heart, Gift, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchData } from '@/lib/searchData';

// Lazy load pages for better performance.
// LoginPage/SignupPage are eager so /login and /signup work even when the server
// returns HTML for /assets/*.js (wrong SPA fallback). Fix: serve real files for /assets/*.
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';

const Home = lazy(() => import('@/pages/Home'));
const CandyChocolate = lazy(() => import('@/pages/CandyChocolate'));
const CustomizeChocolates = lazy(() => import('@/pages/CustomizeChocolates'));
const AboutUs = lazy(() => import('@/pages/AboutUs'));
const Contact = lazy(() => import('@/pages/Contact'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const UserDashboard = lazy(() => import('@/pages/UserDashboard'));
const Handicraft = lazy(() => import('@/pages/Handicraft'));
const HomemadeFood = lazy(() => import('@/pages/HomemadeFood'));

// ResetPasswordPage component (moved from separate file)
const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isValidLink, setIsValidLink] = useState(true);
  const [isCheckingLink, setIsCheckingLink] = useState(true);
  const { supabase } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let mounted = true;

    // Check for recovery token in URL hash or query params
    const hashParams = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);

    // Supabase recovery links redirect with tokens in hash: #access_token=xxx&refresh_token=xxx&type=recovery
    const hashParamsObj = hashParams ? new URLSearchParams(hashParams.substring(1)) : null;
    const type = hashParamsObj?.get('type');
    const accessToken = hashParamsObj?.get('access_token');
    const refreshToken = hashParamsObj?.get('refresh_token');

    console.log('Reset password page loaded:', {
      hash: hashParams,
      search: window.location.search,
      type,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    });

    // If we have recovery tokens in hash, set the session
    if (type === 'recovery' && accessToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      }).then(({ data: { session }, error }) => {
        if (!mounted) return;

        if (error || !session) {
          console.error('Error setting recovery session:', error);
          setIsValidLink(false);
          setIsCheckingLink(false);
          toast({
            title: "Invalid Link",
            description: error?.message || "This password reset link is invalid or has expired. Please request a new one.",
            variant: "destructive"
          });
        } else {
          console.log('Recovery session established successfully');
          setIsCheckingLink(false);
        }
      });
    } else if (!hashParams) {
      // No hash params - check if we already have a valid session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!mounted) return;

        if (session) {
          // Already have a session, allow password reset
          console.log('Using existing session for password reset');
          setIsCheckingLink(false);
        } else {
          setIsValidLink(false);
          setIsCheckingLink(false);
          toast({
            title: "Invalid Link",
            description: "This password reset link is invalid or has expired. Please request a new one.",
            variant: "destructive"
          });
        }
      });
    } else {
      // Hash exists but not a recovery type
      setIsValidLink(false);
      setIsCheckingLink(false);
      toast({
        title: "Invalid Link",
        description: "This password reset link is invalid or has expired. Please request a new one.",
        variant: "destructive"
      });
    }

    return () => {
      mounted = false;
    };
  }, [supabase, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate inputs
    let hasError = false;

    if (!password) {
      setPasswordError("❌ Please enter a new password");
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError("❌ Password must be at least 6 characters long");
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("❌ Please confirm your password");
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("❌ Passwords do not match");
      hasError = true;
    }

    if (hasError) {
      toast({
        title: "Please Fix Errors",
        description: "Check the fields marked in red below.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Verify we have a valid session before updating password
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !currentSession) {
        throw new Error('No active session. Please use a valid password reset link.');
      }

      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast({
        title: "✅ Password Reset Successful!",
        description: "Your password has been updated. You can now log in with your new password.",
        duration: 5000
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error("Password reset error:", error);

      // Handle specific error cases
      let errorMessage = "Failed to reset password. The link may have expired. Please request a new one.";

      if (error.message?.includes('same_password') || error.code === 'same_password') {
        errorMessage = "The new password must be different from your current password. Please choose a different password.";
        setPasswordError("❌ New password must be different from current password");
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = error.message;
        setPasswordError("❌ " + error.message);
      } else if (error.message?.includes('session') || error.message?.includes('expired')) {
        errorMessage = "Your password reset link has expired or is invalid. Please request a new password reset link.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingLink) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-gray-50 via-rose-50/20 to-amber-50/20 px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/95 backdrop-blur-md p-10 md:p-12 rounded-3xl shadow-2xl border-2 border-gray-100/50 text-center"
        >
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Verifying Reset Link...</h2>
          <p className="text-gray-600">Please wait while we verify your password reset link.</p>
        </motion.div>
      </div>
    );
  }

  if (!isValidLink) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-gray-50 via-rose-50/20 to-amber-50/20 px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/95 backdrop-blur-md p-10 md:p-12 rounded-3xl shadow-2xl border-2 border-gray-100/50 text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or has expired. Please request a new password reset link.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white"
          >
            Go to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-gray-50 via-rose-50/20 to-amber-50/20 px-4 py-12 relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-rose-200/20 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-40 h-40 bg-amber-200/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 bg-white/95 backdrop-blur-md p-10 md:p-12 rounded-3xl shadow-2xl border-2 border-gray-100/50 relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-500 to-amber-500 rounded-2xl mb-4 shadow-lg"
          >
            <Lock className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-600 font-semibold">Enter your new password below</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label htmlFor="new-password" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-500" />
                New Password
              </label>
              <div className="relative">
                <Input
                  id="new-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className={`mt-1 h-12 pl-11 pr-12 rounded-xl border-2 transition-all duration-300 shadow-sm ${passwordError
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-200 focus:border-rose-500 focus:ring-rose-200/50 focus:shadow-md'
                    }`}
                  placeholder="Enter new password"
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-2 text-sm text-red-600 font-medium">{passwordError}</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-500" />
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmPasswordError('');
                  }}
                  className={`mt-1 h-12 pl-11 pr-12 rounded-xl border-2 transition-all duration-300 shadow-sm ${confirmPasswordError
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-200 focus:border-rose-500 focus:ring-rose-200/50 focus:shadow-md'
                    }`}
                  placeholder="Confirm new password"
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors duration-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="mt-2 text-sm text-red-600 font-medium">{confirmPasswordError}</p>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-bold text-base tracking-wide hover:scale-[1.02] active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting Password...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Reset Password
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

// When email link is invalid/expired (e.g. redirected to localhost or otp_expired), clean hash and send to login
const AuthErrorHashHandler = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.substring(1));
    if (params.get('access_token')) return; // Let recovery/verification handlers deal with tokens
    const error = params.get('error');
    const errorCode = params.get('error_code');
    const desc = params.get('error_description') || '';
    if (error || errorCode === 'otp_expired' || desc.includes('expired') || desc.includes('invalid')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      toast({
        title: 'Link invalid or expired',
        description: 'This email link is invalid or has expired. Please request a new verification or password reset link.',
        variant: 'destructive',
        duration: 6000,
      });
      navigate('/login', { replace: true });
    }
  }, [navigate, toast]);
  return null;
};

// Component to handle recovery token redirects
const RecoveryTokenRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we have recovery tokens in the URL hash
    const hashParams = window.location.hash;
    if (hashParams) {
      const hashParamsObj = new URLSearchParams(hashParams.substring(1));
      const type = hashParamsObj.get('type');
      const accessToken = hashParamsObj.get('access_token');

      // If we have recovery tokens and we're not on the reset-password page, redirect
      if (type === 'recovery' && accessToken && location.pathname !== '/reset-password') {
        console.log('Recovery token detected, redirecting to /reset-password');
        navigate(`/reset-password${hashParams}`, { replace: true });
      }
    }
  }, [navigate, location]);

  return null;
};

// Component to handle email verification tokens
const EmailVerificationHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { supabase } = useSupabaseAuth();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Check if we have verification tokens in the URL hash
    const hashParams = window.location.hash;
    if (hashParams) {
      const hashParamsObj = new URLSearchParams(hashParams.substring(1));
      const type = hashParamsObj.get('type');
      const accessToken = hashParamsObj.get('access_token');
      const refreshToken = hashParamsObj.get('refresh_token');

      // Handle auth callback (email OTP magic link, signup, or Google OAuth)
      const isAuthCallback = (type === 'signup' || type === 'email' || type === 'magiclink' || type === 'oauth') && accessToken && !isVerifying;
      if (isAuthCallback) {
        setIsVerifying(true);

        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        }).then(({ data: { session }, error }) => {
          setIsVerifying(false);
          window.history.replaceState(null, '', window.location.pathname);

          if (error || !session) {
            toast({
              title: "Sign-in failed",
              description: error?.message || "Link may have expired. Please try again.",
              variant: "destructive",
              duration: 5000
            });
            navigate('/login', { replace: true });
          } else {
            toast({
              title: "Signed in",
              description: type === 'oauth' ? "Welcome!" : "Create a password for next time, or go to dashboard.",
              duration: 3000
            });
            if (type === 'oauth') {
              navigate('/dashboard', { replace: true });
            } else {
              navigate('/dashboard?setPassword=1', { replace: true });
            }
          }
        });
      }
    }
  }, [navigate, location, supabase, toast, isVerifying]);

  // Show loading state while verifying
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your email...</p>
        </div>
      </div>
    );
  }

  return null;
};

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto mb-4" />
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Privacy Policy Page (inline component)
const PrivacyPolicy = () => (
  <>
    <Helmet>
      <title>Privacy Policy - Ahnupha</title>
      <meta name="description" content="Ahnupha Privacy Policy - Learn how we collect, use, and protect your personal information." />
    </Helmet>
    <div className="min-h-screen bg-gradient-to-br from-rose-50/50 to-amber-50/50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border-2 border-rose-100/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Privacy Policy</h1>
          </div>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div>
              <p className="text-sm text-gray-500 mb-2">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">1. Introduction</h2>
              <p className="mb-4">
                Welcome to Ahnupha. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">2. Information We Collect</h2>
              <p className="mb-4">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Personal Information:</strong> Name, email address, phone number, and shipping address when you create an account or place an order.</li>
                <li><strong>Payment Information:</strong> Payment details are processed securely through our payment partners. We do not store your complete payment card information.</li>
                <li><strong>Account Information:</strong> Username, password, and preferences you set in your account.</li>
                <li><strong>Communication Data:</strong> Messages, reviews, and feedback you send to us.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">3. How We Use Your Information</h2>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Process and fulfill your orders and deliver products to you</li>
                <li>Communicate with you about your orders, account, and our services</li>
                <li>Send you marketing communications (with your consent)</li>
                <li>Improve our website, products, and customer service</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">4. Information Sharing</h2>
              <p className="mb-4">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our website and conducting our business (e.g., payment processors, shipping companies).</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety.</li>
                <li><strong>Business Transfers:</strong> In connection with any merger, sale, or transfer of assets.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">5. Data Security</h2>
              <p className="mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">6. Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access and receive a copy of your personal data</li>
                <li>Rectify inaccurate or incomplete information</li>
                <li>Request deletion of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">7. Cookies and Tracking</h2>
              <p className="mb-4">
                We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">8. Children's Privacy</h2>
              <p className="mb-4">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">9. Changes to This Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">10. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="mb-4">
                <strong>Email:</strong> info@ahnupha.com<br />
                <strong>Phone:</strong> +919515404195<br />
                <strong>Address:</strong> 1-6-141/43/A2/C, Sri Ram Nagar, Near New Vision School, Suryapet, Telangana 508213, India
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  </>
);

// Shopping Cart Page (inline component)
const ShoppingCart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount, addToCart, getCartLineKey } = useCart();
  const { addToWishlist } = useWishlist();
  const { toast } = useToast();
  const { currentUser } = useSupabaseAuth();
  const navigate = useNavigate();
  const safeCart = Array.isArray(cart) ? cart : [];
  const [roseChocolates, setRoseChocolates] = useState([]);

  const handleProceedToCheckout = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  // Load search data only when cart page is mounted
  useEffect(() => {
    let isMounted = true;
    import('@/lib/searchData')
      .then((mod) => {
        const data = mod.searchData || mod.default || [];
        const filtered = Array.isArray(data)
          ? data.filter(p => p.title === 'With Love Rose Chocolate')
          : [];
        if (isMounted) {
          setRoseChocolates(filtered);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRoseChocolates([]);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const { paidItems, totalPaidItems, freeItems, totalFreeItems, eligibleFreeItems, qualifiesForB2G1 } = useMemo(() => {
    const paid = safeCart.filter(item => !item.isFreeItem);
    const paidTotal = paid.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const free = safeCart.filter(item => item.isFreeItem === true);
    const freeTotal = free.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const eligible = Math.floor(paidTotal / 2);
    const qualifies = paidTotal >= 2;
    return {
      paidItems: paid,
      totalPaidItems: paidTotal,
      freeItems: free,
      totalFreeItems: freeTotal,
      eligibleFreeItems: eligible,
      qualifiesForB2G1: qualifies
    };
  }, [safeCart]);

  // Track quantity for each free chocolate type
  const [freeItemQuantities, setFreeItemQuantities] = useState({});
  const isUpdatingFreeItems = useRef(false);

  // Initialize quantities from cart - use cart directly and compare values to prevent infinite loops
  useEffect(() => {
    if (isUpdatingFreeItems.current) {
      return;
    }

    const quantities = {};
    roseChocolates.forEach((rose) => {
      const cartItem = cart.find(item => item.id === rose.id && item.isFreeItem === true);
      quantities[rose.id] = cartItem?.quantity || 0;
    });

    // Only update if quantities actually changed - compare with previous values
    setFreeItemQuantities(prev => {
      const prevString = JSON.stringify(prev);
      const newString = JSON.stringify(quantities);
      if (prevString !== newString) {
        return quantities;
      }
      return prev; // Return previous value if unchanged to prevent re-render
    });
  }, [cart, roseChocolates]); // Use cart directly, not safeCart

  const handleFreeItemQuantityChange = (roseId, delta) => {
    const currentQty = freeItemQuantities[roseId] || 0;
    const newQty = Math.max(0, currentQty + delta);

    const otherQuantities = Object.entries(freeItemQuantities)
      .filter(([id]) => id !== roseId)
      .reduce((sum, [, qty]) => sum + (qty || 0), 0);
    const totalSelected = otherQuantities + newQty;

    if (totalSelected > eligibleFreeItems) {
      toast({
        title: "Limit Reached",
        description: `You can only select ${eligibleFreeItems} free item(s) total.`,
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    isUpdatingFreeItems.current = true;
    setFreeItemQuantities(prev => ({ ...prev, [roseId]: newQty }));

    const rose = roseChocolates.find(r => r.id === roseId);
    if (!rose) {
      isUpdatingFreeItems.current = false;
      return;
    }

    const existingCartItem = safeCart.find(item => item.id === roseId && item.isFreeItem === true);

    if (newQty === 0) {
      if (existingCartItem) {
        removeFromCart(roseId);
      }
      setTimeout(() => {
        isUpdatingFreeItems.current = false;
      }, 100);
    } else {
      if (existingCartItem) {
        removeFromCart(roseId);
      }
      setTimeout(() => {
        const freeProduct = { ...rose, price: 0, isFreeItem: true, quantity: newQty };
        addToCart(freeProduct, newQty);
        setTimeout(() => {
          isUpdatingFreeItems.current = false;
        }, 100);
      }, 50);
    }
  };

  const GIFT_WRAP_PRICE = 20;
  const cartTotalForDisplay = useMemo(() =>
    safeCart.reduce((total, item) => {
      const itemTotal = (item.price || 0) * (item.quantity || 0);
      const wrapTotal = item.giftWrap ? GIFT_WRAP_PRICE * (item.quantity || 0) : 0;
      return total + itemTotal + wrapTotal;
    }, 0),
    [safeCart]
  );

  const cartItemCount = safeCart.length;

  return (
    <>
      <Helmet>
        <title>Shopping Cart - Ahnupha</title>
        <meta name="description" content="Review your cart items and proceed to checkout" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">
              Shopping Cart
            </h1>
          </div>

          {safeCart.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-12 text-center">
              <ShoppingBag className="w-14 h-14 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" aria-hidden />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-sm sm:text-base text-gray-500 mb-6 max-w-sm mx-auto">Looks like you haven't added anything to your cart yet.</p>
              <Link
                to="/candy-chocolate"
                className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all touch-manipulation"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile-only: Sticky bottom checkout bar so users don't have to scroll */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Subtotal</p>
                    <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">
                      ₹{cartTotalForDisplay.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    className="flex-1 max-w-[200px] min-h-[48px] flex items-center justify-center bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-semibold text-base rounded-xl shadow-lg active:scale-[0.98] transition-transform touch-manipulation"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>

              {/* Spacer so page content isn't hidden behind sticky bar on mobile */}
              <div className="h-20 lg:hidden" aria-hidden />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                {/* Cart Items - Left Column */}
                <div className="lg:col-span-8 space-y-4">
                  {safeCart.map((item) => {
                    const itemTotal = (item.price || 0) * (item.quantity || 0) + (item.giftWrap ? 20 * (item.quantity || 0) : 0);
                    const uniqueKey = getCartLineKey ? getCartLineKey(item) : `${item.id}-${item.isFreeItem ? 'free' : 'paid'}`;

                    return (
                      <div
                        key={uniqueKey}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6"
                      >
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Product Image */}
                          <div className="w-full sm:w-24 sm:h-24 md:w-32 md:h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 aspect-square max-w-[140px] sm:max-w-none mx-auto sm:mx-0">
                            <img
                              src={item.image || 'https://via.placeholder.com/150'}
                              alt={item.title || item.name}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 line-clamp-2">
                                  {item.title || item.name}
                                </h3>
                                <p className="text-sm text-gray-500 mb-2">{item.category || 'Chocolate'}</p>
                                {(item.nameOnBar || item.firstName || item.secondName || item.firstLetters || item.customText) && (
                                  <p className="text-sm text-rose-600 font-semibold mb-2">
                                    {item.firstName && item.secondName ? `Names: ${item.firstName} & ${item.secondName}` : item.firstLetters ? `Letters: ${item.firstLetters}` : item.customText ? `Text: ${item.customText}` : `Name on bar: ${item.nameOnBar}`}
                                  </p>
                                )}
                                {(item.isPremiumCustom || item.selectedBase || item.selectedSeeds?.length || item.selectedSeedsLabels?.length || item.smallBitesWithWrap) && (
                                  <>
                                    {item.selectedChocolateType?.label && item.selectedSmallBitesGram && (
                                      <p className="text-sm text-gray-700 mb-1"><span className="font-medium">Chocolate:</span> {item.selectedChocolateType.label} · {item.selectedSmallBitesGram.weight} — ₹{item.selectedSmallBitesGram.price}/pack</p>
                                    )}
                                    {item.selectedBase?.label && (
                                      <p className="text-sm text-gray-700 mb-1"><span className="font-medium">Choose your base:</span> {item.selectedBase.label}</p>
                                    )}
                                    {((item.selectedSeedsLabels && item.selectedSeedsLabels.length > 0) || (item.selectedSeeds && item.selectedSeeds.length > 0)) && (
                                      <p className="text-sm text-gray-700 mb-1">
                                        <span className="font-medium">Dry fruits mix:</span>{' '}
                                        {item.selectedSeedsLabels?.length
                                          ? item.selectedSeedsLabels.join(', ')
                                          : (() => {
                                              const prod = searchData.find(p => p.id === 'prod-personalised-bar');
                                              const opts = prod?.seedsOptions || [];
                                              return (item.selectedSeeds || []).map(id => opts.find(o => o.id === id)?.label || id).filter(Boolean).join(', ');
                                            })()}
                                      </p>
                                    )}
                                    <p className="text-sm text-gray-600 mb-1">
                                      <span className="font-medium">Any instructions (optional):</span>{' '}
                                      {item.customInstructions ? item.customInstructions : '—'}
                                    </p>
                                    {item.giftWrap && (
                                      <p className="text-sm text-rose-600 font-medium">Gift wrap +₹20</p>
                                    )}
                                  </>
                                )}
                                {item.giftWrap && !item.isPremiumCustom && !item.selectedBase && (
                                  <p className="text-sm text-rose-600 font-medium mb-2">Gift wrap +₹20</p>
                                )}
                                {!item.selectedBase && !item.selectedSeeds?.length && !item.selectedSeedsLabels?.length && item.customInstructions && (
                                  <p className="text-sm text-gray-600 mb-2">Instructions: {item.customInstructions}</p>
                                )}
                                {item.weight && (
                                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <span className="text-xs text-gray-500">Weight: {item.weight}</span>
                                  </div>
                                )}

                                {/* Quantity Controls + Actions - touch-friendly on mobile */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                  {item.isFreeItem ? (
                                    <div className="flex items-center border border-green-200 bg-green-50 rounded-lg px-3 py-2 sm:px-4 sm:py-2">
                                      <span className="text-sm font-medium text-green-700">
                                        Free Item (Quantity: {item.quantity})
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                                      <button
                                        onClick={() => updateQuantity(item, -1)}
                                        disabled={item.quantity <= 1}
                                        className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-3 sm:p-2 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 touch-manipulation"
                                        aria-label="Decrease quantity"
                                      >
                                        <Minus className="w-4 h-4" />
                                      </button>
                                      <span className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-900 min-w-[2.5rem] text-center">
                                        {item.quantity}
                                      </span>
                                      <button
                                        onClick={() => updateQuantity(item, 1)}
                                        className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-3 sm:p-2 flex items-center justify-center hover:bg-gray-100 text-gray-600 touch-manipulation"
                                        aria-label="Increase quantity"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => removeFromCart(item)}
                                    className="min-h-[44px] sm:min-h-0 py-2 px-3 text-sm text-rose-600 hover:text-rose-700 font-medium rounded-lg hover:bg-rose-50 touch-manipulation"
                                  >
                                    Delete
                                  </button>
                                  <span className="text-sm text-gray-400">|</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      addToWishlist(item);
                                      removeFromCart(item);
                                      toast({ title: 'Saved for later', description: `${item.title || item.name} was moved to your wishlist.` });
                                    }}
                                    className="text-sm text-gray-600 hover:text-rose-600 font-medium min-h-[44px] sm:min-h-0 py-2 px-1 touch-manipulation"
                                  >
                                    Save for later
                                  </button>
                                  <span className="text-sm text-gray-400">|</span>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const url = window.location.href;
                                      const title = item.title || item.name || 'Ahnupha';
                                      try {
                                        if (navigator.share) {
                                          await navigator.share({ title, url, text: `Check out ${title} on Ahnupha` });
                                          toast({ title: 'Shared', description: 'Thanks for sharing!' });
                                        } else {
                                          await navigator.clipboard.writeText(url);
                                          toast({ title: 'Link copied', description: 'Cart link copied to clipboard.' });
                                        }
                                      } catch (e) {
                                        if (e?.name !== 'AbortError') {
                                          try {
                                            await navigator.clipboard.writeText(url);
                                            toast({ title: 'Link copied', description: 'Cart link copied to clipboard.' });
                                          } catch {
                                            toast({ title: 'Share', description: 'Could not share. Try copying the link from your browser.', variant: 'destructive' });
                                          }
                                        }
                                      }
                                    }}
                                    className="text-sm text-gray-600 hover:text-rose-600 font-medium min-h-[44px] sm:min-h-0 py-2 px-1 touch-manipulation"
                                  >
                                    Share
                                  </button>
                                </div>
                              </div>

                              {/* Price - visible on all breakpoints */}
                              <div className="text-left md:text-right flex-shrink-0 pt-2 md:pt-0 border-t border-gray-100 md:border-t-0">
                                {item.isFreeItem ? (
                                  <p className="text-lg sm:text-xl font-bold text-green-600">
                                    FREE
                                  </p>
                                ) : (
                                  <>
                                    <p className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">
                                      ₹{itemTotal.toLocaleString('en-IN')}
                                    </p>
                                    {item.price && (
                                      <p className="text-sm text-gray-500 mt-1">
                                        ₹{item.price.toLocaleString('en-IN')} each
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                </div>

                {/* Subtotal - Right Column (sticky on desktop) */}
                <div className="lg:col-span-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6 lg:sticky lg:top-4">
                    <p className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                      Subtotal ({cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}):{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">
                        ₹{cartTotalForDisplay.toLocaleString('en-IN')}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={handleProceedToCheckout}
                      className="w-full min-h-[48px] sm:min-h-[52px] flex items-center justify-center bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-semibold text-base sm:text-lg py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all mb-3 touch-manipulation"
                    >
                      Proceed to Checkout
                    </button>
                    <Link
                      to="/candy-chocolate"
                      className="w-full block text-center text-gray-600 hover:text-rose-600 font-medium py-3 sm:py-2 text-sm sm:text-base min-h-[44px] sm:min-h-0 flex items-center justify-center"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// Terms of Service Page (inline component)
const TermsOfService = () => (
  <>
    <Helmet>
      <title>Terms of Service - Ahnupha</title>
      <meta name="description" content="Ahnupha Terms of Service - Read our terms and conditions for using our website and services." />
    </Helmet>
    <div className="min-h-screen bg-gradient-to-br from-rose-50/50 to-amber-50/50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border-2 border-rose-100/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Terms of Service</h1>
          </div>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div>
              <p className="text-sm text-gray-500 mb-2">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing and using the Ahnupha website and services, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">2. Use of Our Services</h2>
              <p className="mb-4">You agree to use our services only for lawful purposes and in accordance with these Terms. You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use our services in any way that violates any applicable law or regulation</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit any harmful, offensive, or inappropriate content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt our services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">3. Account Registration</h2>
              <p className="mb-4">
                To access certain features, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">4. Products and Pricing</h2>
              <p className="mb-4">
                We strive to provide accurate product descriptions and pricing. However, we reserve the right to correct any errors, inaccuracies, or omissions. Prices are subject to change without notice. We reserve the right to limit quantities and refuse orders.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">5. Orders and Payment</h2>
              <p className="mb-4">
                When you place an order, you are making an offer to purchase products. We reserve the right to accept or reject your order. Payment must be received before we process and ship your order. We accept online payment methods as displayed on our website. <strong>Cash on Delivery (COD) is not available</strong>; all orders must be paid online.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">6. Shipping and Delivery</h2>
              <p className="mb-4">
                We offer free delivery for Suryapet local area. A nominal delivery charge of ₹100 applies outside Suryapet local. Delivery times are estimates and not guaranteed. We are not responsible for delays caused by shipping carriers or circumstances beyond our control. Risk of loss passes to you upon delivery.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">7. Returns and Refunds</h2>
              <p className="mb-4">
                <strong>No returns and no refunds for chocolates.</strong> Due to the perishable nature of our products, we do not accept returns or offer refunds once an order has been placed or delivered. Please ensure you are satisfied with your selection before completing your purchase.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">8. Intellectual Property</h2>
              <p className="mb-4">
                All content on this website, including text, graphics, logos, images, and software, is the property of Ahnupha and protected by copyright and trademark laws. You may not reproduce, distribute, or create derivative works without our written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">9. Limitation of Liability</h2>
              <p className="mb-4">
                To the fullest extent permitted by law, Ahnupha shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services or products.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">10. Indemnification</h2>
              <p className="mb-4">
                You agree to indemnify and hold harmless Ahnupha, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of our services or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">11. Governing Law</h2>
              <p className="mb-4">
                These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Telangana, India.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">12. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right to modify these Terms at any time. Your continued use of our services after changes are posted constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">13. Contact Information</h2>
              <p className="mb-4">
                For questions about these Terms of Service, please contact us at:
              </p>
              <p className="mb-4">
                <strong>Email:</strong> info@ahnupha.com<br />
                <strong>Phone:</strong> +919515404195<br />
                <strong>Address:</strong> 1-6-141/43/A2/C, Sri Ram Nagar, Near New Vision School, Suryapet, Telangana 508213, India
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  </>
);

function App() {
  useEffect(() => {
    const preloadRoutes = () => {
      import('@/pages/Home');
      import('@/pages/CandyChocolate');
      import('@/pages/AboutUs');
      import('@/pages/Contact');
      import('@/pages/Checkout');
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(preloadRoutes);
    } else {
      setTimeout(preloadRoutes, 500);
    }
  }, []);

  return (
    <SupabaseAuthProvider>
      <WishlistProvider>
        <CartProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthErrorHashHandler />
            <RecoveryTokenRedirect />
            <EmailVerificationHandler />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Layout><Suspense fallback={<PageLoader />}><Home /></Suspense></Layout>} />
              <Route path="/candy-chocolate" element={<Layout><Suspense fallback={<PageLoader />}><CandyChocolate /></Suspense></Layout>} />
              <Route path="/customize" element={<Layout><Suspense fallback={<PageLoader />}><CustomizeChocolates /></Suspense></Layout>} />
              <Route path="/snacks" element={<Layout><Suspense fallback={<PageLoader />}><HomemadeFood /></Suspense></Layout>} />
              <Route path="/about" element={<Layout><Suspense fallback={<PageLoader />}><AboutUs /></Suspense></Layout>} />
              <Route path="/contact" element={<Layout><Suspense fallback={<PageLoader />}><Contact /></Suspense></Layout>} />
              <Route path="/login" element={<Layout><Suspense fallback={<PageLoader />}><LoginPage /></Suspense></Layout>} />
              <Route path="/signup" element={<Layout><Suspense fallback={<PageLoader />}><SignupPage /></Suspense></Layout>} />
              <Route path="/reset-password" element={<Layout><ResetPasswordPage /></Layout>} />
              <Route path="/cart" element={<Layout><Suspense fallback={<PageLoader />}><ShoppingCart /></Suspense></Layout>} />
              <Route path="/checkout" element={<Layout><Suspense fallback={<PageLoader />}><Checkout /></Suspense></Layout>} />
              <Route path="/privacy-policy" element={<Layout><PrivacyPolicy /></Layout>} />
              <Route path="/terms-of-service" element={<Layout><TermsOfService /></Layout>} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <Layout>
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <UserDashboard />
                      </Suspense>
                    </ProtectedRoute>
                  </Layout>
                }
              />
              <Route
                path="/handicraft"
                element={
                  <Layout>
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <Handicraft />
                      </Suspense>
                    </ProtectedRoute>
                  </Layout>
                }
              />
            </Routes>
            <Toaster />
          </Router>
        </CartProvider>
      </WishlistProvider>
    </SupabaseAuthProvider>
  );
}

export default App;