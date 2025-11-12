/**
 * Application entry point
 * Initializes React app and MSW (if in development)
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize MSW in development (only if Supabase is not configured)
async function enableMocking() {
  // Skip MSW if Supabase is configured
  const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true' || 
                       (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  
  if (import.meta.env.MODE !== 'development' || useSupabase) {
    return;
  }

  const { worker } = await import('./mocks/browser');
  
  // Start the MSW worker
  return worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
  });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

