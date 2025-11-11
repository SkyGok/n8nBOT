/**
 * Custom hooks for fetching dashboard data
 * Handles API calls, loading states, and error handling
 */

import { useEffect } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { SummaryStats, TimeSeriesResponse, EventsResponse, ApiResponse, EngagementMetrics } from '@/types/api';

// API base URL - adjust this to match your n8n webhook/API endpoint
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Generic fetch function with error handling
async function fetchApi<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Hook to fetch summary statistics
 */
export function useSummaryStats() {
  const {
    summaryStats,
    isLoadingSummary,
    summaryError,
    setSummaryStats,
    setLoadingSummary,
    setSummaryError,
  } = useDashboardStore();

  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true);
      setSummaryError(null);
      
      const response = await fetchApi<SummaryStats>('/summary');
      
      if (response.success) {
        setSummaryStats(response.data);
      } else {
        setSummaryError(response.error.message);
      }
      
      setLoadingSummary(false);
    };

    if (!summaryStats && !isLoadingSummary) {
      fetchSummary();
    }
  }, [summaryStats, isLoadingSummary, setSummaryStats, setLoadingSummary, setSummaryError]);

  return { summaryStats, isLoadingSummary, summaryError };
}

/**
 * Hook to fetch time series data
 */
export function useTimeSeriesData(metric: 'calls' | 'duration' | 'answered_rate' = 'calls', period: 'hour' | 'day' | 'week' | 'month' = 'hour') {
  const {
    timeSeriesData,
    isLoadingTimeSeries,
    timeSeriesError,
    setTimeSeriesData,
    setLoadingTimeSeries,
    setTimeSeriesError,
  } = useDashboardStore();

  useEffect(() => {
    const fetchTimeSeries = async () => {
      setLoadingTimeSeries(true);
      setTimeSeriesError(null);
      
      const response = await fetchApi<TimeSeriesResponse>(
        `/timeseries?metric=${metric}&period=${period}`
      );
      
      if (response.success) {
        setTimeSeriesData(response.data);
      } else {
        setTimeSeriesError(response.error.message);
      }
      
      setLoadingTimeSeries(false);
    };

    fetchTimeSeries();
  }, [metric, period, setTimeSeriesData, setLoadingTimeSeries, setTimeSeriesError]);

  return { timeSeriesData, isLoadingTimeSeries, timeSeriesError };
}

/**
 * Hook to fetch events list
 */
export function useEvents(page: number = 1, pageSize: number = 50, filters?: { status?: string; direction?: string }) {
  const {
    eventsData,
    isLoadingEvents,
    eventsError,
    setEventsData,
    setLoadingEvents,
    setEventsError,
  } = useDashboardStore();

  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      setEventsError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      
      if (filters?.status) {
        params.append('status', filters.status);
      }
      if (filters?.direction) {
        params.append('direction', filters.direction);
      }
      
      const response = await fetchApi<EventsResponse>(`/events?${params.toString()}`);
      
      if (response.success) {
        setEventsData(response.data);
      } else {
        setEventsError(response.error.message);
      }
      
      setLoadingEvents(false);
    };

    fetchEvents();
  }, [page, pageSize, filters?.status, filters?.direction, setEventsData, setLoadingEvents, setEventsError]);

  return { eventsData, isLoadingEvents, eventsError };
}

/**
 * Hook to fetch engagement metrics
 */
export function useEngagementMetrics() {
  const {
    engagementMetrics,
    isLoadingEngagement,
    engagementError,
    setEngagementMetrics,
    setLoadingEngagement,
    setEngagementError,
  } = useDashboardStore();

  useEffect(() => {
    const fetchEngagement = async () => {
      setLoadingEngagement(true);
      setEngagementError(null);
      
      const response = await fetchApi<EngagementMetrics>('/metrics/engagement');
      
      if (response.success) {
        setEngagementMetrics(response.data);
      } else {
        setEngagementError(response.error.message);
      }
      
      setLoadingEngagement(false);
    };

    if (!engagementMetrics && !isLoadingEngagement) {
      fetchEngagement();
    }
  }, [engagementMetrics, isLoadingEngagement, setEngagementMetrics, setLoadingEngagement, setEngagementError]);

  return { engagementMetrics, isLoadingEngagement, engagementError };
}

