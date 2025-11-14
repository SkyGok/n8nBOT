/**
 * Calendar service
 * Handles calendar events fetching and creation via n8n webhooks
 */

import { CalendarEvent, CreateCalendarEventInput } from '@/types/calendar';

const CALENDAR_STORAGE_KEY = 'calendar_events';
const POLL_INTERVAL = 30000; // 30 seconds

// Get n8n webhook URL from environment or localStorage
function getCalendarWebhookUrl(): string | null {
  const envUrl = import.meta.env.VITE_N8N_CALENDAR_WEBHOOK_URL;
  if (envUrl) return envUrl;
  
  const settings = localStorage.getItem('integration_settings');
  if (settings) {
    try {
      const parsed = JSON.parse(settings);
      return parsed.n8n?.calendarWebhookUrl || null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Fetch calendar events from n8n webhook
 * Falls back to localStorage if webhook is not configured
 */
export async function fetchCalendarEvents(
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const webhookUrl = getCalendarWebhookUrl();
  
  if (!webhookUrl) {
    // Fallback to localStorage
    return getEventsFromLocalStorage(startDate, endDate);
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'fetch',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar events: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform response to CalendarEvent format
    const events: CalendarEvent[] = (data.events || []).map((event: any) => ({
      id: event.id || `event-${Date.now()}-${Math.random()}`,
      title: event.title || event.summary || 'Untitled Event',
      start: new Date(event.start || event.startDate),
      end: new Date(event.end || event.endDate),
      description: event.description,
      location: event.location,
      allDay: event.allDay || false,
      color: event.color,
      metadata: event.metadata,
    }));

    // Cache events in localStorage
    cacheEventsInLocalStorage(events);
    
    return events;
  } catch (error) {
    console.error('[Calendar Service] Error fetching events:', error);
    // Fallback to localStorage on error
    return getEventsFromLocalStorage(startDate, endDate);
  }
}

/**
 * Create a new calendar event via n8n webhook
 */
export async function createCalendarEvent(
  event: CreateCalendarEventInput
): Promise<CalendarEvent> {
  const webhookUrl = getCalendarWebhookUrl();
  
  if (!webhookUrl) {
    // Fallback to localStorage
    return createEventInLocalStorage(event);
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create',
        event,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create calendar event: ${response.statusText}`);
    }

    const data = await response.json();
    
    const createdEvent: CalendarEvent = {
      id: data.id || `event-${Date.now()}-${Math.random()}`,
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      description: event.description,
      location: event.location,
      allDay: event.allDay || false,
      color: data.color,
      metadata: data.metadata || event.metadata,
    };

    // Cache in localStorage
    const cachedEvents = getEventsFromLocalStorage(new Date(0), new Date(9999999999999));
    cachedEvents.push(createdEvent);
    cacheEventsInLocalStorage(cachedEvents);

    return createdEvent;
  } catch (error) {
    console.error('[Calendar Service] Error creating event:', error);
    // Fallback to localStorage on error
    return createEventInLocalStorage(event);
  }
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<CreateCalendarEventInput>
): Promise<CalendarEvent> {
  const webhookUrl = getCalendarWebhookUrl();
  
  if (!webhookUrl) {
    // Fallback to localStorage
    return updateEventInLocalStorage(eventId, updates);
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        eventId,
        updates,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update calendar event: ${response.statusText}`);
    }

    const data = await response.json();
    const updatedEvent: CalendarEvent = {
      id: eventId,
      title: updates.title || data.title || '',
      start: new Date(updates.start || data.start),
      end: new Date(updates.end || data.end),
      description: updates.description ?? data.description,
      location: updates.location ?? data.location,
      allDay: updates.allDay ?? data.allDay,
      color: data.color,
      metadata: data.metadata || updates.metadata,
    };

    // Update in localStorage
    const cachedEvents = getEventsFromLocalStorage(new Date(0), new Date(9999999999999));
    const index = cachedEvents.findIndex(e => e.id === eventId);
    if (index >= 0) {
      cachedEvents[index] = updatedEvent;
      cacheEventsInLocalStorage(cachedEvents);
    }

    return updatedEvent;
  } catch (error) {
    console.error('[Calendar Service] Error updating event:', error);
    return updateEventInLocalStorage(eventId, updates);
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const webhookUrl = getCalendarWebhookUrl();
  
  if (!webhookUrl) {
    // Fallback to localStorage
    deleteEventFromLocalStorage(eventId);
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete',
        eventId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete calendar event: ${response.statusText}`);
    }

    // Remove from localStorage
    deleteEventFromLocalStorage(eventId);
  } catch (error) {
    console.error('[Calendar Service] Error deleting event:', error);
    deleteEventFromLocalStorage(eventId);
  }
}

// LocalStorage helpers (fallback when webhook is not configured)

function getEventsFromLocalStorage(startDate: Date, endDate: Date): CalendarEvent[] {
  try {
    const stored = localStorage.getItem(CALENDAR_STORAGE_KEY);
    if (!stored) return [];
    
    const events: CalendarEvent[] = JSON.parse(stored).map((e: any) => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
    }));
    
    // Filter by date range
    return events.filter(event => {
      return event.start >= startDate && event.end <= endDate;
    });
  } catch {
    return [];
  }
}

function cacheEventsInLocalStorage(events: CalendarEvent[]): void {
  try {
    localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('[Calendar Service] Error caching events:', error);
  }
}

function createEventInLocalStorage(event: CreateCalendarEventInput): CalendarEvent {
  const newEvent: CalendarEvent = {
    id: `event-${Date.now()}-${Math.random()}`,
    title: event.title,
    start: new Date(event.start),
    end: new Date(event.end),
    description: event.description,
    location: event.location,
    allDay: event.allDay || false,
    metadata: event.metadata,
  };
  
  const cachedEvents = getEventsFromLocalStorage(new Date(0), new Date(9999999999999));
  cachedEvents.push(newEvent);
  cacheEventsInLocalStorage(cachedEvents);
  
  return newEvent;
}

function updateEventInLocalStorage(
  eventId: string,
  updates: Partial<CreateCalendarEventInput>
): CalendarEvent {
  const cachedEvents = getEventsFromLocalStorage(new Date(0), new Date(9999999999999));
  const index = cachedEvents.findIndex(e => e.id === eventId);
  
  if (index < 0) {
    throw new Error(`Event ${eventId} not found`);
  }
  
  const existing = cachedEvents[index];
  const updated: CalendarEvent = {
    ...existing,
    title: updates.title ?? existing.title,
    start: updates.start ? new Date(updates.start) : existing.start,
    end: updates.end ? new Date(updates.end) : existing.end,
    description: updates.description ?? existing.description,
    location: updates.location ?? existing.location,
    allDay: updates.allDay ?? existing.allDay,
    metadata: updates.metadata ?? existing.metadata,
  };
  
  cachedEvents[index] = updated;
  cacheEventsInLocalStorage(cachedEvents);
  
  return updated;
}

function deleteEventFromLocalStorage(eventId: string): void {
  const cachedEvents = getEventsFromLocalStorage(new Date(0), new Date(9999999999999));
  const filtered = cachedEvents.filter(e => e.id !== eventId);
  cacheEventsInLocalStorage(filtered);
}

/**
 * Set up polling for calendar events
 */
export function setupCalendarPolling(
  startDate: Date,
  endDate: Date,
  callback: (events: CalendarEvent[]) => void,
  interval: number = POLL_INTERVAL
): () => void {
  let isActive = true;
  
  const poll = async () => {
    if (!isActive) return;
    
    try {
      const events = await fetchCalendarEvents(startDate, endDate);
      callback(events);
    } catch (error) {
      console.error('[Calendar Service] Polling error:', error);
    }
    
    if (isActive) {
      setTimeout(poll, interval);
    }
  };
  
  // Initial fetch
  poll();
  
  // Return cleanup function
  return () => {
    isActive = false;
  };
}

