import React, { createContext, useContext } from 'react';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';

// This context is now a wrapper around SupabaseAuthContext to maintain backward compatibility
// or it can be deprecated. For now, we will redirect calls to useSupabaseAuth.

const AuthContext = createContext();

export const useAuth = () => {
  // Redirect to useSupabaseAuth directly if possible, but to keep the hook signature:
  const { user, signIn, signUp, signOut, loading } = useSupabaseAuth();
  
  // Map Supabase functions to the generic names expected by components using this context
  return {
    user,
    login: signIn,
    register: (name, email, password) => signUp(email, password, { full_name: name }),
    logout: signOut,
    loading
  };
};

export const AuthProvider = ({ children }) => {
  // Since SupabaseAuthProvider is already wrapping the app in App.jsx, 
  // this provider might be redundant if we just use the hook.
  // However, to prevent errors if this component is still used in the tree:
  return <>{children}</>;
};