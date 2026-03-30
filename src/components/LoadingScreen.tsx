'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LoadingScreen() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="matching-ring mb-4" style={{ width: 40, height: 40 }} />
      <p className="text-sm text-muted">{t('appName')}</p>
    </div>
  );
}
