/**
 * Main App component
 * Sets up routing and layout with multi-tenant support
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from '@/contexts/I18nContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Dashboard } from '@/pages/Dashboard';
import { Analytics } from '@/pages/Analytics';
import { ROIAnalysis } from '@/pages/Analytics/ROIAnalysis';
import { WhatsAppPage } from '@/pages/WhatsApp/WhatsAppPage';
import { CallsPage } from '@/pages/Calls/CallsPage';
import { InboundCall } from '@/pages/Calls/InboundCall';
import { OutboundCall } from '@/pages/Calls/OutboundCall';
import { CalendarPage } from '@/pages/Calendar/CalendarPage';
import { SettingsPage } from '@/pages/Settings/SettingsPage';
import { Login } from '@/pages/Auth/Login';

function App() {
  // Use basename for GitHub Pages deployment
  const basename = import.meta.env.BASE_URL || '/';
  
  return (
    <ThemeProvider>
      <I18nProvider>
        <TenantProvider>
          <BrowserRouter basename={basename}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes - require authentication and tenant */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Analytics />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics/roi"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ROIAnalysis />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/whatsapp"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <WhatsAppPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/whatsapp/inbound"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <InboundCall />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/whatsapp/outbound"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <OutboundCall />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calls"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CallsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calls/inbound"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <InboundCall />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calls/outbound"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <OutboundCall />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CalendarPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <SettingsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </TenantProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;

