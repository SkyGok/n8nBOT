/**
 * Zustand store for dashboard state management
 * Manages global state for dashboard data and UI state
 */

import { create } from 'zustand';
import { SummaryStats, TimeSeriesResponse, EventsResponse, EngagementMetrics } from '@/types/api';

interface DashboardState {
  // Data
  summaryStats: SummaryStats | null;
  timeSeriesData: TimeSeriesResponse | null;
  eventsData: EventsResponse | null;
  engagementMetrics: EngagementMetrics | null;
  
  // Loading states
  isLoadingSummary: boolean;
  isLoadingTimeSeries: boolean;
  isLoadingEvents: boolean;
  isLoadingEngagement: boolean;
  
  // Error states
  summaryError: string | null;
  timeSeriesError: string | null;
  eventsError: string | null;
  engagementError: string | null;
  
  // Actions
  setSummaryStats: (stats: SummaryStats | null) => void;
  setTimeSeriesData: (data: TimeSeriesResponse | null) => void;
  setEventsData: (data: EventsResponse | null) => void;
  setEngagementMetrics: (data: EngagementMetrics | null) => void;
  
  setLoadingSummary: (loading: boolean) => void;
  setLoadingTimeSeries: (loading: boolean) => void;
  setLoadingEvents: (loading: boolean) => void;
  setLoadingEngagement: (loading: boolean) => void;
  
  setSummaryError: (error: string | null) => void;
  setTimeSeriesError: (error: string | null) => void;
  setEventsError: (error: string | null) => void;
  setEngagementError: (error: string | null) => void;
  
  // Reset all state
  reset: () => void;
}

const initialState = {
  summaryStats: null,
  timeSeriesData: null,
  eventsData: null,
  engagementMetrics: null,
  isLoadingSummary: false,
  isLoadingTimeSeries: false,
  isLoadingEvents: false,
  isLoadingEngagement: false,
  summaryError: null,
  timeSeriesError: null,
  eventsError: null,
  engagementError: null,
};

export const useDashboardStore = create<DashboardState>((set) => ({
  ...initialState,
  
  setSummaryStats: (stats) => set({ summaryStats: stats }),
  setTimeSeriesData: (data) => set({ timeSeriesData: data }),
  setEventsData: (data) => set({ eventsData: data }),
  setEngagementMetrics: (data) => set({ engagementMetrics: data }),
  
  setLoadingSummary: (loading) => set({ isLoadingSummary: loading }),
  setLoadingTimeSeries: (loading) => set({ isLoadingTimeSeries: loading }),
  setLoadingEvents: (loading) => set({ isLoadingEvents: loading }),
  setLoadingEngagement: (loading) => set({ isLoadingEngagement: loading }),
  
  setSummaryError: (error) => set({ summaryError: error }),
  setTimeSeriesError: (error) => set({ timeSeriesError: error }),
  setEventsError: (error) => set({ eventsError: error }),
  setEngagementError: (error) => set({ engagementError: error }),
  
  reset: () => set(initialState),
}));

