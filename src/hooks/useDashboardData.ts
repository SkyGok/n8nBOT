/**
 * Custom hooks for fetching dashboard data
 * Handles Supabase database queries, loading states, and error handling
 */

import React, { useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useDashboardStore } from '@/store/useDashboardStore';
import { SummaryStats, TimeSeriesResponse, EventsResponse, EngagementMetrics, DashboardOverview } from '@/types/api';
import {
  fetchSummaryStats,
  fetchTimeSeriesData,
  fetchEvents,
  fetchEngagementMetrics,
  getTotalCustomers,
  fetchDashboardOverview,
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
 * Optionally filter by date range
 */
export function useSummaryStats(startDate?: Date, endDate?: Date) {
  const { tenant } = useTenant();
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
      // Don't fetch if no tenant is loaded
      if (!tenant?.id) return;
      
      setLoadingSummary(true);
      setSummaryError(null);
      
      try {
        if (USE_SUPABASE) {
          const data = await fetchSummaryStats(startDate, endDate);
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

    // Always fetch when tenant changes or date filters change
    // This ensures data is refreshed when switching tenants
    fetchSummary();
  }, [tenant?.id, startDate?.toISOString(), endDate?.toISOString()]);

  return { summaryStats, isLoadingSummary, summaryError };
}

/**
 * Hook to fetch time series data
 */
export function useTimeSeriesData(metric: 'calls' | 'duration' | 'answered_rate' = 'calls', period: 'hour' | 'day' | 'week' | 'month' = 'hour') {
  const { tenant } = useTenant();
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
      // Don't fetch if no tenant is loaded
      if (!tenant?.id) return;
      
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
  }, [tenant?.id, metric, period, setTimeSeriesData, setLoadingTimeSeries, setTimeSeriesError]);

  return { timeSeriesData, isLoadingTimeSeries, timeSeriesError };
}

/**
 * Hook to fetch events list
 */
export function useEvents(page: number = 1, pageSize: number = 50, filters?: { status?: string; direction?: string }) {
  const { tenant } = useTenant();
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
      // Don't fetch if no tenant is loaded
      if (!tenant?.id) return;
      
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
  }, [tenant?.id, page, pageSize, filters?.status, filters?.direction, setEventsData, setLoadingEvents, setEventsError]);

  return { eventsData, isLoadingEvents, eventsError };
}

/**
 * Hook to fetch engagement metrics
 */
export function useEngagementMetrics() {
  const { tenant } = useTenant();
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
      // Don't fetch if no tenant is loaded
      if (!tenant?.id) return;
      
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

    // Always fetch engagement metrics to get latest appointment counts
    // This ensures appointments created by n8n are reflected immediately
    fetchEngagement();

    // Set up polling to refresh engagement metrics every 30 seconds
    const interval = setInterval(() => {
      fetchEngagement();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [tenant?.id, setEngagementMetrics, setLoadingEngagement, setEngagementError]);

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

/**
 * ⚡ PERFORMANCE OPTIMIZED: Single hook that fetches all dashboard data in one RPC call
 * This replaces multiple separate hooks and reduces database round trips from 5+ to 1
 */
export function useDashboardOverview(startDate?: Date, endDate?: Date) {
  const { tenant } = useTenant();
  const [overview, setOverview] = React.useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      // Don't fetch if no tenant is loaded
      if (!tenant?.id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        if (USE_SUPABASE) {
          const data = await fetchDashboardOverview(startDate, endDate);
          setOverview(data);
        } else {
          // Fallback: still use separate calls for mock data
          const [summary, engagement] = await Promise.all([
            fetchSummaryStats(startDate, endDate),
            fetchEngagementMetrics(),
          ]);
          
          setOverview({
            summary,
            engagement: {
              appointmentsViaAgent: engagement.appointmentsViaAgent,
              confirmedAppointments: engagement.appointmentsViaAgent,
              whatsappConversations: engagement.whatsappConversations,
              whatsappMessages: 0,
              totalCustomers: 0,
            },
            timeseries: [],
            statusBreakdown: {
              answered: summary.answeredCalls,
              missed: summary.missedCalls,
              other: summary.totalCalls - summary.answeredCalls - summary.missedCalls,
            },
            recentMetrics: [],
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard overview');
        console.error('[Dashboard Overview] Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverview();
  }, [tenant?.id, startDate?.toISOString(), endDate?.toISOString()]);

  return { overview, isLoading, error };
}
