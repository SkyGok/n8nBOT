/**
 * Engagement Cards component
 * Displays engagement metrics: appointments, WhatsApp conversations/appointments, notes
 */

import React from 'react';
import { useEngagementMetrics } from '@/hooks/useDashboardData';
import { formatDistanceToNow } from 'date-fns';

interface CardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  isLoading?: boolean;
}

const Card: React.FC<CardProps> = ({ title, value, icon, isLoading }) => {
  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 flex-shrink-0 ml-2">
          {icon}
        </div>
      </div>
    </div>
  );
};

export const EngagementCards: React.FC = () => {
  const { engagementMetrics, isLoadingEngagement, engagementError } = useEngagementMetrics();

  if (engagementError) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">Error loading engagement metrics</p>
          <p className="text-sm text-gray-500">{engagementError}</p>
        </div>
      </div>
    );
  }

  const updated = engagementMetrics?.lastUpdated
    ? `Updated ${formatDistanceToNow(new Date(engagementMetrics.lastUpdated), { addSuffix: true })}`
    : undefined;

  return (
    <div className="space-y-2">
      {updated && <p className="text-xs text-gray-500 px-1">{updated}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card
          title="Appointments via AI Agent"
          value={engagementMetrics?.appointmentsViaAgent ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2h-1V3m-12 2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          isLoading={isLoadingEngagement}
        />
        <Card
          title="WhatsApp Conversations"
          value={engagementMetrics?.whatsappConversations ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H7a5 5 0 01-5-5V7a5 5 0 015-5h10a5 5 0 015 5v4a5 5 0 01-5 5h-3l-4 4z" />
            </svg>
          }
          isLoading={isLoadingEngagement}
        />
        <Card
          title="WhatsApp Appointments"
          value={engagementMetrics?.whatsappAppointments ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
          isLoading={isLoadingEngagement}
        />
        <Card
          title="Notes Received Today"
          value={engagementMetrics?.notesCountToday ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M9 8h6m2 12H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v9a2 2 0 01-2 2z" />
            </svg>
          }
          isLoading={isLoadingEngagement}
        />
      </div>
    </div>
  );
};


