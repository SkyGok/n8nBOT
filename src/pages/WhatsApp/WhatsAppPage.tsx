/**
 * WhatsApp page component
 * Displays WhatsApp analytics and metrics
 */

import React from 'react';
import { EngagementCards } from '@/components/Dashboard/EngagementCards';

export const WhatsAppPage: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">WhatsApp Analytics</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Overview of WhatsApp conversations, appointments, and engagement metrics
        </p>
      </div>

      {/* Engagement Metrics - WhatsApp focused */}
      <EngagementCards />

      {/* Placeholder for future WhatsApp-specific content */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">WhatsApp Conversations</h2>
        <p className="text-gray-600">
          Detailed WhatsApp conversation analytics and metrics will be displayed here.
        </p>
        <div className="mt-6 p-8 bg-gray-50 rounded-lg text-center">
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
              d="M7 8h10M7 12h4m1 8l-4-4H7a5 5 0 01-5-5V7a5 5 0 015-5h10a5 5 0 015 5v4a5 5 0 01-5 5h-3l-4 4z"
            />
          </svg>
          <p className="mt-4 text-sm text-gray-500">WhatsApp conversation details coming soon</p>
        </div>
      </div>
    </div>
  );
};

