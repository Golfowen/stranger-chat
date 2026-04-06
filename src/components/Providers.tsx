'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Suppress Firebase permission errors from appearing in Next.js dev overlay
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || event.reason?.toString() || '';
      if (
        msg.includes('Missing or insufficient permissions') ||
        msg.includes('INTERNAL ASSERTION FAILED') ||
        msg.includes('permission-denied') ||
        msg.includes('PERMISSION_DENIED')
      ) {
        event.preventDefault();
        console.warn('[StrangerChat] Firebase permission issue — please set up Firestore rules');
      }
    };

    const handleError = (event: ErrorEvent) => {
      const msg = event.message || '';
      if (
        msg.includes('Missing or insufficient permissions') ||
        msg.includes('INTERNAL ASSERTION FAILED') ||
        msg.includes('permission-denied') ||
        msg.includes('PERMISSION_DENIED')
      ) {
        event.preventDefault();
        console.warn('[StrangerChat] Firebase permission issue — please set up Firestore rules');
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1c1a16',
              color: '#F4EED9',
              border: '1px solid #3b3324',
              borderRadius: '10px',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            },
            success: {
              iconTheme: { primary: '#8B6D3B', secondary: '#1c1a16' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#1c1a16' },
            },
          }}
        />
      </AuthProvider>
    </LanguageProvider>
  );
}
