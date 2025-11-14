/**
 * Calendar service
 * Handles calendar events fetching and creation
 * Priority: Supabase > n8n webhook > localStorage
 */

import { CalendarEvent, CreateCalendarEventInput } from '@/types/calendar';
import { supabase } from '@/lib/supabase';

const CALENDAR_STORAGE_KEY = 'calendar_events';
const POLL_INTERVAL = 30000; // 30 seconds

// Check if Supabase is configured and available
function isSupabaseAvailable(): boolean {
  const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true';
  const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
  const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  return useSupabase && hasUrl && hasKey;
}

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
 * Fetch calendar events
 * Priority: Supabase > n8n webhook > localStorage
 */
export async function fetchCalendarEvents(
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  // Try Supabase first
  if (isSupabaseAvailable()) {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('[Calendar Service] Supabase error:', error);
        // Fall through to next method
      } else if (data) {
        // Transform Supabase data to CalendarEvent format
        const events: CalendarEvent[] = data.map((event) => ({
          id: event.id,
          title: event.title,
          start: new Date(event.start_time),
          end: new Date(event.end_time),
          description: event.description || undefined,
          location: event.location || undefined,
          allDay: event.all_day || false,
          color: event.color || undefined,
          metadata: event.metadata || {},
        }));
        return events;
      }
    } catch (error) {
      console.error('[Calendar Service] Error fetching from Supabase:', error);
      // Fall through to next method
    }
  }

  // Try n8n webhook
  const webhookUrl = getCalendarWebhookUrl();
  if (webhookUrl) {
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

      if (response.ok) {
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

        // Sync to Supabase if available
        if (isSupabaseAvailable() && events.length > 0) {
          syncEventsToSupabase(events).catch(console.error);
        }
        
        return events;
      }
    } catch (error) {
      console.error('[Calendar Service] Error fetching from webhook:', error);
      // Fall through to localStorage
    }
  }

  // Fallback to localStorage
  return getEventsFromLocalStorage(startDate, endDate);
}

/**
 * Create a new calendar event
 * Priority: Supabase > n8n webhook > localStorage
 */
export async function createCalendarEvent(
  event: CreateCalendarEventInput
): Promise<CalendarEvent> {
  // Try Supabase first
  if (isSupabaseAvailable()) {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          title: event.title,
          description: event.description || null,
          location: event.location || null,
          start_time: event.start,
          end_time: event.end,
          all_day: event.allDay || false,
          color: null,
          metadata: event.metadata || {},
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const createdEvent: CalendarEvent = {
          id: data.id,
          title: data.title,
          start: new Date(data.start_time),
          end: new Date(data.end_time),
          description: data.description || undefined,
          location: data.location || undefined,
          allDay: data.all_day,
          color: data.color || undefined,
          metadata: data.metadata || {},
        };

        // Also notify n8n webhook if configured
        notifyN8nWebhook('create', createdEvent).catch(console.error);

        return createdEvent;
      }
    } catch (error) {
      console.error('[Calendar Service] Error creating in Supabase:', error);
      // Fall through to next method
    }
  }

  // Try n8n webhook
  const webhookUrl = getCalendarWebhookUrl();
  if (webhookUrl) {
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

      if (response.ok) {
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

        // Sync to Supabase if available
        if (isSupabaseAvailable()) {
          syncEventToSupabase(createdEvent).catch(console.error);
        }

        // Cache in localStorage
        const cachedEvents = getEventsFromLocalStorage(new Date(0), new Date(9999999999999));
        cachedEvents.push(createdEvent);
        cacheEventsInLocalStorage(cachedEvents);

        return createdEvent;
      }
    } catch (error) {
      console.error('[Calendar Service] Error creating via webhook:', error);
      // Fall through to localStorage
    }
  }

  // Fallback to localStorage
  return createEventInLocalStorage(event);
}

/**
 * Update an existing calendar event
 * Priority: Supabase > n8n webhook > localStorage
 */
export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<CreateCalendarEventInput>
): Promise<CalendarEvent> {
  // Try Supabase first
  if (isSupabaseAvailable()) {
    try {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description || null;
      if (updates.location !== undefined) updateData.location = updates.location || null;
      if (updates.start !== undefined) updateData.start_time = updates.start;
      if (updates.end !== undefined) updateData.end_time = updates.end;
      if (updates.allDay !== undefined) updateData.all_day = updates.allDay;
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata || {};

      const { data, error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const updatedEvent: CalendarEvent = {
          id: data.id,
          title: data.title,
          start: new Date(data.start_time),
          end: new Date(data.end_time),
          description: data.description || undefined,
          location: data.location || undefined,
          allDay: data.all_day,
          color: data.color || undefined,
          metadata: data.metadata || {},
        };

        // Also notify n8n webhook if configured
        notifyN8nWebhook('update', updatedEvent).catch(console.error);

        return updatedEvent;
      }
    } catch (error) {
      console.error('[Calendar Service] Error updating in Supabase:', error);
      // Fall through to next method
    }
  }

  // Try n8n webhook
  const webhookUrl = getCalendarWebhookUrl();
  if (webhookUrl) {
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

      if (response.ok) {
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

        // Sync to Supabase if available
        if (isSupabaseAvailable()) {
          syncEventToSupabase(updatedEvent).catch(console.error);
        }

        // Update in localStorage
        const cachedEvents = getEventsFromLocalStorage(new Date(0), new Date(9999999999999));
        const index = cachedEvents.findIndex(e => e.id === eventId);
        if (index >= 0) {
          cachedEvents[index] = updatedEvent;
          cacheEventsInLocalStorage(cachedEvents);
        }

        return updatedEvent;
      }
    } catch (error) {
      console.error('[Calendar Service] Error updating via webhook:', error);
      // Fall through to localStorage
    }
  }

  // Fallback to localStorage
  return updateEventInLocalStorage(eventId, updates);
}

/**
 * Delete a calendar event
 * Priority: Supabase > n8n webhook > localStorage
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  // Try Supabase first
  if (isSupabaseAvailable()) {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        throw error;
      }

      // Also notify n8n webhook if configured
      notifyN8nWebhook('delete', { id: eventId } as CalendarEvent).catch(console.error);

      // Remove from localStorage
      deleteEventFromLocalStorage(eventId);
      return;
    } catch (error) {
      console.error('[Calendar Service] Error deleting from Supabase:', error);
      // Fall through to next method
    }
  }

  // Try n8n webhook
  const webhookUrl = getCalendarWebhookUrl();
  if (webhookUrl) {
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

      if (response.ok) {
        // Remove from localStorage
        deleteEventFromLocalStorage(eventId);
        return;
      }
    } catch (error) {
      console.error('[Calendar Service] Error deleting via webhook:', error);
      // Fall through to localStorage
    }
  }

  // Fallback to localStorage
  deleteEventFromLocalStorage(eventId);
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
 * Notify n8n webhook about calendar event changes
 */
async function notifyN8nWebhook(
  action: 'create' | 'update' | 'delete',
  event: CalendarEvent
): Promise<void> {
  const webhookUrl = getCalendarWebhookUrl();
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        event: action === 'delete' ? { id: event.id } : {
          id: event.id,
          title: event.title,
          start: event.start.toISOString(),
          end: event.end.toISOString(),
          description: event.description,
          location: event.location,
          allDay: event.allDay,
          color: event.color,
          metadata: event.metadata,
        },
      }),
    });
  } catch (error) {
    console.error('[Calendar Service] Error notifying n8n webhook:', error);
    // Don't throw - this is a background operation
  }
}

/**
 * Sync a single event to Supabase
 */
async function syncEventToSupabase(event: CalendarEvent): Promise<void> {
  if (!isSupabaseAvailable()) return;

  try {
    // Check if event exists
    const { data: existing } = await supabase
      .from('calendar_events')
      .select('id')
      .eq('id', event.id)
      .single();

    if (existing) {
      // Update existing event
      await supabase
        .from('calendar_events')
        .update({
          title: event.title,
          description: event.description || null,
          location: event.location || null,
          start_time: event.start.toISOString(),
          end_time: event.end.toISOString(),
          all_day: event.allDay || false,
          color: event.color || null,
          metadata: event.metadata || {},
        })
        .eq('id', event.id);
    } else {
      // Insert new event
      await supabase
        .from('calendar_events')
        .insert({
          id: event.id,
          title: event.title,
          description: event.description || null,
          location: event.location || null,
          start_time: event.start.toISOString(),
          end_time: event.end.toISOString(),
          all_day: event.allDay || false,
          color: event.color || null,
          metadata: event.metadata || {},
        });
    }
  } catch (error) {
    console.error('[Calendar Service] Error syncing event to Supabase:', error);
    // Don't throw - this is a background operation
  }
}

/**
 * Sync multiple events to Supabase
 */
async function syncEventsToSupabase(events: CalendarEvent[]): Promise<void> {
  if (!isSupabaseAvailable() || events.length === 0) return;

  try {
    // Upsert all events
    const eventsToUpsert = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description || null,
      location: event.location || null,
      start_time: event.start.toISOString(),
      end_time: event.end.toISOString(),
      all_day: event.allDay || false,
      color: event.color || null,
      metadata: event.metadata || {},
    }));

    // Use upsert to handle both insert and update
    await supabase
      .from('calendar_events')
      .upsert(eventsToUpsert, { onConflict: 'id' });
  } catch (error) {
    console.error('[Calendar Service] Error syncing events to Supabase:', error);
    // Don't throw - this is a background operation
  }
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

