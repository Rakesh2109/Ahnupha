import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { currentUser, isLoading, ensureProfile } = useSupabaseAuth();
  const location = useLocation();
  const profileEnsured = useRef(false);

  useEffect(() => {
    if (currentUser?.id && ensureProfile && !profileEnsured.current) {
      profileEnsured.current = true;
      ensureProfile(currentUser);
    }
  }, [currentUser, ensureProfile]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;