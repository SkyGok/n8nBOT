/**
 * Header component for the dashboard
 * Displays app title and navigation with toggleable menu button
 */

import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useTenant } from '@/contexts/TenantContext';

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
  onNotificationsClick: () => void;
  notificationsOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, sidebarOpen, onNotificationsClick, notificationsOpen }) => {
  const { t } = useI18n();
  const { tenant, availableTenants, isAdmin, isOwner, switchTenant } = useTenant();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTenantSwitch = async (tenantId: string) => {
    await switchTenant(tenantId);
    setDropdownOpen(false);
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-30 transition-colors duration-200" role="banner">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Menu toggle button - visible on all screen sizes */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation transition-colors"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            aria-expanded={sidebarOpen}
          >
            {/* Menu icon (hamburger) - always visible */}
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          
          <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('common.appTitle')}</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">{t('common.appSubtitle')}</p>
            </div>
            
            {/* Tenant name with dropdown for admins only (owners cannot switch) */}
            {tenant && (
              <div className="relative" ref={dropdownRef}>
                {isAdmin && !isOwner && availableTenants.length > 1 ? (
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                  >
                    <span className="font-medium text-sm sm:text-base">{tenant.name}</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-150 ease-out ${dropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : (
                  <div className="px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                    <span className="font-medium text-sm sm:text-base text-primary-700 dark:text-primary-300">{tenant.name}</span>
                  </div>
                )}
                
                {/* Dropdown menu - only for admins (not owners) */}
                {dropdownOpen && isAdmin && !isOwner && availableTenants.length > 1 && (
                  <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 dropdown-animation">
                    {availableTenants.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleTenantSwitch(t.id)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          tenant.id === t.id
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{t.name}</span>
                          {tenant.id === t.id && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        {t.role && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{t.role}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <nav aria-label="Main navigation">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={onNotificationsClick}
              className={`relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md p-2 sm:px-3 sm:py-2 touch-manipulation transition-colors ${
                notificationsOpen ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
              aria-label={t('common.notifications')}
              aria-expanded={notificationsOpen}
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

