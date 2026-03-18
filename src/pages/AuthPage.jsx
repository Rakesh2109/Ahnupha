import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { sanitizeInput, validateEmail, validateName } from '@/lib/utils';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { signInWithPassword: signIn, signUp } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Sanitize input to prevent XSS (except password fields)
    const sanitized = name.includes('password') ? value : sanitizeInput(value);
    setFormData({ ...formData, [name]: sanitized });
    // Clear error when user types
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: '' });
    }
  };

  const validateForm = () => {
    // Clear previous errors
    setFieldErrors({ name: '', email: '', password: '', confirmPassword: '' });
    let hasError = false;

    if (!isLogin && (!formData.name || !validateName(formData.name))) {
      setFieldErrors(prev => ({ ...prev, name: "❌ Please enter a valid name (2-100 characters)" }));
      hasError = true;
    }

    if (!formData.email) {
      setFieldErrors(prev => ({ ...prev, email: "❌ Please enter your email address" }));
      hasError = true;
    } else if (!validateEmail(formData.email)) {
      setFieldErrors(prev => ({ ...prev, email: "❌ Please enter a valid email address" }));
      hasError = true;
    }

    if (!formData.password) {
      setFieldErrors(prev => ({ ...prev, password: "❌ Please enter your password" }));
      hasError = true;
    } else if (formData.password.length < 6) {
      setFieldErrors(prev => ({ ...prev, password: "❌ Password must be at least 6 characters" }));
      hasError = true;
    } else if (formData.password.length > 128) {
      setFieldErrors(prev => ({ ...prev, password: "❌ Password is too long (max 128 characters)" }));
      hasError = true;
    }

    if (!isLogin) {
      if (!formData.confirmPassword) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: "❌ Please confirm your password" }));
        hasError = true;
      } else if (formData.password !== formData.confirmPassword) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: "❌ Passwords do not match" }));
        hasError = true;
      }
    }

    if (hasError) {
      toast({ 
        title: "Please Fix Errors", 
        description: "Check the fields marked in red below.", 
        variant: "destructive" 
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Sanitize email before sending
      const sanitizedEmail = sanitizeInput(formData.email).toLowerCase().trim();
      const sanitizedName = isLogin ? null : sanitizeInput(formData.name);
      
      if (isLogin) {
        await signIn(sanitizedEmail, formData.password);
        toast({ 
          title: "✅ Success", 
          description: "Logged in successfully!",
          duration: 3000
        });
        navigate('/'); 
      } else {
        await signUp(sanitizedEmail, formData.password, { full_name: sanitizedName });
        toast({ 
          title: "✅ Thank you for signing up",
          description: "Please verify your email before logging in.",
          duration: 4000
        });
        navigate('/login');
      }
    } catch (error) {
      // Show specific error messages to help user
      let errorMessage = "Authentication failed. Please try again.";
      const errorMsg = error.message?.toLowerCase() || '';
      
      if (isLogin) {
        // Login errors
        const errorStatus = error.status || error.code;
        
        // Check for user not found / email not registered
        if (errorMsg.includes('user not found') || 
            errorMsg.includes('no user found') || 
            errorMsg.includes('email not found') ||
            errorMsg.includes('user does not exist') ||
            errorStatus === 404) {
          errorMessage = "❌ No account found with this email. Please sign up first or check your email address.";
          setFieldErrors({
            email: "❌ This email is not registered. Please sign up first.",
            password: '',
            name: '',
            confirmPassword: ''
          });
        } else if (error.code === 'email_not_verified' ||
                   errorMsg.includes('email not confirmed') || 
                   errorMsg.includes('email not verified') ||
                   errorMsg.includes('verify your email')) {
          errorMessage = "⚠️ Please verify your email address before logging in. Check your inbox.";
          setFieldErrors({
            email: "⚠️ Email not verified. Please check your inbox.",
            password: '',
            name: '',
            confirmPassword: ''
          });
        } else if (errorMsg.includes('invalid login credentials') || 
                   errorMsg.includes('invalid credentials') ||
                   errorMsg.includes('incorrect password') ||
                   errorStatus === 400) {
          // This could be wrong password OR wrong email
          errorMessage = "❌ Incorrect email or password. Please check and try again.";
          setFieldErrors({
            email: "❌ Check your email address",
            password: "❌ Check your password",
            name: '',
            confirmPassword: ''
          });
        } else if (errorMsg.includes('password') && !errorMsg.includes('invalid login')) {
          errorMessage = "❌ Incorrect password. Please try again or reset your password.";
          setFieldErrors({
            email: '',
            password: "❌ Incorrect password",
            name: '',
            confirmPassword: ''
          });
        } else if (errorMsg.includes('too many requests') || 
                   errorMsg.includes('rate limit')) {
          errorMessage = "⚠️ Too many login attempts. Please wait a moment and try again.";
          setFieldErrors({
            email: '',
            password: '',
            name: '',
            confirmPassword: ''
          });
        } else if (error.message) {
          errorMessage = `❌ ${error.message}`;
          // Try to detect if it's a user not found scenario
          if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
            setFieldErrors({
              email: "❌ This email is not registered",
              password: '',
              name: '',
              confirmPassword: ''
            });
          }
        }
      } else {
        // Signup errors
        if (errorMsg.includes('already registered') || errorMsg.includes('user already registered')) {
          errorMessage = "⚠️ This email is already registered. Please sign in instead.";
          setFieldErrors({
            email: "⚠️ Email already registered",
            password: '',
            name: '',
            confirmPassword: ''
          });
        } else if (errorMsg.includes('password')) {
          errorMessage = "❌ Password does not meet requirements. Must be at least 6 characters.";
          setFieldErrors({
            email: '',
            password: "❌ Password does not meet requirements",
            name: '',
            confirmPassword: ''
          });
        } else if (errorMsg.includes('email')) {
          errorMessage = "❌ Invalid email address. Please enter a valid email.";
          setFieldErrors({
            email: "❌ Invalid email address",
            password: '',
            name: '',
            confirmPassword: ''
          });
        } else if (error.message) {
          errorMessage = `❌ ${error.message}`;
        }
      }
      
      toast({ 
        title: isLogin ? "Login Failed" : "Signup Failed", 
        description: errorMessage, 
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-full min-h-[600px]">
        
        {/* Left Side - Image/Branding */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-rose-500 to-orange-400 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&q=80')] opacity-20 bg-cover bg-center"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-6 tracking-tight">
              {isLogin ? "Welcome Back!" : "Join Our Community"}
            </h2>
            <p className="text-rose-100 text-lg leading-relaxed">
              {isLogin 
                ? "Sign in to access your wishlist, track orders, and discover new handmade treasures crafted just for you."
                : "Create an account to start your journey with Ahnupha. Experience the finest selection of handicrafts and homemade delights."
              }
            </p>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 text-sm font-medium text-rose-100">
               <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-rose-500 bg-gray-200"></div>
                  <div className="w-8 h-8 rounded-full border-2 border-rose-500 bg-gray-300"></div>
                  <div className="w-8 h-8 rounded-full border-2 border-rose-500 bg-gray-400"></div>
               </div>
               <span>Join 5,000+ happy customers</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-sm mx-auto w-full">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {isLogin ? "Sign In to Ahnupha" : "Create Account"}
              </h3>
              <p className="text-sm text-gray-500">
                {isLogin ? "Enter your details below to continue" : "Fill in your information to get started"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      name="name"
                      placeholder="John Doe" 
                      className={`pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all ${fieldErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    type="email" 
                    name="email"
                    placeholder="you@example.com" 
                    className={`pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all ${fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    type="password" 
                    name="password"
                    placeholder="••••••••" 
                    className={`pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all ${fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Confirm Password</label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      type="password" 
                      name="confirmPassword"
                      placeholder="••••••••" 
                      className={`pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all ${fieldErrors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 shadow-lg shadow-rose-200 transition-all mt-4" 
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                {isLogin ? "Don't have an account yet?" : "Already have an account?"}
                <button 
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                  }}
                  className="ml-2 font-bold text-rose-600 hover:text-rose-500 hover:underline transition-colors"
                >
                  {isLogin ? "Sign up" : "Log in"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;