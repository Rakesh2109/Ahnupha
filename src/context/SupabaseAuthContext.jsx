import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase config and single client (moved from customSupabaseClient.js – no second instance)
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rritvztvwtikrrqphjlq.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyaXR2enR2d3Rpa3JycXBoamxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODU3NTYsImV4cCI6MjA4NDU2MTc1Nn0.0Yq_VLJEpPEk2gxdjvoUJLPN01KA6MDRV8qC36uqk-Y';
// Site URL for email links – use ahnupha.com in production (no localhost)
export const siteUrl = import.meta.env.VITE_SITE_URL || 'https://ahnupha.com';

let supabaseInstance = null;
function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'sb-rritvztvwtikrrqphjlq-auth-token',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  }
  return supabaseInstance;
}

const supabase = getSupabaseClient();
export { supabase };
export const customSupabaseClient = supabase;
export default customSupabaseClient;

const SupabaseAuthContext = createContext({});

export const useSupabaseAuth = () => useContext(SupabaseAuthContext);

export const SupabaseAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Suppress console errors for refresh token issues
    const originalError = console.error;
    console.error = (...args) => {
      // Filter out expected errors from console (refresh tokens, phone checks, login errors, etc.)
      const errorString = JSON.stringify(args);
      if (errorString.includes('refresh_token_not_found') || 
          errorString.includes('Invalid Refresh Token') ||
          errorString.includes('Refresh Token Not Found') ||
          errorString.includes('check_phone_exists') ||
          errorString.includes('normalized_phone') ||
          errorString.includes('PGRST116') ||
          errorString.includes('42703') ||
          errorString.includes('profiles?select=id') ||
          errorString.includes('rpc/check_phone_exists') ||
          (errorString.includes('400 (Bad Request)') && errorString.includes('profiles')) ||
          (errorString.includes('400 (Bad Request)') && errorString.includes('token?grant_type=password')) ||
          (errorString.includes('400 (Bad Request)') && errorString.includes('auth/v1/token'))) {
        // Silently ignore expected errors (login failures are handled in UI)
        return;
      }
      originalError.apply(console, args);
    };

    // Check active session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setCurrentUser(session?.user ?? null);
        setIsLoading(false);
      })
      .catch((error) => {
        // Silently handle refresh token errors - these are expected when tokens expire
        if (error?.message?.includes('refresh_token') || error?.code === 'refresh_token_not_found') {
          // Clear invalid session silently
          setSession(null);
          setCurrentUser(null);
        } else {
          originalError('Error getting session:', error);
        }
        setIsLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Handle token refresh failures
      if (_event === 'TOKEN_REFRESHED' && !session) {
        // Token refresh failed - clear session silently
        setSession(null);
        setCurrentUser(null);
      } else {
        setSession(session);
        setCurrentUser(session?.user ?? null);
      }
      setIsLoading(false);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      // Restore original console.error
      console.error = originalError;
    };
  }, []);

  const signUp = async (email, password, metadata = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      // Use Edge Function to create user with Admin API (doesn't send Supabase email)
      // This creates the user and sends ONLY our custom verification email
      const userName = metadata?.name || email.split('@')[0].split('.')[0]
        .split('')
        .map((char, i) => i === 0 ? char.toUpperCase() : char)
        .join('');
      
      const response = await fetch(`${supabaseUrl}/functions/v1/custom-auth-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          email: email,
          type: 'signup',
          password: password,
          userName: userName,
          metadata: metadata,
          redirectTo: siteUrl
        })
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error?.toLowerCase() || '';
        // Check if user exists and is verified - only then block signup
        if (errorMsg.includes('already registered and verified')) {
          throw new Error('This email is already registered. Please sign in instead.');
        }
        // If user exists but not verified, the Edge Function will resend verification email
        // So we should allow the flow to continue
        if (errorMsg.includes('already registered') && !errorMsg.includes('verified')) {
          // User exists but unverified - verification email will be resent
          // Allow this to proceed as success
          return { 
            user: { 
              id: 'pending-verification',
              email: email,
              email_confirmed_at: null,
              created_at: new Date().toISOString()
            }, 
            session: null 
          };
        }
        throw new Error(result.error || 'Failed to create account. Please try again.');
      }

      // User created successfully OR verification email resent for unverified user
      // Return a mock user object (user exists but not confirmed yet)
      return { 
        user: { 
          id: 'pending-verification',
          email: email,
          email_confirmed_at: null,
          created_at: new Date().toISOString()
        }, 
        session: null 
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPassword = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        // Enhance error message for user not found
        const errorMsg = error.message?.toLowerCase() || '';
        if (errorMsg.includes('invalid login credentials') || errorMsg.includes('invalid credentials')) {
          // Supabase returns "Invalid login credentials" for both wrong password AND user not found
          // We'll let the LoginPage handle the specific messaging
          const enhancedError = new Error(error.message);
          enhancedError.code = error.code;
          enhancedError.status = error.status;
          enhancedError.isUserNotFound = errorMsg.includes('user not found') || errorMsg.includes('email not found');
          throw enhancedError;
        }
        throw error;
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setCurrentUser(null);
      setSession(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithOtpEmail = async (email) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/custom-auth-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          email: String(email ?? '').toLowerCase().trim(),
          type: 'send_otp',
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to send OTP');
      return { sent: true };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtpEmail = async (email, token) => {
    setIsLoading(true);
    setError(null);
    try {
      const code = String(token ?? '').trim().replace(/\D/g, '').slice(0, 6);
      const response = await fetch(`${supabaseUrl}/functions/v1/custom-auth-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          email: String(email ?? '').toLowerCase().trim(),
          type: 'verify_otp',
          code,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Invalid or expired code');
      if (result.redirect) {
        window.location.href = result.redirect;
        return;
      }
      throw new Error('Invalid response from server');
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/login` : `${siteUrl}/login`;
      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (err) throw err;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const resetPassword = async (email) => {
    setIsLoading(true);
    setError(null);
    try {
      // Send ONLY custom password reset email (no Supabase email)
      // Call Edge Function directly with fetch to avoid JWT authentication issues
      const response = await fetch(`${supabaseUrl}/functions/v1/custom-auth-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          email: email,
          type: 'reset_password',
          redirectTo: siteUrl
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send password reset email');
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const ensureProfile = async (user) => {
    if (!user?.id) return;
    try {
      const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : null);
      await supabase.from('profiles').upsert(
        {
          id: user.id,
          full_name: fullName || null,
          email: user.email || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id', ignoreDuplicates: false }
      );
    } catch (_) {
      // Non-blocking; profile may already exist from trigger
    }
  };

  const value = {
    currentUser,
    session,
    isLoading,
    error,
    signUp,
    signInWithPassword,
    signInWithOtpEmail,
    verifyOtpEmail,
    signInWithGoogle,
    signOut,
    resetPassword,
    ensureProfile,
    supabase,
    getSupabase: () => supabase,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};