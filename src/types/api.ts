/**
 * API Contract Definitions
 * These types define the expected structure of responses from n8n endpoints
 */

// Summary statistics response
export interface SummaryStats {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  averageDuration: number; // in seconds
  totalDuration: number; // in seconds
  lastUpdated: string; // ISO 8601 timestamp
}

// Time series data point
export interface TimeSeriesDataPoint {
  timestamp: string; // ISO 8601 timestamp
  value: number;
  label?: string;
}

// Time series response
export interface TimeSeriesResponse {
  data: TimeSeriesDataPoint[];
  metric: 'calls' | 'duration' | 'answered_rate';
  period: 'hour' | 'day' | 'week' | 'month';
  startDate: string;
  endDate: string;
}

// Phone event/call record
export interface PhoneEvent {
  id: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  status: 'answered' | 'missed' | 'voicemail' | 'busy' | 'failed';
  duration: number; // in seconds, 0 if not answered
  timestamp: string; // ISO 8601 timestamp
  contactName?: string;
  notes?: string;
}

// Events list response
export interface EventsResponse {
  events: PhoneEvent[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// API Error response
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Generic API response wrapper
export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError };


