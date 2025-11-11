/**
 * Main App component
 * Sets up routing and layout
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Dashboard } from '@/pages/Dashboard';
import { Analytics } from '@/pages/Analytics';
import { WhatsAppPage } from '@/pages/WhatsApp/WhatsAppPage';
import { CallsPage } from '@/pages/Calls/CallsPage';
import { InboundCall } from '@/pages/Calls/InboundCall';
import { OutboundCall } from '@/pages/Calls/OutboundCall';

function App() {
  // Use basename for GitHub Pages deployment
  const basename = import.meta.env.BASE_URL || '/';
  
  return (
    <BrowserRouter basename={basename}>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/whatsapp" element={<WhatsAppPage />} />
          <Route path="/calls" element={<CallsPage />} />
          <Route path="/calls/inbound" element={<InboundCall />} />
          <Route path="/calls/outbound" element={<OutboundCall />} />
          <Route path="/settings" element={<div className="card"><h2 className="text-2xl font-bold">Settings</h2><p className="text-gray-600 mt-2">Settings page coming soon...</p></div>} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;

