/**
 * Sidebar component for navigation
 * Provides navigation links and menu items with nested sub-items
 * Toggleable on all screen sizes
 */

import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/lib/supabase';
import { getDashboardRouteByRole, canAccessRoute } from '@/utils/routing';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  onToggle?: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  subItems?: NavItem[];
}

// Navigation items will be translated dynamically
// Note: Dashboard path will be overridden based on user role
const getNavItems = (t: (key: string) => string, dashboardPath: string = '/'): NavItem[] => [
  {
    label: t('common.dashboard'),
    path: dashboardPath,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: t('common.analytics'),
    path: '/analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    subItems: [
      {
        label: t('common.overview'),
        path: '/analytics',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
      {
        label: t('common.roiAnalysis'),
        path: '/analytics/roi',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: t('common.calls'),
    path: '/calls',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    subItems: [
      {
        label: t('common.inboundCalls'),
        path: '/calls/inbound',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        label: t('common.outboundCalls'),
        path: '/calls/outbound',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        ),
      },
    ],
  },
  {
    label: t('common.whatsapp'),
    path: '/whatsapp',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H7a5 5 0 01-5-5V7a5 5 0 015-5h10a5 5 0 015 5v4a5 5 0 01-5 5h-3l-4 4z" />
      </svg>
    ),
    subItems: [
      {
        label: t('common.messages'),
        path: '/whatsapp',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
      },
      {
        label: t('common.inboundCalls'),
        path: '/whatsapp/inbound',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        ),
      },
      {
        label: t('common.outboundCalls'),
        path: '/whatsapp/outbound',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        ),
      },
    ],
  },
  {
    label: t('common.calendar'),
    path: '/calendar',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: t('common.settings'),
    path: '/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];


export const Sidebar: React.FC<SidebarProps> = ({ onClose, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { isAdmin, isOwner, userRole, tenantName } = useTenant();
  
  // Get the correct dashboard route based on role
  const dashboardRoute = useMemo(() => {
    if (userRole && tenantName) {
      return getDashboardRouteByRole(userRole, tenantName);
    }
    return '/';
  }, [userRole, tenantName]);
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Auto-expand Calls if we're on a calls sub-page
    if (location.pathname.startsWith('/calls')) {
      return ['/calls'];
    }
    // Auto-expand WhatsApp if we're on a whatsapp sub-page
    if (location.pathname.startsWith('/whatsapp')) {
      return ['/whatsapp'];
    }
    // Auto-expand Analytics if we're on an analytics sub-page
    if (location.pathname.startsWith('/analytics')) {
      return ['/analytics'];
    }
    return [];
  });

  const toggleExpanded = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isItemActive = (item: NavItem): boolean => {
    // Check if current path matches item path or dashboard route
    if (item.path === location.pathname || (item.path === dashboardRoute && location.pathname === dashboardRoute)) {
      return true;
    }
    if (item.subItems) {
      return item.subItems.some((subItem) => subItem.path === location.pathname);
    }
    return false;
  };

  const isSubItemActive = (subItem: NavItem): boolean => {
    return subItem.path === location.pathname;
  };

  const handleLogout = async () => {
    try {
      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Redirect to login
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('[Sidebar] Logout error:', error);
      // Still redirect even if signOut fails
      navigate('/login', { replace: true });
    }
  };

  return (
    <aside 
      className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-64 h-full shadow-lg lg:shadow-none transition-colors duration-200 flex flex-col"
      role="complementary" 
      aria-label="Sidebar navigation"
    >
      {/* Header with close/toggle button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('common.menu')}</h2>
        <button
          onClick={onClose || onToggle}
          className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation transition-colors"
          aria-label="Close menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <nav className="p-4 flex-1 overflow-y-auto pb-4" aria-label="Main navigation">
        <ul className="space-y-1">
          {getNavItems(t, dashboardRoute).map((item) => {
            // Skip admin items if user is not admin
            if (item.path === '/admin' && !isAdmin) {
              return null;
            }
            
            // For owners: only show items for their tenant (strict filtering)
            if (isOwner && tenantName) {
              // Owners can only see their tenant's dashboard and common routes
              const normalizedTenant = tenantName.toLowerCase().trim();
              const tenantRoute = normalizedTenant === 'spa' ? '/spa' : normalizedTenant === 'dentist' ? '/dentist' : `/${normalizedTenant}`;
              
              // Block tenant-specific routes that don't match
              if ((item.path === '/spa' || item.path === '/dentist') && item.path !== tenantRoute) {
                return null;
              }
              
              // Allow common routes (analytics, calls, etc.) and their own tenant route
              if (item.path !== tenantRoute && 
                  !item.path.startsWith('/analytics') && 
                  !item.path.startsWith('/calls') && 
                  !item.path.startsWith('/whatsapp') && 
                  item.path !== '/calendar' && 
                  item.path !== '/settings') {
                return null;
              }
            } else {
              // For admins and other roles: use canAccessRoute
              if (userRole && tenantName && !canAccessRoute(item.path, userRole, tenantName, isOwner)) {
                return null;
              }
            }
            const isActive = isItemActive(item);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedItems.includes(item.path);

            return (
              <li key={item.path}>
                <div>
                  {hasSubItems ? (
                    <button
                      onClick={() => toggleExpanded(item.path)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors touch-manipulation min-h-[44px] ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`flex-shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {item.icon}
                        </span>
                        <span className="text-base">{item.label}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''} ${
                          isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors touch-manipulation min-h-[44px] ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className={`flex-shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {item.icon}
                      </span>
                      <span className="text-base">{item.label}</span>
                    </Link>
                  )}
                </div>

                {/* Sub-items */}
                {hasSubItems && isExpanded && item.subItems && (
                  <ul className="mt-1 ml-4 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                    {item.subItems.map((subItem) => {
                      const isSubActive = isSubItemActive(subItem);
                      return (
                        <li key={subItem.path}>
                          <Link
                            to={subItem.path}
                            onClick={onClose}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors touch-manipulation min-h-[40px] text-sm ${
                              isSubActive
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                            }`}
                            aria-current={isSubActive ? 'page' : undefined}
                          >
                            <span className={`flex-shrink-0 ${isSubActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`}>
                              {subItem.icon}
                            </span>
                            <span>{subItem.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
          
          {/* Admin Dashboard link - only visible to admins */}
          {isAdmin && (
            <li>
              <Link
                to="/admin"
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors touch-manipulation min-h-[44px] ${
                  location.pathname === '/admin'
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                }`}
                aria-current={location.pathname === '/admin' ? 'page' : undefined}
              >
                <span className={`flex-shrink-0 ${location.pathname === '/admin' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                <span className="text-base">Admin Dashboard</span>
              </Link>
            </li>
          )}
          
          {/* Logout button as a menu item */}
          <li className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 active:bg-red-100 dark:active:bg-red-900/30 transition-colors touch-manipulation min-h-[44px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-base font-medium">Logout</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

