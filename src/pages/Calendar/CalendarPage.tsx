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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Google Calendar-like Modal Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-normal text-gray-900 dark:text-white">
              {event ? 'Edit Event' : 'Create Event'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-0 py-2 text-lg font-normal border-0 border-b-2 border-transparent focus:border-primary-500 focus:outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Add title"
              />
            </div>

            <div className="flex items-center space-x-3 py-2">
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 py-1 text-sm border-0 border-b-2 border-transparent focus:border-primary-500 focus:outline-none bg-transparent text-gray-700 dark:text-gray-300"
                  />
                  {!allDay && (
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2 py-1 text-sm border-0 border-b-2 border-transparent focus:border-primary-500 focus:outline-none bg-transparent text-gray-700 dark:text-gray-300 mt-1"
                    />
                  )}
                </div>
                <div>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2 py-1 text-sm border-0 border-b-2 border-transparent focus:border-primary-500 focus:outline-none bg-transparent text-gray-700 dark:text-gray-300"
                  />
                  {!allDay && (
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-2 py-1 text-sm border-0 border-b-2 border-transparent focus:border-primary-500 focus:outline-none bg-transparent text-gray-700 dark:text-gray-300 mt-1"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 py-2">
              <input
                type="checkbox"
                id="allDay"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="allDay" className="text-sm text-gray-700 dark:text-gray-300">
                All day
              </label>
            </div>

            <div className="flex items-center space-x-3 py-2">
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border-0 border-b-2 border-transparent focus:border-primary-500 focus:outline-none bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Add location"
              />
            </div>

            <div className="flex items-start space-x-3 py-2">
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="flex-1 px-2 py-1 text-sm border-0 border-b-2 border-transparent focus:border-primary-500 focus:outline-none bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                placeholder="Add description"
              />
            </div>

          </div>
        </div>

        {/* Google Calendar-like Modal Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          {event && onDelete && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              disabled={isSaving}
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
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

  const formatDate = (date: Date) => {
    return moment(date).format('MMMM YYYY');
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPrevious = () => {
    if (currentView === 'month') {
      setCurrentDate(moment(currentDate).subtract(1, 'month').toDate());
    } else if (currentView === 'week') {
      setCurrentDate(moment(currentDate).subtract(1, 'week').toDate());
    } else {
      setCurrentDate(moment(currentDate).subtract(1, 'day').toDate());
    }
  };

  const goToNext = () => {
    if (currentView === 'month') {
      setCurrentDate(moment(currentDate).add(1, 'month').toDate());
    } else if (currentView === 'week') {
      setCurrentDate(moment(currentDate).add(1, 'week').toDate());
    } else {
      setCurrentDate(moment(currentDate).add(1, 'day').toDate());
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Google Calendar-like Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between mb-4">
          {/* Left side - Title and Navigation */}
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-normal text-gray-900 dark:text-white">Calendar</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPrevious}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                aria-label="Previous"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNext}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                aria-label="Next"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 transition-colors"
              >
                Today
              </button>
            </div>
            <div className="text-lg font-normal text-gray-700 dark:text-gray-300">
              {formatDate(currentDate)}
            </div>
          </div>

          {/* Right side - View Selector */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setCurrentView('day')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                currentView === 'day'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setCurrentView('week')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                currentView === 'week'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setCurrentView('month')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                currentView === 'month'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Container */}
      <div className="flex-1 bg-white dark:bg-gray-800 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 dark:text-gray-400">Loading calendar events...</div>
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
            components={{
              toolbar: () => null, // Hide default toolbar, we have custom one
            }}
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

