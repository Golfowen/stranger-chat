'use client';

import { useEffect } from 'react';
import { Leaf } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.warn('[StrangerChat] Page error:', error);
  }, [error]);

  return (
    <div className="mori-theme min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#11110B', color: '#F4EED9' }}>
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <Leaf size={28} className="text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-[#F4EED9] mb-2">Something went wrong</h2>
        <p className="text-sm text-[#84796B] mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="mori-btn-primary px-6 py-2.5 text-sm rounded-lg"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
