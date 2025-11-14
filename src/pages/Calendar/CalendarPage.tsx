/**
 * Calendar page component
 * Displays calendar events with month/week/day views
 * Integrates with n8n webhooks for Google Calendar sync
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, momentLocalizer, View, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarEvent, CreateCalendarEventInput } from '@/types/calendar';
import { fetchCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, setupCalendarPolling } from '@/services/calendar';

const localizer = momentLocalizer(moment);

interface EventModalProps {
  event: CalendarEvent | null;
  slotInfo: SlotInfo | null;
  onClose: () => void;
  onSave: (event: CreateCalendarEventInput) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
}

const EventModal: React.FC<EventModalProps> = ({ event, slotInfo, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [location, setLocation] = useState(event?.location || '');
  const [allDay, setAllDay] = useState(event?.allDay || false);
  const [startDate, setStartDate] = useState(
    event?.start ? moment(event.start).format('YYYY-MM-DD') : (slotInfo ? moment(slotInfo.start).format('YYYY-MM-DD') : '')
  );
  const [startTime, setStartTime] = useState(
    event?.start ? moment(event.start).format('HH:mm') : (slotInfo ? moment(slotInfo.start).format('HH:mm') : '09:00')
  );
  const [endDate, setEndDate] = useState(
    event?.end ? moment(event.end).format('YYYY-MM-DD') : (slotInfo ? moment(slotInfo.end).format('YYYY-MM-DD') : '')
  );
  const [endTime, setEndTime] = useState(
    event?.end ? moment(event.end).format('HH:mm') : (slotInfo ? moment(slotInfo.end).format('HH:mm') : '10:00')
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsSaving(true);
    try {
      const start = moment(`${startDate} ${allDay ? '00:00' : startTime}`).toISOString();
      const end = moment(`${endDate} ${allDay ? '23:59' : endTime}`).toISOString();

      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        start,
        end,
        allDay,
      });
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !onDelete) return;
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await onDelete(event.id);
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {event ? 'Edit Event' : 'Create Event'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Event title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Event description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Event location"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allDay"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="allDay" className="ml-2 block text-sm text-gray-700">
                All day event
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {!allDay && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {!allDay && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            {event && onDelete && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                disabled={isSaving}
              >
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      // Load events for a wider range to cover all views
      const start = moment(currentDate).startOf('month').subtract(1, 'month').toDate();
      const end = moment(currentDate).endOf('month').add(1, 'month').toDate();
      
      const fetchedEvents = await fetchCalendarEvents(start, end);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadEvents();

    // Set up polling for calendar updates
    const start = moment(currentDate).startOf('month').subtract(1, 'month').toDate();
    const end = moment(currentDate).endOf('month').add(1, 'month').toDate();
    
    const cleanup = setupCalendarPolling(start, end, (updatedEvents) => {
      setEvents(updatedEvents);
    });

    return cleanup;
  }, [currentDate, loadEvents]);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo);
    setSelectedEvent(null);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedSlot(null);
  }, []);

  const handleSaveEvent = async (eventData: CreateCalendarEventInput) => {
    try {
      if (selectedEvent) {
        // Update existing event
        await updateCalendarEvent(selectedEvent.id, eventData);
      } else {
        // Create new event
        await createCalendarEvent(eventData);
      }
      await loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save event. Please check the browser console for details.';
      alert(errorMessage);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteCalendarEvent(eventId);
    await loadEvents();
  };

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color || '#3174ad',
        borderColor: event.color || '#3174ad',
        color: '#fff',
      },
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentView('month')}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentView === 'month'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setCurrentView('week')}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentView === 'week'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setCurrentView('day')}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentView === 'day'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Day
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4" style={{ height: '600px' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading calendar events...</div>
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            view={currentView}
            date={currentDate}
            onView={handleViewChange}
            onNavigate={handleNavigate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            eventPropGetter={eventStyleGetter}
            popup
          />
        )}
      </div>

      {(selectedEvent || selectedSlot) && (
        <EventModal
          event={selectedEvent}
          slotInfo={selectedSlot}
          onClose={() => {
            setSelectedEvent(null);
            setSelectedSlot(null);
          }}
          onSave={handleSaveEvent}
          onDelete={selectedEvent ? handleDeleteEvent : undefined}
        />
      )}
    </div>
  );
};

