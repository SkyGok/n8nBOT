/**
 * WhatsApp page component
 * Displays WhatsApp analytics and metrics
 */

import React from 'react';
import { EngagementCards } from '@/components/Dashboard/EngagementCards';
import { WhatsAppConversations } from '@/components/WhatsApp/WhatsAppConversations';

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

      {/* WhatsApp Conversations */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">WhatsApp Conversations</h2>
        <WhatsAppConversations />
      </div>
    </div>
  );
};

