/**
 * Events Table component
 * Displays phone events in a table format with sorting and filtering
 */

import React, { useState } from 'react';
import { useEvents } from '@/hooks/useDashboardData';
import { format, parseISO } from 'date-fns';
import { PhoneEvent } from '@/types/api';

const formatDuration = (seconds: number): string => {
  if (seconds === 0) return '-';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const StatusBadge: React.FC<{ status: PhoneEvent['status'] }> = ({ status }) => {
  const statusConfig = {
    answered: { label: 'Answered', className: 'bg-green-100 text-green-800' },
    missed: { label: 'Missed', className: 'bg-red-100 text-red-800' },
    voicemail: { label: 'Voicemail', className: 'bg-yellow-100 text-yellow-800' },
    busy: { label: 'Busy', className: 'bg-orange-100 text-orange-800' },
    failed: { label: 'Failed', className: 'bg-gray-100 text-gray-800' },
  };

  const config = statusConfig[status] || statusConfig.failed;

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
};

const DirectionBadge: React.FC<{ direction: PhoneEvent['direction'] }> = ({ direction }) => {
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${
        direction === 'inbound'
          ? 'bg-blue-100 text-blue-800'
          : 'bg-purple-100 text-purple-800'
      }`}
    >
      {direction === 'inbound' ? 'Inbound' : 'Outbound'}
    </span>
  );
};

export const EventsTable: React.FC = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [directionFilter, setDirectionFilter] = useState<string>('');
  const pageSize = 10;

  const { eventsData, isLoadingEvents, eventsError } = useEvents(page, pageSize, {
    status: statusFilter || undefined,
    direction: directionFilter || undefined,
  });

  if (isLoadingEvents) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (eventsError) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">Error loading events</p>
          <p className="text-sm text-gray-500">{eventsError}</p>
        </div>
      </div>
    );
  }

  if (!eventsData || eventsData.events.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-gray-500">No events found</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil((eventsData.total || 0) / pageSize);

  return (
    <div className="card">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Phone Events</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:space-y-0">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation min-h-[44px]"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="answered">Answered</option>
            <option value="missed">Missed</option>
            <option value="voicemail">Voicemail</option>
            <option value="busy">Busy</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={directionFilter}
            onChange={(e) => {
              setDirectionFilter(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation min-h-[44px]"
            aria-label="Filter by direction"
          >
            <option value="">All Directions</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="lg:hidden space-y-3">
        {eventsData.events.map((event) => (
          <div key={event.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {event.contactName || event.phoneNumber}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(parseISO(event.timestamp), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div className="flex flex-col items-end space-y-1 ml-2">
                <StatusBadge status={event.status} />
                <DirectionBadge direction={event.direction} />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-mono text-xs">{event.phoneNumber}</span>
              <span className="text-gray-900 font-medium">{formatDuration(event.duration)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden lg:block overflow-x-auto -mx-6 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="Phone events table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Direction
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {eventsData.events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(parseISO(event.timestamp), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {event.phoneNumber}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.contactName || '-'}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    <DirectionBadge direction={event.direction} />
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={event.status} />
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(event.duration)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, eventsData.total || 0)} of{' '}
            {eventsData.total} events
          </div>
          <div className="flex space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial touch-manipulation min-h-[44px]"
              aria-label="Previous page"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial touch-manipulation min-h-[44px]"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

