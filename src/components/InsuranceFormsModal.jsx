import React, { useState, useRef } from 'react';
import { ShieldCheck, Loader2, X, User, Calendar, Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { sanitizeInput, validateEmail, validatePhone, validateName, validateNumber, createRateLimiter } from '@/lib/utils';

// ===== YOUR EMAIL - UPDATE THIS TO RECEIVE FORM SUBMISSIONS =====
const RECIPIENT_EMAIL = 'info@ahnupha.com'; // Change this to your email address
// ================================================================

const InsuranceFormsModal = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const { supabase } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);
  const rateLimiterRef = useRef(createRateLimiter(3000)); // 3 second rate limit
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    mobileNumber: '',
    email: '',
    address: '',
    coverageAmount: 0, // Default coverage amount
    declaration: false
  });

  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Sanitize input to prevent XSS (except for checkboxes and dates)
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'date') {
      setFormData({ ...formData, [name]: value });
    } else {
      const sanitized = sanitizeInput(value);
      setFormData({ ...formData, [name]: sanitized });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Rate limiting protection
    if (!rateLimiterRef.current()) {
      toast({
        title: "Too Many Requests",
        description: "Please wait a moment before submitting again.",
        variant: "destructive"
      });
      return;
    }

    // Security: Validate all inputs
    if (!validateName(formData.fullName)) {
      toast({
        title: "Invalid Full Name",
        description: "Please enter a valid name (2-100 characters, letters and spaces only).",
        variant: "destructive"
      });
      return;
    }

    if (!formData.dateOfBirth) {
      toast({
        title: "Date of Birth Required",
        description: "Please enter your date of birth.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.gender) {
      toast({
        title: "Gender Required",
        description: "Please select your gender.",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhone(formData.mobileNumber)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid mobile number (10-15 digits).",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.address || formData.address.trim().length < 10) {
      toast({
        title: "Invalid Address",
        description: "Please enter a complete address (minimum 10 characters).",
        variant: "destructive"
      });
      return;
    }

    if (!formData.declaration) {
      toast({
        title: "Declaration Required",
        description: "Please agree to the terms and conditions to proceed.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Sanitize all data before sending
      const sanitizedData = {
        full_name: sanitizeInput(formData.fullName),
        date_of_birth: formData.dateOfBirth,
        gender: sanitizeInput(formData.gender),
        mobile_number: sanitizeInput(formData.mobileNumber),
        email: sanitizeInput(formData.email).toLowerCase().trim(),
        address: sanitizeInput(formData.address),
        coverage_amount: formData.coverageAmount || 0 // Default to 0 if not specified
      };

      // 1. Save to Database
      const { error: dbError } = await supabase
        .from('insurance_forms')
        .insert(sanitizedData);

      if (dbError) throw dbError;

      toast({
        title: "Request Received! 🛡️",
        description: "We've received your insurance inquiry. Our team will contact you shortly.",
        duration: 5000,
      });

      // Reset form
      setFormData({
        fullName: '',
        dateOfBirth: '',
        gender: '',
        mobileNumber: '',
        email: '',
        address: '',
        coverageAmount: 0,
        declaration: false
      });
      setFocusedField(null);
      
      // Close modal after successful submission
      setTimeout(() => onClose(), 1500);

    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide">Insurance Application Form</h2>
              <p className="text-sm text-white/90 mt-0.5">Secure your future with us</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:bg-white/20 rounded-full p-1.5 transition-all duration-200 hover:scale-110 relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input 
                required 
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => setFocusedField(null)}
                placeholder="" 
                className={`text-gray-900 transition-all duration-200 ${
                  focusedField === 'fullName' ? 'ring-2 ring-blue-500 border-blue-500 shadow-md' : ''
                }`}
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input 
                  required 
                  type="date" 
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('dateOfBirth')}
                  onBlur={() => setFocusedField(null)}
                  className={`text-gray-900 transition-all duration-200 ${
                    focusedField === 'dateOfBirth' ? 'ring-2 ring-blue-500 border-blue-500 shadow-md' : ''
                  }`}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Gender <span className="text-red-500">*</span>
              </label>
              <select 
                required 
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                onFocus={() => setFocusedField('gender')}
                onBlur={() => setFocusedField(null)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  focusedField === 'gender' ? 'ring-2 ring-blue-500 border-blue-500 shadow-md' : ''
                }`}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600" />
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input 
                required 
                type="tel" 
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                onFocus={() => setFocusedField('mobileNumber')}
                onBlur={() => setFocusedField(null)}
                placeholder="" 
                className={`text-gray-900 transition-all duration-200 ${
                  focusedField === 'mobileNumber' ? 'ring-2 ring-blue-500 border-blue-500 shadow-md' : ''
                }`}
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-2"
          >
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              Email ID <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input 
                required 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="" 
                className={`text-gray-900 transition-all duration-200 ${
                  focusedField === 'email' ? 'ring-2 ring-blue-500 border-blue-500 shadow-md' : ''
                }`}
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-2"
          >
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Address <span className="text-red-500">*</span>
            </label>
            <textarea 
              required 
              name="address"
              value={formData.address}
              onChange={handleChange}
              onFocus={() => setFocusedField('address')}
              onBlur={() => setFocusedField(null)}
              placeholder=""
              rows="3"
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 ${
                focusedField === 'address' ? 'ring-2 ring-blue-500 border-blue-500 shadow-md' : ''
              }`}
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="pt-2"
          >
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input 
                  type="checkbox" 
                  name="declaration"
                  checked={formData.declaration}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer transition-all duration-200"
                  required
                />
                {formData.declaration && (
                  <CheckCircle2 className="absolute top-0 left-0 w-5 h-5 text-blue-600 pointer-events-none" />
                )}
              </div>
              <span className="text-sm text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                I agree to the terms and conditions and confirm that the above information is correct. <span className="text-red-500">*</span>
              </span>
            </label>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="pt-4"
          >
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Submitting...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Submit Application
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </div>
      </motion.div>
    </div>
  );
};

export default InsuranceFormsModal;