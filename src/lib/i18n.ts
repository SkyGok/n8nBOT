/**
 * i18n (Internationalization) Structure
 * 
 * This file prepares the i18n structure for future translation implementation.
 * Currently, translations are not active, but the structure is ready.
 * 
 * TODO: When ready to implement translations:
 * 1. Install a translation library (e.g., react-i18next, i18next)
 * 2. Create translation files in src/locales/{lang}/common.json
 * 3. Initialize i18n with the selected library
 * 4. Use translation functions in components
 */

// ============================================
// SUPPORTED LANGUAGES
// ============================================

export type SupportedLanguage = 'tr' | 'en' | 'es' | 'it';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['tr', 'en', 'es', 'it'];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  tr: 'Turkish',
  en: 'English',
  es: 'Spanish',
  it: 'Italian',
};

// ============================================
// DEFAULT LANGUAGE
// ============================================

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// ============================================
// i18n CONFIGURATION (Placeholder)
// ============================================

/**
 * Get current language from localStorage or use default
 */
export function getCurrentLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const saved = localStorage.getItem('appSettings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.language && SUPPORTED_LANGUAGES.includes(parsed.language)) {
        return parsed.language as SupportedLanguage;
      }
    } catch {
      // If parsing fails, use default
    }
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Set current language
 * TODO: Integrate with i18n library when implemented
 */
export function setCurrentLanguage(language: SupportedLanguage): void {
  // This will be implemented when i18n library is added
  // For now, it's just a placeholder
  console.log(`[i18n] Language changed to: ${language}`);
}

// ============================================
// TRANSLATION FUNCTION (Placeholder)
// ============================================

/**
 * Translation function placeholder
 * TODO: Replace with actual i18n library function
 * 
 * Example usage (when implemented):
 *   t('settings.title') // Returns translated string
 *   t('settings.language', { lang: 'English' }) // With interpolation
 */
export function t(key: string, _params?: Record<string, string | number>): string {
  // Placeholder implementation
  // When i18n is implemented, this will return actual translations
  // _params is prefixed with underscore to indicate it's intentionally unused
  return key;
}

// ============================================
// TRANSLATION KEYS (Reference)
// ============================================

/**
 * Translation keys that will be used throughout the application
 * This is a reference for future translation files
 */
export const TRANSLATION_KEYS = {
  // Settings Page
  settings: {
    title: 'settings.title',
    subtitle: 'settings.subtitle',
    language: {
      title: 'settings.language.title',
      subtitle: 'settings.language.subtitle',
      current: 'settings.language.current',
    },
    theme: {
      title: 'settings.theme.title',
      subtitle: 'settings.theme.subtitle',
      current: 'settings.theme.current',
      light: 'settings.theme.light',
      dark: 'settings.theme.dark',
      system: 'settings.theme.system',
    },
    info: {
      title: 'settings.info.title',
      message: 'settings.info.message',
    },
  },
} as const;

