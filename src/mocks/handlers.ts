/**
 * MSW (Mock Service Worker) request handlers
 * These intercept HTTP requests and return mock data
 */

import { http, HttpResponse } from 'msw';
import { mockSummaryStats, generateMockTimeSeries, mockEventsResponse } from './mockData';
import { formatISO } from 'date-fns';

// Base API URL - adjust this to match your n8n webhook/API endpoint
const API_BASE = '/api';

export const handlers = [
  // GET /api/summary - Get summary statistics
  http.get(`${API_BASE}/summary`, () => {
    return HttpResponse.json({
      success: true,
      data: mockSummaryStats,
    });
  }),

  // GET /api/timeseries - Get time series data
  http.get(`${API_BASE}/timeseries`, ({ request }) => {
    const url = new URL(request.url);
    const metric = url.searchParams.get('metric') || 'calls';
    const period = url.searchParams.get('period') || 'hour';
    
    const timeSeriesData = generateMockTimeSeries();
    timeSeriesData.metric = metric as 'calls' | 'duration' | 'answered_rate';
    timeSeriesData.period = period as 'hour' | 'day' | 'week' | 'month';
    
    return HttpResponse.json({
      success: true,
      data: timeSeriesData,
    });
  }),

  // GET /api/events - Get phone events list
  http.get(`${API_BASE}/events`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50', 10);
    const status = url.searchParams.get('status');
    const direction = url.searchParams.get('direction');
    
    let filteredEvents = [...mockEventsResponse.events];
    
    // Apply filters
    if (status) {
      filteredEvents = filteredEvents.filter(e => e.status === status);
    }
    if (direction) {
      filteredEvents = filteredEvents.filter(e => e.direction === direction);
    }
    
    // Pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedEvents = filteredEvents.slice(start, end);
    
    return HttpResponse.json({
      success: true,
      data: {
        ...mockEventsResponse,
        events: paginatedEvents,
        page,
        pageSize,
        total: filteredEvents.length,
        hasMore: end < filteredEvents.length,
      },
    });
  }),

  // GET /api/metrics/engagement - Engagement metrics
  http.get(`${API_BASE}/metrics/engagement`, () => {
    // Simple derivation for mock purposes
    const today = new Date();
    const last24h = mockEventsResponse.events.filter(
      (e) => new Date(e.timestamp).getTime() >= Date.now() - 24 * 60 * 60 * 1000
    );
    const whatsappConversations = Math.floor(40 + Math.random() * 30); // Mocked
    const whatsappAppointments = Math.floor(10 + Math.random() * 15); // Mocked
    const appointmentsViaAgent = Math.floor(20 + Math.random() * 25); // Mocked
    const notesCountToday =
      last24h.reduce((acc, e) => (e.notes ? acc + 1 : acc), 0) + Math.floor(Math.random() * 10);

    return HttpResponse.json({
      success: true,
      data: {
        appointmentsViaAgent,
        whatsappConversations,
        whatsappAppointments,
        notesCountToday,
        lastUpdated: formatISO(today),
      },
    });
  }),
];


