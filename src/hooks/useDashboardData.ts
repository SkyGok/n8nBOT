/**
 * Custom hooks for fetching dashboard data
 * Handles Supabase database queries, loading states, and error handling
 */

import React, { useEffect } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { SummaryStats, TimeSeriesResponse, EventsResponse, EngagementMetrics } from '@/types/api';
import {
  fetchSummaryStats,
  fetchTimeSeriesData,
  fetchEvents,
  fetchEngagementMetrics,
  getTotalCustomers,
} from '@/services/database';

// Check if we should use Supabase or mock data
const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true' || 
                     (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

// Fallback to mock API if Supabase is not configured
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function fetchApi<T>(endpoint: string): Promise<{ success: true; data: T } | { success: false; error: { message: string } }> {
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
      
      try {
        if (USE_SUPABASE) {
          const data = await fetchSummaryStats();
          setSummaryStats(data);
        } else {
          // Fallback to mock API
          const response = await fetchApi<SummaryStats>('/summary');
          if (response.success) {
            setSummaryStats(response.data);
          } else {
            setSummaryError(response.error.message);
          }
        }
      } catch (error) {
        setSummaryError(error instanceof Error ? error.message : 'Failed to fetch summary statistics');
      } finally {
        setLoadingSummary(false);
      }
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
      
      try {
        if (USE_SUPABASE) {
          const data = await fetchTimeSeriesData(metric, period);
          setTimeSeriesData(data);
        } else {
          // Fallback to mock API
          const response = await fetchApi<TimeSeriesResponse>(
            `/timeseries?metric=${metric}&period=${period}`
          );
          if (response.success) {
            setTimeSeriesData(response.data);
          } else {
            setTimeSeriesError(response.error.message);
          }
        }
      } catch (error) {
        setTimeSeriesError(error instanceof Error ? error.message : 'Failed to fetch time series data');
      } finally {
        setLoadingTimeSeries(false);
      }
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
    const fetchEventsData = async () => {
      setLoadingEvents(true);
      setEventsError(null);
      
      try {
        if (USE_SUPABASE) {
          const data = await fetchEvents(page, pageSize, filters);
          setEventsData(data);
        } else {
          // Fallback to mock API
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
        }
      } catch (error) {
        setEventsError(error instanceof Error ? error.message : 'Failed to fetch events');
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEventsData();
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
      
      try {
        if (USE_SUPABASE) {
          const data = await fetchEngagementMetrics();
          setEngagementMetrics(data);
        } else {
          // Fallback to mock API
          const response = await fetchApi<EngagementMetrics>('/metrics/engagement');
          if (response.success) {
            setEngagementMetrics(response.data);
          } else {
            setEngagementError(response.error.message);
          }
        }
      } catch (error) {
        setEngagementError(error instanceof Error ? error.message : 'Failed to fetch engagement metrics');
      } finally {
        setLoadingEngagement(false);
      }
    };

    if (!engagementMetrics && !isLoadingEngagement) {
      fetchEngagement();
    }
  }, [engagementMetrics, isLoadingEngagement, setEngagementMetrics, setLoadingEngagement, setEngagementError]);

  return { engagementMetrics, isLoadingEngagement, engagementError };
}

/**
 * Hook to get total customers count
 */
export function useTotalCustomers() {
  const [totalCustomers, setTotalCustomers] = React.useState<number>(1500);
  const [isLoading, setIsLoading] = React.useState(false);

  useEffect(() => {
    const fetchTotal = async () => {
      if (!USE_SUPABASE) return;
      
      setIsLoading(true);
      try {
        const count = await getTotalCustomers();
        setTotalCustomers(count);
      } catch (error) {
        console.error('Failed to fetch total customers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTotal();
  }, []);

  return { totalCustomers, isLoading };
}

