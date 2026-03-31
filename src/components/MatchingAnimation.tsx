'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function MatchingAnimation({ onCancel }: { onCancel: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 bg-[#11110B]/95 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="flex flex-col items-center gap-6 p-8">
        {/* Spinner */}
        <div className="relative flex items-center justify-center">
          <div className="matching-ring flex items-center justify-center">
            <div className="matching-ring-inner flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium text-[#F4EED9]">{t('matching')}</h3>
          <div className="flex items-center justify-center gap-1">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="mori-btn-outline rounded-lg px-6 py-2.5 text-sm"
        >
          {t('stopMatching')}
        </button>
      </div>
    </div>
  );
}
