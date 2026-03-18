import React from 'react';
import { cn } from '@/lib/utils';

const AhnuphaLogo = ({ className, logoUrl }) => {
  const defaultLogo = "https://lh3.googleusercontent.com/d/1m7qh2LnpqeBVmUK8bNrLZ05Yj9PMdilT";
  
  return (
    <div className="relative flex items-center justify-start m-0 p-0">
      <img
        src={logoUrl || defaultLogo}
        alt="Ahnupha"
        className={cn("w-auto object-contain object-left block", className || "h-12")}
        style={{ display: 'block', margin: 0, padding: 0, maxWidth: '100%' }}
        onError={(e) => {
          // Fallback to original logo if Google Drive link fails
          e.target.src = "https://horizons-cdn.hostinger.com/a120f215-a5a4-4e6b-834f-b5712b2ce12c/2e5fb823bfbb7499382af35095c1b1c0.png";
        }}
      />
    </div>
  );
};

export default AhnuphaLogo;