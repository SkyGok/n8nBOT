/**
 * Mock data for development and testing
 * Replace with actual API calls when integrating with n8n
 */

import { SummaryStats, TimeSeriesResponse, EventsResponse, PhoneEvent } from '@/types/api';
import { subDays, subHours, formatISO } from 'date-fns';

// Generate mock summary stats
export const mockSummaryStats: SummaryStats = {
  totalCalls: 1247,
  answeredCalls: 892,
  missedCalls: 355,
  averageDuration: 187, // ~3 minutes
  totalDuration: 166804, // total seconds
  lastUpdated: new Date().toISOString(),
};

// Generate mock time series data (last 7 days, hourly)
export const generateMockTimeSeries = (): TimeSeriesResponse => {
  const data: TimeSeriesResponse['data'] = [];
  const now = new Date();
  
  // Generate hourly data for last 7 days
  for (let i = 168; i >= 0; i--) {
    const timestamp = subHours(now, i);
    const baseValue = 10 + Math.random() * 20;
    const value = Math.floor(baseValue + Math.sin(i / 24) * 5);
    
    data.push({
      timestamp: formatISO(timestamp),
      value,
    });
  }
  
  return {
    data,
    metric: 'calls',
    period: 'hour',
    startDate: formatISO(subDays(now, 7)),
    endDate: formatISO(now),
  };
};

// Generate mock phone events
export const generateMockEvents = (count: number = 50): PhoneEvent[] => {
  const events: PhoneEvent[] = [];
  const statuses: PhoneEvent['status'][] = ['answered', 'missed', 'voicemail', 'busy'];
  const directions: PhoneEvent['direction'][] = ['inbound', 'outbound'];
  const contacts = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', null];
  
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const timestamp = subHours(now, Math.random() * 168); // Random time in last 7 days
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const duration = status === 'answered' ? Math.floor(Math.random() * 600) : 0;
    const contact = contacts[Math.floor(Math.random() * contacts.length)];
    
    events.push({
      id: `event-${i + 1}`,
      phoneNumber: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      direction,
      status,
      duration,
      timestamp: formatISO(timestamp),
      contactName: contact || undefined,
      notes: Math.random() > 0.7 ? 'Important call' : undefined,
    });
  }
  
  // Sort by timestamp descending (newest first)
  return events.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const mockEventsResponse: EventsResponse = {
  events: generateMockEvents(50),
  total: 50,
  page: 1,
  pageSize: 50,
  hasMore: false,
};


