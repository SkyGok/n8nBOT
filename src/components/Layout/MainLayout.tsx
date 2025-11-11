/**
 * Main layout component
 * Wraps the application with header, sidebar, and main content area
 * Responsive design with toggleable sidebar on all screen sizes
 */

import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Load sidebar state from localStorage, default to true on desktop, false on mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarOpen');
      if (saved !== null) {
        return saved === 'true';
      }
      // Default: open on desktop (>= 1024px), closed on mobile
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // Update sidebar state in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarOpen', sidebarOpen.toString());
  }, [sidebarOpen]);

  // Handle window resize - auto-close on mobile, auto-open on desktop if previously open
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // On desktop, restore saved state or default to open
        const saved = localStorage.getItem('sidebarOpen');
        if (saved === null || saved === 'true') {
          setSidebarOpen(true);
        }
      } else {
        // On mobile, always close when resizing to mobile
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />
      <div className="flex relative">
        {/* Mobile/Tablet sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        
        {/* Sidebar */}
        <div 
          className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen 
              ? 'translate-x-0' 
              : '-translate-x-full lg:translate-x-0 lg:hidden'
          }`}
        >
          <Sidebar 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)} 
            onToggle={toggleSidebar}
          />
        </div>
        
        {/* Main content */}
        <main 
          className="flex-1 p-4 sm:p-6 lg:p-6 w-full transition-all duration-300" 
          role="main"
        >
          {children}
        </main>
      </div>
    </div>
  );
};

