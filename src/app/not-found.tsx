'use client';

import { useRouter } from 'next/navigation';

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <h1 className="text-7xl font-bold text-gray-200">404</h1>
      <p className="text-lg text-gray-500 mt-2 mb-6">Page not found</p>
      <button
        onClick={() => router.push('/home')}
        className="btn-primary px-6 py-2.5 text-sm"
      >
        Go home
      </button>
    </div>
  );
}
