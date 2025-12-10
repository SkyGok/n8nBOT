/**
 * Calendar event types
 * Used for calendar integration with n8n and Google Calendar
 */

import { Database } from '@/lib/supabase';

// Database row types
export type AppointmentRow = Database['public']['Tables']['appointments']['Row'];
export type CalendarEventRow = Database['public']['Tables']['calendar_events']['Row'];

// Frontend calendar event type
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  allDay?: boolean;
  color?: string;
  metadata?: Record<string, unknown>;
}

// Appointment type matching database schema
export interface Appointment {
  id: string;
  appointment_datetime?: string | null;
  scheduled_at?: string | null;
  title?: string;
  start_time?: string;
  source?: string | null;
  status?: string;
  created_by?: string | null;
  call_id?: string | null;
  user_id?: string | null;
  calendar_event_id?: string | null;
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  service_type?: string | null;
  therapist_name?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  tenant_id?: string;
}

export interface CreateCalendarEventInput {
  title: string;
  start: string; // ISO 8601 timestamp
  end: string; // ISO 8601 timestamp
  description?: string;
  location?: string;
  allDay?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda';
}

