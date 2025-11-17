/**
 * Theme Context
 * Provides theme management throughout the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { applyTheme, getSavedTheme, type Theme } from '@/utils/theme';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Load from localStorage on mount
    return getSavedTheme();
  });

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme);
    
    // Save to localStorage
    const saved = localStorage.getItem('appSettings');
    let settings = { language: 'en', theme: 'system' };
    
    if (saved) {
      try {
        settings = JSON.parse(saved);
      } catch {
        // If parsing fails, use defaults
      }
    }
    
    settings.theme = theme;
    localStorage.setItem('appSettings', JSON.stringify(settings));
    
    // Listen for system theme changes if using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme('system');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

