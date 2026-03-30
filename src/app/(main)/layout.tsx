'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import LoadingScreen from '@/components/LoadingScreen';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) return <LoadingScreen />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <main className="md:ml-56 pb-20 md:pb-4 min-h-screen">
        <div className="max-w-3xl mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

