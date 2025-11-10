/**
 * Main App component
 * Sets up routing and layout
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Dashboard } from '@/pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<div className="card"><h2 className="text-2xl font-bold">Analytics</h2><p className="text-gray-600 mt-2">Analytics page coming soon...</p></div>} />
          <Route path="/settings" element={<div className="card"><h2 className="text-2xl font-bold">Settings</h2><p className="text-gray-600 mt-2">Settings page coming soon...</p></div>} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;

