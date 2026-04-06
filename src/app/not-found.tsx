'use client';

import { useRouter } from 'next/navigation';
import { Leaf } from 'lucide-react';

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="mori-theme min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#11110B', color: '#F4EED9' }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-[#26231d] border border-[#3b3324] flex items-center justify-center mx-auto mb-4">
          <Leaf size={28} className="text-[#8B6D3B]" />
        </div>
        <h1 className="text-6xl font-bold text-[#3b3324]">404</h1>
        <p className="text-base text-[#84796B] mt-2 mb-6">Page not found</p>
        <button
          onClick={() => router.push('/home')}
          className="mori-btn-primary px-6 py-2.5 text-sm rounded-lg"
        >
          Go home
        </button>
      </div>
    </div>
  );
}
