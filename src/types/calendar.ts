/**
 * Calendar event types
 * Used for calendar integration with n8n and Google Calendar
 */

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

