import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { sanitizeInput, validateEmail, validateName } from '@/lib/utils';

const SignupPage = () => {
  const [loading, setLoading] = useState(false);
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
  const { signUp } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitized = name.includes('password') ? value : sanitizeInput(value);
    setFormData((prev) => ({ ...prev, [name]: sanitized }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({ name: '', email: '', password: '', confirmPassword: '' });
    let hasError = false;

    if (!formData.name || !validateName(formData.name)) {
      setFieldErrors((prev) => ({ ...prev, name: 'Please enter a valid name (2–100 characters)' }));
      hasError = true;
    }
    if (!formData.email) {
      setFieldErrors((prev) => ({ ...prev, email: 'Please enter your email' }));
      hasError = true;
    } else if (!validateEmail(formData.email)) {
      setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email' }));
      hasError = true;
    }
    if (!formData.password || formData.password.length < 6) {
      setFieldErrors((prev) => ({ ...prev, password: 'Password must be at least 6 characters' }));
      hasError = true;
    }
    if (formData.password !== formData.confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      hasError = true;
    }
    if (hasError) {
      toast({ title: 'Please fix the errors', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const email = sanitizeInput(formData.email).toLowerCase().trim();
      const name = sanitizeInput(formData.name);
      await signUp(email, formData.password, { full_name: name });
      toast({
        title: 'Check your email',
        description: 'We sent a verification link. After verifying, you can sign in.',
        duration: 5000
      });
      navigate('/login', { replace: true });
    } catch (err) {
      const msg = err?.message?.toLowerCase() || '';
      if (msg.includes('already registered') || msg.includes('already exists')) {
        setFieldErrors((prev) => ({ ...prev, email: 'This email is already registered' }));
        toast({ title: 'Email already registered', description: 'Please sign in instead.', variant: 'destructive' });
      } else {
        toast({ title: 'Could not create account', description: err?.message || 'Please try again.', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-gray-50 via-rose-50/20 to-amber-50/20 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Create your account to save orders and checkout faster.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                className={`pl-10 h-11 ${fieldErrors.name ? 'border-red-500' : ''}`}
              />
            </div>
            {fieldErrors.name && <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className={`pl-10 h-11 ${fieldErrors.email ? 'border-red-500' : ''}`}
              />
            </div>
            {fieldErrors.email && <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="password"
                name="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                className={`pl-10 h-11 ${fieldErrors.password ? 'border-red-500' : ''}`}
              />
            </div>
            {fieldErrors.password && <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="password"
                name="confirmPassword"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`pl-10 h-11 ${fieldErrors.confirmPassword ? 'border-red-500' : ''}`}
              />
            </div>
            {fieldErrors.confirmPassword && <p className="text-sm text-red-600 mt-1">{fieldErrors.confirmPassword}</p>}
          </div>

          <Button type="submit" className="w-full h-11 bg-rose-600 hover:bg-rose-700" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Create profile</span><ArrowRight className="w-4 h-4 ml-2" /></>}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="font-medium text-rose-600 hover:underline">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SignupPage;