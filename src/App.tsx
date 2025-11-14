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
import { CalendarPage } from '@/pages/Calendar/CalendarPage';
import { SettingsPage } from '@/pages/Settings/SettingsPage';

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
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;

