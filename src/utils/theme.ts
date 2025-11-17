/**
 * Theme Utility Functions
 * Handles theme initialization and application
 */

export type Theme = 'light' | 'dark' | 'system';

/**
 * Apply theme to the document
 * Adds/removes 'dark' class on <html> element
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') {
    return; // SSR safety
  }
  
  const html = document.documentElement;
  
  // Remove existing theme classes
  html.classList.remove('light', 'dark');
  
  if (theme === 'system') {
    // Use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      html.classList.add('dark');
    } else {
      html.classList.add('light');
    }
  } else {
    html.classList.add(theme);
  }
  
  // Debug: Log theme application (remove in production if needed)
  console.log(`[Theme] Applied theme: ${theme}, HTML classes:`, html.className);
}

/**
 * Get system theme preference
 */
export function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Get saved theme from localStorage
 */
export function getSavedTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'system';
  }

  const saved = localStorage.getItem('appSettings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.theme && ['light', 'dark', 'system'].includes(parsed.theme)) {
        return parsed.theme as Theme;
      }
    } catch {
      // If parsing fails, use default
    }
  }

  return 'system';
}

/**
 * Initialize theme on app load
 * Call this in main.tsx or App.tsx
 */
export function initializeTheme(): void {
  const theme = getSavedTheme();
  applyTheme(theme);
}

