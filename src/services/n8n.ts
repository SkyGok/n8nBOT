/**
 * n8n webhook service
 * Handles communication with n8n webhooks for testing connections
 */

export interface TestConnectionResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Test connection to an n8n webhook
 */
export async function testN8nConnection(webhookUrl: string): Promise<TestConnectionResult> {
  if (!webhookUrl || !webhookUrl.trim()) {
    return {
      success: false,
      message: 'Webhook URL is required',
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'test',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Connection failed: ${response.status} ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText,
        },
      };
    }

    const data = await response.json().catch(() => ({}));
    
    return {
      success: true,
      message: 'Connection successful',
      details: data,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      details: {
        error: String(error),
      },
    };
  }
}

/**
 * Test WhatsApp integration via n8n
 */
export async function testWhatsAppConnection(
  webhookUrl: string,
  apiKey?: string
): Promise<TestConnectionResult> {
  if (!webhookUrl) {
    return {
      success: false,
      message: 'WhatsApp webhook URL is required',
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
      body: JSON.stringify({
        action: 'test',
        service: 'whatsapp',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `WhatsApp connection failed: ${response.status} ${response.statusText}`,
      };
    }

    return {
      success: true,
      message: 'WhatsApp connection successful',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Test Telegram integration via n8n
 */
export async function testTelegramConnection(
  webhookUrl: string,
  botToken?: string
): Promise<TestConnectionResult> {
  if (!webhookUrl) {
    return {
      success: false,
      message: 'Telegram webhook URL is required',
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'test',
        service: 'telegram',
        botToken,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Telegram connection failed: ${response.status} ${response.statusText}`,
      };
    }

    return {
      success: true,
      message: 'Telegram connection successful',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Test Instagram integration via n8n
 */
export async function testInstagramConnection(
  webhookUrl: string,
  token?: string
): Promise<TestConnectionResult> {
  if (!webhookUrl) {
    return {
      success: false,
      message: 'Instagram webhook URL is required',
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        action: 'test',
        service: 'instagram',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Instagram connection failed: ${response.status} ${response.statusText}`,
      };
    }

    return {
      success: true,
      message: 'Instagram connection successful',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

