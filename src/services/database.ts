/**
 * Database service functions
 * Queries Supabase database and transforms data to match frontend types
 * All queries use tenant-scoped Supabase client for automatic tenant isolation
 */

import { getTenantSupabase, Database } from '@/lib/supabase';
import { SummaryStats, TimeSeriesResponse, EventsResponse, EngagementMetrics, PhoneEvent, TimeSeriesDataPoint } from '@/types/api';
import { formatISO, startOfDay, endOfDay, subDays, subMonths, startOfMonth } from 'date-fns';

// Database row types
type CallRow = Database['public']['Tables']['calls']['Row'];
type TimeseriesRow = Database['public']['Tables']['timeseries']['Row'];
type EngagementMetricsRow = Database['public']['Tables']['engagement_metrics']['Row'];
type WhatsAppMessageRow = Database['public']['Tables']['whatsapp_messages']['Row'];

/**
 * Fetch summary statistics from calls table
 * Optionally filter by date range
 */
export async function fetchSummaryStats(startDate?: Date, endDate?: Date): Promise<SummaryStats> {
  // Use tenant-scoped client for automatic tenant isolation
  const supabase = getTenantSupabase();
  
  // Build query
  let query = supabase
    .from('calls')
    .select('status, duration_seconds, timestamp');

  // Apply date filters if provided
  if (startDate) {
    query = query.gte('timestamp', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('timestamp', endDate.toISOString());
  }

  const { data: calls, error } = await query as { data: CallRow[] | null; error: any };

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
  const answeredCalls = calls.filter((c) => c.status === 'answered').length;
  const missedCalls = calls.filter((c) => c.status === 'missed').length;
  const answeredCallDurations = calls
    .filter((c) => c.status === 'answered' && c.duration_seconds > 0)
    .map((c) => c.duration_seconds);
  
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
  // Use tenant-scoped client for automatic tenant isolation
  const supabase = getTenantSupabase();
  
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
    .order('timestamp', { ascending: true }) as { data: TimeseriesRow[] | null; error: any };

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

  const data: TimeSeriesDataPoint[] = (timeseriesData || []).map((item) => ({
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
  // Use tenant-scoped client for automatic tenant isolation
  const supabase = getTenantSupabase();
  
  const { data: calls, error } = await supabase
    .from('calls')
    .select('timestamp, status, duration_seconds')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString())
    .order('timestamp', { ascending: true }) as { data: CallRow[] | null; error: any };

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
  // Use tenant-scoped client for automatic tenant isolation
  const supabase = getTenantSupabase();
  
  let query = supabase
    .from('calls')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.direction) {
    // Use call_type column - this is the new standard column for filtering
    // The SQL migration will populate call_type from direction column
    query = query.eq('call_type', filters.direction);
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('timestamp', { ascending: false })
    .range(from, to) as { data: CallRow[] | null; error: any; count: number | null };

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  const events: PhoneEvent[] = (data || []).map((call) => ({
    id: call.id,
    phoneNumber: call.phone_number,
    // Use call_type if available, fallback to direction for backward compatibility
    direction: (call.call_type || call.direction) as 'inbound' | 'outbound',
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
 * If engagement_metrics table is empty, calculate from actual data
 */
export async function fetchEngagementMetrics(): Promise<EngagementMetrics> {
  // Use tenant-scoped client for automatic tenant isolation
  const supabase = getTenantSupabase();
  
  // Get today's metrics
  const today = formatISO(startOfDay(new Date())).split('T')[0];
  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();

  // Try to get from engagement_metrics table first
  const { data, error } = await supabase
    .from('engagement_metrics')
    .select('*')
    .eq('metric_date', today)
    .order('last_updated', { ascending: false })
    .limit(1)
    .single() as { data: EngagementMetricsRow | null; error: any };

  // If we have data from engagement_metrics table, use it
  if (data && !error) {
    return {
      appointmentsViaAgent: data.appointments_via_agent || 0,
      whatsappConversations: data.whatsapp_conversations || 0,
      whatsappAppointments: data.whatsapp_appointments || 0,
      notesCountToday: data.notes_count_today || 0,
      lastUpdated: data.last_updated,
    };
  }

  // If no data in engagement_metrics, calculate from actual tables
  try {
    // Count appointments created today (via AI agent or any source)
    const { count: appointmentsCount, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Confirmed')
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd);

    if (appointmentsError) {
      console.error('[Engagement Metrics] Error counting appointments:', appointmentsError);
    }

    // Count WhatsApp conversations today (unique conversation_ids)
    const { data: whatsappMessages, error: whatsappError } = await supabase
      .from('whatsapp_messages')
      .select('conversation_id')
      .gte('timestamp', todayStart)
      .lte('timestamp', todayEnd) as { data: WhatsAppMessageRow[] | null; error: any };
    
    const whatsappConversationsCount = whatsappMessages 
      ? new Set(whatsappMessages.map((m) => m.conversation_id)).size 
      : 0;

    if (whatsappError) {
      console.error('[Engagement Metrics] Error counting WhatsApp conversations:', whatsappError);
    }

    // Count WhatsApp appointments (appointments with source='whatsapp' created today)
    const { count: whatsappAppointmentsCount, error: whatsappApptError } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Confirmed')
      .eq('source', 'whatsapp')
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd);

    if (whatsappApptError) {
      console.error('[Engagement Metrics] Error counting WhatsApp appointments:', whatsappApptError);
    }

    // Count notes (from calls table) today
    const { count: notesCount, error: notesError } = await supabase
      .from('calls')
      .select('id', { count: 'exact', head: true })
      .not('notes', 'is', null)
      .gte('timestamp', todayStart)
      .lte('timestamp', todayEnd);

    if (notesError) {
      console.error('[Engagement Metrics] Error counting notes:', notesError);
    }

    return {
      appointmentsViaAgent: appointmentsCount || 0,
      whatsappConversations: whatsappConversationsCount || 0,
      whatsappAppointments: whatsappAppointmentsCount || 0,
      notesCountToday: notesCount || 0,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Engagement Metrics] Error calculating metrics:', error);
    // Return default values on error
    return {
      appointmentsViaAgent: 0,
      whatsappConversations: 0,
      whatsappAppointments: 0,
      notesCountToday: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get total customers count (for call summary chart)
 * This can be calculated from unique phone numbers or a separate customers table
 */
export async function getTotalCustomers(): Promise<number> {
  // Use tenant-scoped client for automatic tenant isolation
  const supabase = getTenantSupabase();
  
  // Get unique phone numbers count
  const { data: uniquePhones, error: uniqueError } = await supabase
    .from('calls')
    .select('phone_number')
    .not('phone_number', 'is', null);

  if (uniqueError) {
    return 1500;
  }

  const uniqueSet = new Set((uniquePhones || []).map((c: CallRow) => c.phone_number));
  return uniqueSet.size || 1500;
}

/**
 * WhatsApp message interface
 */
export interface WhatsAppMessage {
  id: string;
  conversationId: string;
  messageId: string;
  phoneNumber: string;
  contactName: string | null;
  direction: 'inbound' | 'outbound';
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker';
  content: string | null;
  mediaUrl: string | null;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  readAt: string | null;
  metadata: Record<string, unknown>;
}

/**
 * WhatsApp conversation interface (grouped messages)
 */
export interface WhatsAppConversation {
  conversationId: string;
  phoneNumber: string;
  contactName: string | null;
  messages: WhatsAppMessage[];
  lastMessageTime: string;
  unreadCount: number;
}

/**
 * Fetch WhatsApp messages grouped by conversation
 */
export async function fetchWhatsAppConversations(): Promise<WhatsAppConversation[]> {
  // Use tenant-scoped client for automatic tenant isolation
  const supabase = getTenantSupabase();
  
  // Fetch all WhatsApp messages, ordered by timestamp
  const { data: messages, error } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .order('timestamp', { ascending: false }) as { data: WhatsAppMessageRow[] | null; error: any };

  if (error) {
    console.error('[Supabase Error] Failed to fetch WhatsApp messages:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(`Failed to fetch WhatsApp messages: ${error.message}`);
  }

  if (!messages || messages.length === 0) {
    return [];
  }

  // Group messages by conversation_id
  const conversationMap = new Map<string, WhatsAppConversation>();

  (messages || []).forEach((msg) => {
    const convId = msg.conversation_id;
    
    if (!conversationMap.has(convId)) {
      conversationMap.set(convId, {
        conversationId: convId,
        phoneNumber: msg.phone_number,
        contactName: msg.contact_name,
        messages: [],
        lastMessageTime: msg.timestamp,
        unreadCount: 0,
      });
    }

    const conversation = conversationMap.get(convId)!;
    
    // Add message to conversation
    conversation.messages.push({
      id: msg.id,
      conversationId: msg.conversation_id,
      messageId: msg.message_id,
      phoneNumber: msg.phone_number,
      contactName: msg.contact_name,
      direction: msg.direction,
      messageType: msg.message_type,
      content: msg.content,
      mediaUrl: msg.media_url,
      timestamp: msg.timestamp,
      status: msg.status,
      readAt: msg.read_at,
      metadata: msg.metadata || {},
    });

    // Update last message time if this message is more recent
    if (new Date(msg.timestamp) > new Date(conversation.lastMessageTime)) {
      conversation.lastMessageTime = msg.timestamp;
    }

    // Count unread inbound messages
    if (msg.direction === 'inbound' && msg.status !== 'read') {
      conversation.unreadCount++;
    }
  });

  // Sort messages within each conversation by timestamp (oldest first)
  const conversations = Array.from(conversationMap.values());
  conversations.forEach((conv) => {
    conv.messages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  });

  // Sort conversations by last message time (most recent first)
  conversations.sort((a, b) => 
    new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );

  return conversations;
}

/**
 * Fetch messages for a specific conversation
 */
export async function fetchConversationMessages(conversationId: string): Promise<WhatsAppMessage[]> {
  // Use tenant-scoped client for automatic tenant isolation
  const supabase = getTenantSupabase();
  
  const { data: messages, error } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('[Supabase Error] Failed to fetch conversation messages:', error);
    throw new Error(`Failed to fetch conversation messages: ${error.message}`);
  }

  if (!messages || messages.length === 0) {
    return [];
  }

  return (messages || []).map((msg: WhatsAppMessageRow) => ({
    id: msg.id,
    conversationId: msg.conversation_id,
    messageId: msg.message_id,
    phoneNumber: msg.phone_number,
    contactName: msg.contact_name,
    direction: msg.direction,
    messageType: msg.message_type,
    content: msg.content,
    mediaUrl: msg.media_url,
    timestamp: msg.timestamp,
    status: msg.status,
    readAt: msg.read_at,
    metadata: msg.metadata || {},
  }));
}

