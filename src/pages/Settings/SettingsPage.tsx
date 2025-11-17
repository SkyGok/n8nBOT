/**
 * Settings Page Component
 * Clean, modern settings page with language and theme selection
 * Built from scratch - minimal and focused
 */

import React, { useState, useEffect } from 'react';
import { getSystemTheme, type Theme } from '@/utils/theme';
import { useI18n } from '@/contexts/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';

// ============================================
// TYPES & INTERFACES
// ============================================

type Language = 'tr' | 'en' | 'es' | 'it';

interface SettingsState {
  language: Language;
  theme: Theme;
}

// ============================================
// LANGUAGE OPTIONS
// ============================================

const LANGUAGE_OPTIONS: { value: Language; label: string; flag: string }[] = [
  { value: 'tr', label: 'Turkish', flag: '🇹🇷' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'es', label: 'Spanish', flag: '🇪🇸' },
  { value: 'it', label: 'Italian', flag: '🇮🇹' },
];

// ============================================
// THEME OPTIONS
// ============================================

const THEME_OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
];

// ============================================
// COOKIE FUNCTIONS (Commented out for now)
// ============================================

/*
 * TODO: Implement cookie persistence for settings
 * 
 * These functions will be used to save and load settings from cookies
 * when cookie functionality is added to the application.
 * 
 * Example implementation:
 * 
 * function saveThemeToCookies(theme: Theme): void {
 *   document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
 * }
 * 
 * function saveLanguageToCookies(lang: Language): void {
 *   document.cookie = `language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
 * }
 * 
 * function loadSettingsFromCookies(): Partial<SettingsState> {
 *   const cookies = document.cookie.split(';').reduce((acc, cookie) => {
 *     const [key, value] = cookie.trim().split('=');
 *     acc[key] = value;
 *     return acc;
 *   }, {} as Record<string, string>);
 * 
 *   return {
 *     theme: cookies.theme as Theme | undefined,
 *     language: cookies.language as Language | undefined,
 *   };
 * }
 */

// ============================================
// THEME UTILITY FUNCTIONS
// ============================================
// Theme utilities are now imported from @/utils/theme

// ============================================
// SETTINGS PAGE COMPONENT
// ============================================

export const SettingsPage: React.FC = () => {
  const { language: currentLanguage, setLanguage, t } = useI18n();
  const { theme: currentTheme, setTheme } = useTheme();
  
  // State for settings - sync with contexts
  const [settings, setSettings] = useState<SettingsState>(() => {
    return {
      language: currentLanguage,
      theme: currentTheme,
    };
  });
  
  // Sync with i18n context
  useEffect(() => {
    if (currentLanguage !== settings.language) {
      setSettings((prev) => ({ ...prev, language: currentLanguage }));
    }
  }, [currentLanguage, settings.language]);
  
  // Sync with theme context
  useEffect(() => {
    if (currentTheme !== settings.theme) {
      setSettings((prev) => ({ ...prev, theme: currentTheme }));
    }
  }, [currentTheme, settings.theme]);

  // Handle language change
  const handleLanguageChange = (language: Language) => {
    setLanguage(language); // Update i18n context
    setSettings((prev) => ({ ...prev, language }));
  };

  // Handle theme change
  const handleThemeChange = (theme: Theme) => {
    setTheme(theme); // Update theme context (this will apply the theme)
    setSettings((prev) => ({ ...prev, theme }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
          {t('settings.title')}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Language Selection */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {t('settings.language.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('settings.language.subtitle')}
          </p>
        </div>

        {/* Language Selector - Segmented Control Style */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleLanguageChange(option.value)}
              className={`
                flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                touch-manipulation min-h-[80px]
                ${
                  settings.language === option.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
              aria-pressed={settings.language === option.value}
              aria-label={`Select ${option.label} language`}
            >
              <span className="text-2xl mb-2">{option.flag}</span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Current Selection Display */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('settings.language.current')}: <span className="font-medium text-gray-900 dark:text-gray-100">
              {LANGUAGE_OPTIONS.find((opt) => opt.value === settings.language)?.label}
            </span>
          </p>
        </div>
      </div>

      {/* Theme Selection */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {t('settings.theme.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('settings.theme.subtitle')}
          </p>
        </div>

        {/* Theme Selector - Segmented Control Style */}
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleThemeChange(option.value)}
              className={`
                flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                touch-manipulation min-h-[100px]
                ${
                  settings.theme === option.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
              aria-pressed={settings.theme === option.value}
              aria-label={`Select ${option.label} theme`}
            >
              <span className="text-3xl mb-2">{option.icon}</span>
              <span className="text-sm font-medium">{t(`settings.theme.${option.value}`)}</span>
              {option.value === 'system' && (
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {getSystemTheme() === 'dark' ? t('settings.theme.dark') : t('settings.theme.light')}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Current Selection Display */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('settings.theme.current')}: <span className="font-medium text-gray-900 dark:text-gray-100">
              {t(`settings.theme.${settings.theme}`)}
              {settings.theme === 'system' && ` (${getSystemTheme() === 'dark' ? t('settings.theme.dark') : t('settings.theme.light')})`}
            </span>
          </p>
        </div>
      </div>

      {/* Info Section */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              {t('settings.info.title')}
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t('settings.info.message')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

