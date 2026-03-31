'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LoadingScreen() {
  const { t } = useLanguage();

  return (
    <div className="mori-theme min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#11110B' }}>
      <div className="matching-ring mb-4" style={{ width: 40, height: 40 }} />
      <p className="text-sm text-[#84796B]">{t('appName')}</p>
    </div>
  );
}
