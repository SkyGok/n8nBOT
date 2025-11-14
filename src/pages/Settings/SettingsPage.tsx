/**
 * Settings page component
 * Manages integration settings (WhatsApp, Telegram, Instagram)
 * Stores settings in localStorage and triggers n8n webhooks
 */

import React, { useState, useEffect } from 'react';
import { IntegrationSettings } from '@/types/settings';
import { loadSettings, saveSettings, updateIntegrationSetting } from '@/services/settings';
import { testWhatsAppConnection, testTelegramConnection, testInstagramConnection, testN8nConnection } from '@/services/n8n';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<IntegrationSettings>(loadSettings());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    // Load settings on mount
    setSettings(loadSettings());
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const handleToggle = (integration: 'whatsapp' | 'telegram' | 'instagram', enabled: boolean) => {
    const updated = updateIntegrationSetting(integration, { enabled });
    setSettings(updated);
    
    // Trigger n8n webhook if configured
    const webhookUrl = updated[integration].webhookUrl;
    if (webhookUrl && enabled) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'integration_toggle',
          service: integration,
          enabled: true,
        }),
      }).catch((error) => {
        console.error(`Error notifying n8n about ${integration} toggle:`, error);
      });
    }
  };

  const handleApiKeyChange = (
    integration: 'whatsapp' | 'telegram' | 'instagram',
    field: 'apiKey' | 'botToken' | 'token',
    value: string
  ) => {
    const updated = updateIntegrationSetting(integration, {
      [field]: value,
    });
    setSettings(updated);
  };

  const handleWebhookUrlChange = (
    integration: 'whatsapp' | 'telegram' | 'instagram' | 'n8n',
    field: 'webhookUrl' | 'calendarWebhookUrl' | 'testWebhookUrl',
    value: string
  ) => {
    if (integration === 'n8n') {
      const updated = {
        ...settings,
        n8n: {
          ...settings.n8n,
          [field]: value,
        },
      };
      saveSettings(updated);
      setSettings(updated);
    } else {
      const updated = updateIntegrationSetting(integration, {
        webhookUrl: value,
      });
      setSettings(updated);
    }
  };

  const handleTestConnection = async (
    service: 'whatsapp' | 'telegram' | 'instagram' | 'n8n',
    webhookUrl?: string
  ) => {
    let url: string | undefined;
    
    if (webhookUrl) {
      url = webhookUrl;
    } else if (service === 'n8n') {
      url = settings.n8n.testWebhookUrl;
    } else {
      const integrationSettings = settings[service];
      url = integrationSettings?.webhookUrl;
    }
    
    if (!url) {
      showToast(`${service} webhook URL is required`, 'error');
      return;
    }

    setTesting(service);
    try {
      let result;
      switch (service) {
        case 'whatsapp':
          result = await testWhatsAppConnection(url, settings.whatsapp.apiKey);
          break;
        case 'telegram':
          result = await testTelegramConnection(url, settings.telegram.botToken);
          break;
        case 'instagram':
          result = await testInstagramConnection(url, settings.instagram.token);
          break;
        case 'n8n':
          result = await testN8nConnection(url);
          break;
      }
      
      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast(`Failed to test ${service} connection`, 'error');
    } finally {
      setTesting(null);
    }
  };

  const IntegrationSection: React.FC<{
    title: string;
    integration: 'whatsapp' | 'telegram' | 'instagram';
    icon: React.ReactNode;
  }> = ({ title, integration, icon }) => {
    const integrationSettings = settings[integration];

    const getApiKeyValue = (): string => {
      if (integration === 'whatsapp') {
        return settings.whatsapp.apiKey || '';
      }
      if (integration === 'telegram') {
        return settings.telegram.botToken || '';
      }
      return settings.instagram.token || '';
    };

    const handleApiKeyInputChange = (value: string) => {
      if (integration === 'whatsapp') {
        handleApiKeyChange(integration, 'apiKey', value);
      } else if (integration === 'telegram') {
        handleApiKeyChange(integration, 'botToken', value);
      } else {
        handleApiKeyChange(integration, 'token', value);
      }
    };

    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-gray-600">{icon}</div>
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={integrationSettings.enabled}
              onChange={(e) => handleToggle(integration, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        {integrationSettings.enabled && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {integration === 'whatsapp' ? 'WhatsApp API Key' : integration === 'telegram' ? 'Telegram Bot Token' : 'Instagram Token'}
              </label>
              <input
                type="password"
                value={getApiKeyValue()}
                onChange={(e) => handleApiKeyInputChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={`Enter ${title} ${integration === 'whatsapp' ? 'API key' : integration === 'telegram' ? 'bot token' : 'token'}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={integrationSettings.webhookUrl || ''}
                  onChange={(e) => handleWebhookUrlChange(integration, 'webhookUrl', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://your-n8n-instance.com/webhook/..."
                />
                <button
                  onClick={() => handleTestConnection(integration)}
                  disabled={testing === integration || !integrationSettings.webhookUrl}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {testing === integration ? 'Testing...' : 'Test'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your integrations and API keys</p>
      </div>

      {/* Integrations Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Integrations</h2>
        
        <IntegrationSection
          title="WhatsApp"
          integration="whatsapp"
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          }
        />

        <IntegrationSection
          title="Telegram"
          integration="telegram"
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          }
        />

        <IntegrationSection
          title="Instagram"
          integration="instagram"
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          }
        />
      </div>

      {/* n8n Webhook Settings */}
      <div className="card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">n8n Webhooks</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calendar Webhook URL
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={settings.n8n.calendarWebhookUrl || ''}
                onChange={(e) => handleWebhookUrlChange('n8n', 'calendarWebhookUrl', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://your-n8n-instance.com/webhook/calendar"
              />
              <button
                onClick={() => handleTestConnection('n8n', settings.n8n.calendarWebhookUrl)}
                disabled={testing === 'n8n' || !settings.n8n.calendarWebhookUrl}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {testing === 'n8n' ? 'Testing...' : 'Test'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Webhook URL for calendar event synchronization with Google Calendar
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Webhook URL
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={settings.n8n.testWebhookUrl || ''}
                onChange={(e) => handleWebhookUrlChange('n8n', 'testWebhookUrl', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://your-n8n-instance.com/webhook/test"
              />
              <button
                onClick={() => handleTestConnection('n8n', settings.n8n.testWebhookUrl)}
                disabled={testing === 'n8n-test' || !settings.n8n.testWebhookUrl}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {testing === 'n8n-test' ? 'Testing...' : 'Test'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              General webhook URL for testing connections
            </p>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-md shadow-lg ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

