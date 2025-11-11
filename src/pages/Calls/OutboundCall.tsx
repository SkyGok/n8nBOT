/**
 * Outbound Call page component
 * Displays analytics and metrics for outbound phone calls
 */

import React from 'react';
import { EventsTable } from '@/components/Dashboard/EventsTable';
import { SummaryCards } from '@/components/Dashboard/SummaryCards';

export const OutboundCall: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Outbound Call Analytics</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Detailed analytics and metrics for outgoing phone calls
        </p>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Events Table - Filtered for outbound calls */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Outbound Call Events</h2>
        <p className="text-sm text-gray-600 mb-4">
          View and filter all outbound call events and their details
        </p>
        <EventsTable />
      </div>

      {/* Placeholder for future outbound-specific content */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Outbound Call Performance</h2>
        <div className="p-8 bg-gray-50 rounded-lg text-center">
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
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          <p className="mt-4 text-sm text-gray-500">Outbound call performance metrics coming soon</p>
        </div>
      </div>
    </div>
  );
};

