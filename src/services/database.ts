/**
 * Database service functions
 * Queries Supabase database and transforms data to match frontend types
 */

import { supabase } from '@/lib/supabase';
import { SummaryStats, TimeSeriesResponse, EventsResponse, EngagementMetrics, PhoneEvent, TimeSeriesDataPoint } from '@/types/api';
import { formatISO, startOfDay, subDays, subMonths, startOfMonth } from 'date-fns';

/**
 * Fetch summary statistics from calls table
 */
export async function fetchSummaryStats(): Promise<SummaryStats> {
  // Get all calls
  const { data: calls, error } = await supabase
    .from('calls')
    .select('status, duration_seconds, timestamp');

  if (error) {
    // Enhanced error logging
    console.error('[Supabase Error] Failed to fetch calls:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(`Failed to fetch calls: ${error.message}${error.hint ? ` (${error.hint})` : ''}`);
  }

  if (!calls || calls.length === 0) {
    return {
      totalCalls: 0,
      answeredCalls: 0,
      missedCalls: 0,
      averageDuration: 0,
      totalDuration: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  const totalCalls = calls.length;
  const answeredCalls = calls.filter(c => c.status === 'answered').length;
  const missedCalls = calls.filter(c => c.status === 'missed').length;
  const answeredCallDurations = calls
    .filter(c => c.status === 'answered' && c.duration_seconds > 0)
    .map(c => c.duration_seconds);
  
  const totalDuration = answeredCallDurations.reduce((sum, d) => sum + d, 0);
  const averageDuration = answeredCallDurations.length > 0 
    ? Math.round(totalDuration / answeredCallDurations.length)
    : 0;

  // Get most recent call timestamp
  const lastCall = calls.reduce((latest, call) => {
    return new Date(call.timestamp) > new Date(latest.timestamp) ? call : latest;
  }, calls[0]);

  return {
    totalCalls,
    answeredCalls,
    missedCalls,
    averageDuration,
    totalDuration,
    lastUpdated: lastCall.timestamp,
  };
}

/**
 * Fetch time series data
 */
export async function fetchTimeSeriesData(
  metric: 'calls' | 'duration' | 'answered_rate' = 'calls',
  period: 'hour' | 'day' | 'week' | 'month' = 'day'
): Promise<TimeSeriesResponse> {
  let startDate: Date;
  let endDate = new Date();

  // Determine date range based on period
  switch (period) {
    case 'hour':
      startDate = subDays(endDate, 7);
      break;
    case 'day':
      startDate = subMonths(endDate, 12);
      break;
    case 'week':
      startDate = subMonths(endDate, 6);
      break;
    case 'month':
      startDate = subMonths(endDate, 12);
      break;
    default:
      startDate = subMonths(endDate, 12);
  }

  // Query timeseries table
  const { data: timeseriesData, error } = await supabase
    .from('timeseries')
    .select('timestamp, value')
    .eq('metric', metric)
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString())
    .order('timestamp', { ascending: true });

  if (error) {
    // Enhanced error logging
    console.error('[Supabase Error] Failed to fetch timeseries data:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(`Failed to fetch timeseries data: ${error.message}${error.hint ? ` (${error.hint})` : ''}`);
  }

  // If no data in timeseries table, calculate from calls table
  if (!timeseriesData || timeseriesData.length === 0) {
    return calculateTimeSeriesFromCalls(metric, period, startDate, endDate);
  }

  const data: TimeSeriesDataPoint[] = timeseriesData.map(item => ({
    timestamp: item.timestamp,
    value: Number(item.value),
  }));

  return {
    data,
    metric,
    period,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

/**
 * Calculate time series from calls table if timeseries table is empty
 */
async function calculateTimeSeriesFromCalls(
  metric: 'calls' | 'duration' | 'answered_rate',
  period: 'hour' | 'day' | 'week' | 'month',
  startDate: Date,
  endDate: Date
): Promise<TimeSeriesResponse> {
  const { data: calls, error } = await supabase
    .from('calls')
    .select('timestamp, status, duration_seconds')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString())
    .order('timestamp', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch calls for timeseries: ${error.message}`);
  }

  if (!calls || calls.length === 0) {
    return {
      data: [],
      metric,
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }

  // Group by time period
  const grouped = new Map<string, { calls: number; answered: number; duration: number }>();

  calls.forEach(call => {
    const date = new Date(call.timestamp);
    let key: string;

    if (period === 'hour') {
      key = formatISO(date).slice(0, 13) + ':00:00Z';
    } else if (period === 'day') {
      key = formatISO(startOfDay(date));
    } else if (period === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = formatISO(startOfDay(weekStart));
    } else {
      key = formatISO(startOfMonth(date));
    }

    const existing = grouped.get(key) || { calls: 0, answered: 0, duration: 0 };
    existing.calls++;
    if (call.status === 'answered') {
      existing.answered++;
      existing.duration += call.duration_seconds || 0;
    }
    grouped.set(key, existing);
  });

  const data: TimeSeriesDataPoint[] = Array.from(grouped.entries())
    .map(([timestamp, stats]) => {
      let value: number;
      if (metric === 'calls') {
        value = stats.calls;
      } else if (metric === 'duration') {
        value = stats.answered > 0 ? Math.round(stats.duration / stats.answered) : 0;
      } else {
        value = stats.calls > 0 ? (stats.answered / stats.calls) * 100 : 0;
      }
      return { timestamp, value };
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return {
    data,
    metric,
    period,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

/**
 * Fetch call events with pagination and filters
 */
export async function fetchEvents(
  page: number = 1,
  pageSize: number = 50,
  filters?: { status?: string; direction?: string }
): Promise<EventsResponse> {
  let query = supabase
    .from('calls')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.direction) {
    query = query.eq('direction', filters.direction);
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('timestamp', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  const events: PhoneEvent[] = (data || []).map(call => ({
    id: call.id,
    phoneNumber: call.phone_number,
    direction: call.direction as 'inbound' | 'outbound',
    status: call.status as 'answered' | 'missed' | 'voicemail' | 'busy' | 'failed',
    duration: call.duration_seconds || 0,
    timestamp: call.timestamp,
    contactName: call.contact_name || undefined,
    notes: call.notes || undefined,
  }));

  return {
    events,
    total: count || 0,
    page,
    pageSize,
    hasMore: (count || 0) > page * pageSize,
  };
}

/**
 * Fetch engagement metrics
 */
export async function fetchEngagementMetrics(): Promise<EngagementMetrics> {
  // Get today's metrics
  const today = formatISO(startOfDay(new Date())).split('T')[0];

  const { data, error } = await supabase
    .from('engagement_metrics')
    .select('*')
    .eq('metric_date', today)
    .order('last_updated', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Failed to fetch engagement metrics: ${error.message}`);
  }

  if (!data) {
    // Return default values if no data found
    return {
      appointmentsViaAgent: 0,
      whatsappConversations: 0,
      whatsappAppointments: 0,
      notesCountToday: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  return {
    appointmentsViaAgent: data.appointments_via_agent || 0,
    whatsappConversations: data.whatsapp_conversations || 0,
    whatsappAppointments: data.whatsapp_appointments || 0,
    notesCountToday: data.notes_count_today || 0,
    lastUpdated: data.last_updated,
  };
}

/**
 * Get total customers count (for call summary chart)
 * This can be calculated from unique phone numbers or a separate customers table
 */
export async function getTotalCustomers(): Promise<number> {
  // Get unique phone numbers count
  const { data: uniquePhones, error: uniqueError } = await supabase
    .from('calls')
    .select('phone_number')
    .not('phone_number', 'is', null);

  if (uniqueError) {
    return 1500;
  }

  const uniqueSet = new Set((uniquePhones || []).map(c => c.phone_number));
  return uniqueSet.size || 1500;
}

