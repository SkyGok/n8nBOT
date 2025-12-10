/**
 * Calendar service
 * Handles calendar events fetching and creation
 * Priority: Supabase > n8n webhook > localStorage
 */

import { CalendarEvent, CreateCalendarEventInput, AppointmentRow, CalendarEventRow } from '@/types/calendar';
import { supabase, getTenantSupabase } from '@/lib/supabase';

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
 * Priority: Supabase calendar_events > Supabase appointments > n8n webhook > localStorage
 */
export async function fetchCalendarEvents(
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  // Try Supabase first
  if (isSupabaseAvailable()) {
    try {
      // Use tenant-scoped client for automatic tenant isolation
      const tenantSupabase = getTenantSupabase();
      
      // Fetch calendar_events
      const { data: calendarEvents, error: calendarError } = await tenantSupabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString())
        .order('start_time', { ascending: true });

      // Fetch confirmed appointments and filter by date range in JavaScript
      // This ensures we get all appointments that might fall within the range
      const { data: allAppointments, error: appointmentsError } = await tenantSupabase
        .from('appointments')
        .select('*')
        .eq('status', 'Confirmed') as { data: AppointmentRow[] | null; error: any };

      // Filter appointments by date range
      const appointments = (allAppointments || []).filter((apt) => {
        // Use appointment_datetime first, then scheduled_at as fallback
        const appointmentDate = apt.appointment_datetime || apt.scheduled_at;
        if (!appointmentDate) return false;
        
        const date = new Date(appointmentDate);
        // Check if appointment falls within the requested date range
        return date >= startDate && date <= endDate;
      }).sort((a, b) => {
        // Sort by appointment date
        const dateA = new Date(a.appointment_datetime || a.scheduled_at || 0);
        const dateB = new Date(b.appointment_datetime || b.scheduled_at || 0);
        return dateA.getTime() - dateB.getTime();
      });

      if (calendarError) {
        console.error('[Calendar Service] Supabase calendar_events error:', calendarError);
      }

      if (appointmentsError) {
        console.error('[Calendar Service] Supabase appointments error:', appointmentsError);
      }

      // Transform calendar_events to CalendarEvent format
      const calendarEventList: CalendarEvent[] = ((calendarEvents || []) as CalendarEventRow[]).map((event) => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        description: event.description || undefined,
        location: event.location || undefined,
        allDay: event.all_day || false,
        color: event.color_id || undefined,
        metadata: {
          ...(event.metadata || {}),
          google_event_id: event.google_event_id,
          user_id: event.user_id,
          status: event.status,
          timezone: event.timezone,
          recurrence: event.recurrence,
          attendees: event.attendees,
          reminders: event.reminders,
          appointment_id: event.appointment_id,
        },
      }));

      // Transform appointments to CalendarEvent format (for appointments without calendar_events)
      const appointmentEventList: CalendarEvent[] = (appointments || [])
        .filter((apt) => {
          // Only include appointments that don't have a calendar_event_id
          // or whose calendar_event_id doesn't exist in calendar_events
          if (!apt.calendar_event_id) return true;
          const hasCalendarEvent = (calendarEvents as CalendarEventRow[] | null)?.some((ce) => ce.id === apt.calendar_event_id);
          return !hasCalendarEvent;
        })
        .map((apt): CalendarEvent | null => {
          const appointmentDate = apt.appointment_datetime || apt.scheduled_at;
          if (!appointmentDate) return null;

          const startTime = new Date(appointmentDate);
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour duration

          // Create title from appointment data
          const titleParts: string[] = [];
          if (apt.service_type) titleParts.push(apt.service_type);
          if (apt.client_name) titleParts.push(apt.client_name);
          if (apt.therapist_name) titleParts.push(apt.therapist_name);
          const title = titleParts.length > 0 
            ? titleParts.join(' - ')
            : 'Appointment';

          return {
            id: apt.id,
            title,
            start: startTime,
            end: endTime,
            description: apt.notes || undefined,
            location: undefined,
            allDay: false,
            color: undefined,
            metadata: {
              appointment_id: apt.id,
              client_name: apt.client_name,
              client_email: apt.client_email,
              client_phone: apt.client_phone,
              service_type: apt.service_type,
              therapist_name: apt.therapist_name,
              source: apt.source,
            },
          };
        })
        .filter((event): event is CalendarEvent => event !== null);

      // Combine both lists, removing duplicates by ID
      const allEvents = [...calendarEventList, ...appointmentEventList];
      const uniqueEvents = Array.from(
        new Map(allEvents.map(event => [event.id, event])).values()
      );

      if (uniqueEvents.length > 0) {
        return uniqueEvents;
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
 * Get current user ID from Supabase auth
 */
async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseAvailable()) return null;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('[Calendar Service] Error getting user:', error);
    return null;
  }
}

/**
 * Generate a unique google_event_id for manually created events
 */
function generateGoogleEventId(): string {
  return `manual-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
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
      // Use tenant-scoped client for automatic tenant isolation
      const tenantSupabase = getTenantSupabase();
      
      // Get current user ID
      const userId = await getCurrentUserId();
      
      // Generate a unique google_event_id for manually created events
      const googleEventId = generateGoogleEventId();
      
      // Ensure dates are ISO strings
      const startTime = typeof event.start === 'string' 
        ? event.start 
        : new Date(event.start).toISOString();
      const endTime = typeof event.end === 'string' 
        ? event.end 
        : new Date(event.end).toISOString();

      const insertData: any = {
        google_event_id: googleEventId,
        title: event.title,
        description: event.description || null,
        location: event.location || null,
        start_time: startTime,
        end_time: endTime,
        all_day: event.allDay || false,
        status: 'confirmed',
        metadata: event.metadata || {},
      };

      // Extract color_id from metadata if present
      if (event.metadata?.color_id) {
        insertData.color_id = event.metadata.color_id;
      } else if (event.metadata?.color) {
        insertData.color_id = event.metadata.color;
      }

      // Only include user_id if we have it (for RLS policies)
      if (userId) {
        insertData.user_id = userId;
      }

      const { data, error } = (await (tenantSupabase
        .from('calendar_events')
        .insert(insertData as any) as any)
        .select()
        .single()) as { data: CalendarEventRow | null; error: any };

      if (error) {
        console.error('[Calendar Service] Supabase insert error:', error);
        // Show more detailed error
        throw new Error(`Failed to create event: ${error.message}${error.details ? ` (${error.details})` : ''}${error.hint ? ` Hint: ${error.hint}` : ''}`);
      }

      if (data) {
        const createdEvent: CalendarEvent = {
          id: data.id,
          title: data.title,
          start: new Date(data.start_time),
          end: new Date(data.end_time),
          description: data.description || undefined,
          location: data.location || undefined,
          allDay: data.all_day || false,
          color: data.color_id || undefined,
          metadata: {
            ...(data.metadata || {}),
            google_event_id: data.google_event_id,
            user_id: data.user_id,
            status: data.status,
            timezone: data.timezone,
            recurrence: data.recurrence,
            attendees: data.attendees,
            reminders: data.reminders,
          },
        };

        // Also notify n8n webhook if configured
        notifyN8nWebhook('create', createdEvent).catch(console.error);

        return createdEvent;
      }
    } catch (error) {
      console.error('[Calendar Service] Error creating in Supabase:', error);
      // Re-throw error so it can be handled by the caller
      throw error;
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
      // Use tenant-scoped client for automatic tenant isolation
      const tenantSupabase = getTenantSupabase();
      
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description || null;
      if (updates.location !== undefined) updateData.location = updates.location || null;
      if (updates.start !== undefined) {
        updateData.start_time = typeof updates.start === 'string' 
          ? updates.start 
          : new Date(updates.start).toISOString();
      }
      if (updates.end !== undefined) {
        updateData.end_time = typeof updates.end === 'string' 
          ? updates.end 
          : new Date(updates.end).toISOString();
      }
      if (updates.allDay !== undefined) updateData.all_day = updates.allDay;
      if (updates.metadata !== undefined) {
        // Extract color from metadata if present, otherwise use metadata as-is
        const metadata = updates.metadata || {};
        updateData.metadata = metadata;
        if (metadata.color_id !== undefined) updateData.color_id = metadata.color_id;
      }
      // Update synced_at when event is modified
      updateData.synced_at = new Date().toISOString();

      // @ts-expect-error - Supabase type inference issue with Database interface
      const updateQuery = tenantSupabase.from('calendar_events').update(updateData);
      const { data, error } = (await updateQuery.eq('id', eventId).select().single()) as { data: CalendarEventRow | null; error: any };

      if (error) {
        console.error('[Calendar Service] Supabase update error:', error);
        throw new Error(`Failed to update event: ${error.message}${error.details ? ` (${error.details})` : ''}${error.hint ? ` Hint: ${error.hint}` : ''}`);
      }

      if (data) {
        const updatedEvent: CalendarEvent = {
          id: data.id,
          title: data.title,
          start: new Date(data.start_time),
          end: new Date(data.end_time),
          description: data.description || undefined,
          location: data.location || undefined,
          allDay: data.all_day || false,
          color: data.color_id || undefined,
          metadata: {
            ...(data.metadata || {}),
            google_event_id: data.google_event_id,
            user_id: data.user_id,
            status: data.status,
            timezone: data.timezone,
            recurrence: data.recurrence,
            attendees: data.attendees,
            reminders: data.reminders,
          },
        };

        // Also notify n8n webhook if configured
        notifyN8nWebhook('update', updatedEvent).catch(console.error);

        return updatedEvent;
      }
    } catch (error) {
      console.error('[Calendar Service] Error updating in Supabase:', error);
      // Re-throw error so it can be handled by the caller
      throw error;
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
      // Use tenant-scoped client for automatic tenant isolation
      const tenantSupabase = getTenantSupabase();
      
      const { error } = await tenantSupabase
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
    // Use tenant-scoped client for automatic tenant isolation
    const tenantSupabase = getTenantSupabase();
    const userId = await getCurrentUserId();
    const googleEventId = event.metadata?.google_event_id as string || generateGoogleEventId();
    
    // Check if event exists
    const { data: existing } = await tenantSupabase
      .from('calendar_events')
      .select('id')
      .eq('id', event.id)
      .single() as { data: { id: string } | null; error: any };

    const eventData: any = {
      title: event.title,
      description: event.description || null,
      location: event.location || null,
      start_time: event.start.toISOString(),
      end_time: event.end.toISOString(),
      all_day: event.allDay || false,
      color_id: event.color || event.metadata?.color_id || event.metadata?.color || null,
      metadata: event.metadata || {},
      synced_at: new Date().toISOString(),
    };

    if (userId) {
      eventData.user_id = userId;
    }

    if (existing) {
      // Update existing event
      eventData.updated_at = new Date().toISOString();
      // @ts-expect-error - Supabase type inference issue with Database interface
      const updateQuery = tenantSupabase.from('calendar_events').update(eventData);
      await updateQuery.eq('id', event.id);
    } else {
      // Insert new event
      eventData.id = event.id;
      eventData.google_event_id = googleEventId;
      const insertQuery = tenantSupabase.from('calendar_events').insert(eventData as any) as any;
      await insertQuery;
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
    // Use tenant-scoped client for automatic tenant isolation
    const tenantSupabase = getTenantSupabase();
    const userId = await getCurrentUserId();
    
    // Upsert all events
    const eventsToUpsert = events.map(event => ({
      id: event.id,
      google_event_id: event.metadata?.google_event_id as string || generateGoogleEventId(),
      user_id: userId,
      title: event.title,
      description: event.description || null,
      location: event.location || null,
      start_time: event.start.toISOString(),
      end_time: event.end.toISOString(),
      all_day: event.allDay || false,
      color_id: event.color || event.metadata?.color_id || event.metadata?.color || null,
      status: (event.metadata?.status as string) || 'confirmed',
      metadata: event.metadata || {},
      synced_at: new Date().toISOString(),
    }));

    // Use upsert to handle both insert and update
    await (tenantSupabase
      .from('calendar_events')
      .upsert(eventsToUpsert as any, { onConflict: 'id' }) as any);
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

