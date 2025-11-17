/**
 * i18n Context
 * Provides translation functionality throughout the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import enTranslations from '@/locales/en.json';
import trTranslations from '@/locales/tr.json';
import esTranslations from '@/locales/es.json';
import itTranslations from '@/locales/it.json';

export type Language = 'en' | 'tr' | 'es' | 'it';

type Translations = typeof enTranslations;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations: Record<Language, Translations> = {
  en: enTranslations,
  tr: trTranslations,
  es: esTranslations,
  it: itTranslations,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

/**
 * Get nested translation value by key path (e.g., "common.dashboard")
 */
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Load from localStorage or use default
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appSettings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.language && ['en', 'tr', 'es', 'it'].includes(parsed.language)) {
            return parsed.language as Language;
          }
        } catch {
          // If parsing fails, use default
        }
      }
    }
    return 'en';
  });

  // Update localStorage when language changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appSettings');
      let settings = { language: 'en', theme: 'system' };
      
      if (saved) {
        try {
          settings = JSON.parse(saved);
        } catch {
          // If parsing fails, use defaults
        }
      }
      
      settings.language = language;
      localStorage.setItem('appSettings', JSON.stringify(settings));
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = getNestedValue(translations[language], key);
    
    // Replace parameters if provided
    if (params && Object.keys(params).length > 0) {
      translation = Object.entries(params).reduce(
        (text, [paramKey, paramValue]) => text.replace(`{{${paramKey}}}`, String(paramValue)),
        translation
      );
    }
    
    return translation;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

