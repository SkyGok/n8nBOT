/**
 * Sidebar component for navigation
 * Provides navigation links and menu items with nested sub-items
 * Toggleable on all screen sizes
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

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

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    path: '/whatsapp',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H7a5 5 0 01-5-5V7a5 5 0 015-5h10a5 5 0 015 5v4a5 5 0 01-5 5h-3l-4 4z" />
      </svg>
    ),
  },
  {
    label: 'Calls',
    path: '/calls',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    subItems: [
      {
        label: 'Inbound Call',
        path: '/calls/inbound',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        ),
      },
      {
        label: 'Outbound Call',
        path: '/calls/outbound',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Settings',
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
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Auto-expand Calls if we're on a calls sub-page
    if (location.pathname.startsWith('/calls')) {
      return ['/calls'];
    }
    return [];
  });

  const toggleExpanded = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.path === location.pathname) return true;
    if (item.subItems) {
      return item.subItems.some((subItem) => subItem.path === location.pathname);
    }
    return false;
  };

  const isSubItemActive = (subItem: NavItem): boolean => {
    return subItem.path === location.pathname;
  };

  return (
    <aside 
      className="bg-white border-r border-gray-200 w-64 h-full lg:min-h-screen shadow-lg lg:shadow-none"
      role="complementary" 
      aria-label="Sidebar navigation"
    >
      {/* Header with close/toggle button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
        <button
          onClick={onClose || onToggle}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
          aria-label="Close menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <nav className="p-4" aria-label="Main navigation">
        <ul className="space-y-1">
          {navItems.map((item) => {
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
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                          {item.icon}
                        </span>
                        <span className="text-base">{item.label}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''} ${
                          isActive ? 'text-primary-600' : 'text-gray-400'
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
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className={`flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                        {item.icon}
                      </span>
                      <span className="text-base">{item.label}</span>
                    </Link>
                  )}
                </div>

                {/* Sub-items */}
                {hasSubItems && isExpanded && item.subItems && (
                  <ul className="mt-1 ml-4 space-y-1 border-l-2 border-gray-200 pl-2">
                    {item.subItems.map((subItem) => {
                      const isSubActive = isSubItemActive(subItem);
                      return (
                        <li key={subItem.path}>
                          <Link
                            to={subItem.path}
                            onClick={onClose}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors touch-manipulation min-h-[40px] text-sm ${
                              isSubActive
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                            }`}
                            aria-current={isSubActive ? 'page' : undefined}
                          >
                            <span className={`flex-shrink-0 ${isSubActive ? 'text-primary-600' : 'text-gray-400'}`}>
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
        </ul>
      </nav>
    </aside>
  );
};

