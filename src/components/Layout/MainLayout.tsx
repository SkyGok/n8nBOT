/**
 * Main layout component
 * Wraps the application with header, sidebar, and main content area
 */

import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6" role="main">
          {children}
        </main>
      </div>
    </div>
  );
};

