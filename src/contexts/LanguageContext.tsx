'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Locale, TranslationKey, getTranslation } from '@/lib/i18n';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('th');

  useEffect(() => {
    const saved = localStorage.getItem('stranger-chat-locale') as Locale;
    if (saved && (saved === 'en' || saved === 'th')) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('stranger-chat-locale', newLocale);
  }, []);

  const t = useCallback((key: TranslationKey) => {
    return getTranslation(locale, key);
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
