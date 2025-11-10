/**
 * Application entry point
 * Initializes React app and MSW (if in development)
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize MSW in development
async function enableMocking() {
  if (import.meta.env.MODE !== 'development') {
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

