/**
 * Main layout component
 * Wraps the application with header, sidebar, and main content area
 * Responsive design with toggleable sidebar on all screen sizes
 */

import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { NotificationsSidebar } from './NotificationsSidebar';
import { PageTransition } from './PageTransition';

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

  // Notifications sidebar state
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleNotifications = () => {
    setNotificationsOpen((prev) => !prev);
  };

  const closeNotifications = () => {
    setNotificationsOpen(false);
  };

  // Close sidebar when clicking outside on mobile/tablet
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close on mobile/tablet (when sidebar is overlay)
      if (window.innerWidth < 1024 && sidebarOpen) {
        const target = event.target as HTMLElement;
        const sidebar = document.querySelector('[data-sidebar]');
        const header = document.querySelector('header');
        const notificationsSidebar = document.querySelector('[data-notifications-sidebar]');
        
        // Don't close if clicking on sidebar, notifications sidebar, or header
        if (sidebar && sidebar.contains(target)) {
          return;
        }
        if (notificationsSidebar && notificationsSidebar.contains(target)) {
          return;
        }
        if (header && header.contains(target)) {
          return;
        }
        
        // Close if clicking anywhere else
        closeSidebar();
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [sidebarOpen]);

  // Close notifications sidebar when clicking outside on mobile/tablet
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close on mobile/tablet (when notifications sidebar is overlay)
      if (window.innerWidth < 1024 && notificationsOpen) {
        const target = event.target as HTMLElement;
        const sidebar = document.querySelector('[data-sidebar]');
        const header = document.querySelector('header');
        const notificationsSidebar = document.querySelector('[data-notifications-sidebar]');
        
        // Don't close if clicking on sidebar, notifications sidebar, or header
        if (sidebar && sidebar.contains(target)) {
          return;
        }
        if (notificationsSidebar && notificationsSidebar.contains(target)) {
          return;
        }
        if (header && header.contains(target)) {
          return;
        }
        
        // Close if clicking anywhere else
        closeNotifications();
      }
    };

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [notificationsOpen]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header 
        onMenuClick={toggleSidebar} 
        sidebarOpen={sidebarOpen}
        onNotificationsClick={toggleNotifications}
        notificationsOpen={notificationsOpen}
      />
      <div className="flex relative" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Mobile/Tablet sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-200"
            onClick={closeSidebar}
            aria-hidden="true"
            style={{ willChange: 'opacity' }}
          />
        )}
        
        {/* Sidebar */}
        <div 
          data-sidebar
          className={`fixed lg:static top-16 lg:top-0 bottom-0 left-0 z-50 transform transition-transform duration-200 ease-out ${
            sidebarOpen 
              ? 'translate-x-0' 
              : '-translate-x-full lg:translate-x-0 lg:hidden'
          }`}
          style={{ willChange: 'transform' }}
        >
          <Sidebar 
            isOpen={sidebarOpen}
            onClose={closeSidebar} 
            onToggle={toggleSidebar}
          />
        </div>
        
        {/* Main content */}
        <main 
          className="flex-1 p-4 sm:p-6 lg:p-6 w-full" 
          role="main"
        >
          <PageTransition>
            {children}
          </PageTransition>
        </main>

        {/* Notifications Sidebar */}
        <NotificationsSidebar 
          isOpen={notificationsOpen}
          onClose={closeNotifications}
        />
      </div>
    </div>
  );
};

