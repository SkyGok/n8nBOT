/**
 * Notifications Sidebar component
 * Displays incoming appointments on the right side of the screen
 */

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { fetchCalendarEvents } from '@/services/calendar';
import { CalendarEvent } from '@/types/calendar';

interface NotificationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsSidebar: React.FC<NotificationsSidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const [appointments, setAppointments] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUpcomingAppointments();
    }
  }, [isOpen]);

  const loadUpcomingAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next 7 days
      
      const events = await fetchCalendarEvents(now, nextWeek);
      
      // Filter to only show upcoming appointments (not past)
      const upcoming = events.filter(event => {
        const eventStart = new Date(event.start);
        return eventStart >= now;
      });
      
      // Sort by start time (earliest first)
      upcoming.sort((a, b) => a.start.getTime() - b.start.getTime());
      
      setAppointments(upcoming);
    } catch (err) {
      console.error('[NotificationsSidebar] Error loading appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getTimeUntil = (date: Date): string => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 1) {
      return `${minutes} min${minutes !== 1 ? 's' : ''}`;
    } else if (hours < 24) {
      return `${hours} hr${hours !== 1 ? 's' : ''} ${minutes > 0 ? `${minutes} min${minutes !== 1 ? 's' : ''}` : ''}`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  };

  return (
    <>
      {/* Overlay for mobile/tablet */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
          style={{ willChange: 'opacity' }}
        />
      )}
      
      {/* Notifications Sidebar */}
      <aside
        data-notifications-sidebar
        className={`fixed top-16 lg:top-0 right-0 bottom-0 w-80 sm:w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-50 transform transition-transform duration-200 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ willChange: 'transform' }}
        role="complementary"
        aria-label="Notifications"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('common.notifications') || 'Notifications'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation transition-colors"
            aria-label="Close notifications"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={loadUpcomingAppointments}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                No upcoming appointments
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment) => {
                const isUpcoming = appointment.start > new Date();
                const timeUntil = isUpcoming ? getTimeUntil(appointment.start) : null;
                
                return (
                  <div
                    key={appointment.id}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {appointment.title}
                        </h3>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {formatDate(appointment.start)}
                          </p>
                          {appointment.metadata?.client_name && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Client: {appointment.metadata.client_name as string}
                            </p>
                          )}
                          {appointment.metadata?.service_type && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Service: {appointment.metadata.service_type as string}
                            </p>
                          )}
                          {appointment.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {appointment.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {timeUntil && (
                        <div className="ml-2 flex-shrink-0">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200">
                            {timeUntil}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

