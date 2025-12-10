/**
 * n8n URL utilities
 * Handles conversion of localhost URLs to use Vite proxy in development
 */

/**
 * Converts a localhost n8n URL to use the Vite proxy in development mode
 * This allows the frontend to access local n8n instances through the proxy
 * 
 * @param url - The n8n webhook URL (e.g., http://localhost:5678/webhook/abc123)
 * @returns The URL to use (proxy URL in dev, original URL in production)
 */
export function getN8nWebhookUrl(url: string): string {
  if (!url) return url;
  
  // In development, convert localhost URLs to use the proxy
  if (import.meta.env.DEV) {
    // Check if it's a localhost URL
    const localhostPattern = /^https?:\/\/localhost(:\d+)?/i;
    const localhostPattern2 = /^https?:\/\/127\.0\.0\.1(:\d+)?/i;
    
    if (localhostPattern.test(url) || localhostPattern2.test(url)) {
      // Extract the path from the URL (everything after the host)
      const urlObj = new URL(url);
      const path = urlObj.pathname + urlObj.search;
      
      // Use the proxy path
      return `/n8n-proxy${path}`;
    }
  }
  
  // In production or for non-localhost URLs, return as-is
  return url;
}

/**
 * Get the actual n8n webhook URL from tenant config
 * Automatically handles localhost proxy conversion
 */
export function getTenantN8nWebhookUrl(baseUrl: string, path?: string): string {
  if (!baseUrl) return '';
  
  const fullUrl = path ? `${baseUrl}/${path.replace(/^\//, '')}` : baseUrl;
  return getN8nWebhookUrl(fullUrl);
}
