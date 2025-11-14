/**
 * Settings service
 * Handles loading and saving integration settings to localStorage
 */

import { IntegrationSettings, DEFAULT_SETTINGS } from '@/types/settings';

const SETTINGS_STORAGE_KEY = 'integration_settings';

/**
 * Load settings from localStorage
 */
export function loadSettings(): IntegrationSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    
    const parsed = JSON.parse(stored);
    // Merge with defaults to ensure all fields exist
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      whatsapp: { ...DEFAULT_SETTINGS.whatsapp, ...parsed.whatsapp },
      telegram: { ...DEFAULT_SETTINGS.telegram, ...parsed.telegram },
      instagram: { ...DEFAULT_SETTINGS.instagram, ...parsed.instagram },
      n8n: { ...DEFAULT_SETTINGS.n8n, ...parsed.n8n },
    };
  } catch (error) {
    console.error('[Settings Service] Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: IntegrationSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('[Settings Service] Error saving settings:', error);
    throw new Error('Failed to save settings');
  }
}

/**
 * Update a specific integration setting
 */
export function updateIntegrationSetting(
  integration: 'whatsapp' | 'telegram' | 'instagram' | 'n8n',
  updates: Partial<IntegrationSettings['whatsapp'] | IntegrationSettings['telegram'] | IntegrationSettings['instagram'] | IntegrationSettings['n8n']>
): IntegrationSettings {
  const current = loadSettings();
  const updated = {
    ...current,
    [integration]: {
      ...current[integration],
      ...updates,
    },
  };
  saveSettings(updated);
  return updated;
}

