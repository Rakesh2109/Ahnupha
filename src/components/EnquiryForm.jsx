import React, { useState, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { Loader2, Send } from 'lucide-react';
import { sanitizeInput, validateEmail, validatePhone, validateName, createRateLimiter } from '@/lib/utils';

const EnquiryForm = () => {
  const { currentUser, supabase } = useSupabaseAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const rateLimiterRef = useRef(createRateLimiter(3000)); // 3 second rate limit
  const [formData, setFormData] = useState({
    name: currentUser?.user_metadata?.name || '',
    email: currentUser?.email || '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Sanitize input to prevent XSS
    const sanitized = sanitizeInput(value);
    setFormData({ ...formData, [name]: sanitized });
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
    if (!validateName(formData.name)) {
      toast({
        title: "Invalid Name",
        description: "Please enter a valid name (2-100 characters, letters and spaces only).",
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

    if (formData.phone && !validatePhone(formData.phone)) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number (10-15 digits) or leave it empty.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.subject || formData.subject.trim().length < 3 || formData.subject.length > 200) {
      toast({
        title: "Invalid Subject",
        description: "Subject must be between 3 and 200 characters.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.message || formData.message.trim().length < 10 || formData.message.length > 5000) {
      toast({
        title: "Invalid Message",
        description: "Message must be between 10 and 5000 characters.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Sanitize all data before saving
      const sanitizedData = {
        user_id: currentUser?.id || null,
        name: sanitizeInput(formData.name),
        email: sanitizeInput(formData.email).toLowerCase().trim(),
        phone: formData.phone ? sanitizeInput(formData.phone) : null,
        subject: sanitizeInput(formData.subject),
        message: sanitizeInput(formData.message)
      };

      // 1. Save to Database
      const { error: dbError } = await supabase.from('enquiries').insert(sanitizedData);

      if (dbError) throw dbError;

      // 2. Call Edge Function
      const { error: fnError } = await supabase.functions.invoke('send-enquiry-email', {
        body: JSON.stringify(sanitizedData)
      });

      if (fnError) {
          console.error("Edge function error:", fnError);
          // We don't block success if only email fails, but good to log
      }

      toast({
        title: "Enquiry Sent!",
        description: "We have received your message and will get back to you shortly.",
      });

      // Reset form
      setFormData({
        name: currentUser?.user_metadata?.name || '',
        email: currentUser?.email || '',
        phone: '',
        subject: '',
        message: ''
      });

    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to send enquiry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="enquiry-name" className="text-sm font-medium text-gray-600">Your Name</label>
          <Input 
            id="enquiry-name"
            required 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            placeholder=""
            className="text-gray-900" 
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="enquiry-email" className="text-sm font-medium text-gray-600">Email Address</label>
          <Input 
            id="enquiry-email"
            required 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            placeholder=""
            className="text-gray-900" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="enquiry-phone" className="text-sm font-medium text-gray-600">Phone Number</label>
          <Input 
            id="enquiry-phone"
            type="tel" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange} 
            placeholder=""
            className="text-gray-900" 
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="enquiry-subject" className="text-sm font-medium text-gray-600">Subject</label>
          <Input 
            id="enquiry-subject"
            required 
            name="subject" 
            value={formData.subject} 
            onChange={handleChange} 
            placeholder=""
            className="text-gray-900" 
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="enquiry-message" className="text-sm font-medium text-gray-600">Message</label>
        <textarea 
          id="enquiry-message"
          required 
          name="message" 
          value={formData.message} 
          onChange={handleChange} 
          rows={4}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900"
          placeholder=""
        />
      </div>

      <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" /> Send Message
          </>
        )}
      </Button>
    </form>
  );
};

export default EnquiryForm;