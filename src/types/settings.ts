/**
 * Settings types
 * Used for integration settings stored in localStorage
 */

export interface IntegrationSettings {
  whatsapp: {
    enabled: boolean;
    apiKey?: string;
    webhookUrl?: string;
  };
  telegram: {
    enabled: boolean;
    botToken?: string;
    webhookUrl?: string;
  };
  instagram: {
    enabled: boolean;
    token?: string;
    webhookUrl?: string;
  };
  n8n: {
    calendarWebhookUrl?: string;
    testWebhookUrl?: string;
  };
}

export const DEFAULT_SETTINGS: IntegrationSettings = {
  whatsapp: {
    enabled: false,
  },
  telegram: {
    enabled: false,
  },
  instagram: {
    enabled: false,
  },
  n8n: {},
};

