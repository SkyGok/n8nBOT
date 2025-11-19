/**
 * ROI Service
 * Functions to fetch appointment data from Supabase for ROI calculations
 */

import { supabase } from '@/lib/supabase';
import { formatISO, startOfDay, endOfDay } from 'date-fns';

export interface AppointmentFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}

/**
 * Fetch appointment count from Supabase
 */
export async function fetchAppointmentCount(filters?: AppointmentFilters): Promise<number> {
  try {
    // For demo: No user_id filtering - show all appointments
    // Fetch all appointments and filter by date in JavaScript for better reliability
    const { data: allAppointments, error } = await supabase
      .from('appointments')
      .select('id, appointment_datetime, scheduled_at, created_at');

    if (error) {
      console.error('[ROI Service] Error fetching appointments:', error);
      return 0;
    }

    if (!allAppointments || allAppointments.length === 0) {
      return 0;
    }

    // Filter by date range if provided
    let filteredAppointments = allAppointments;
    
    if (filters?.startDate || filters?.endDate) {
      filteredAppointments = allAppointments.filter((apt) => {
        // Use appointment_datetime, scheduled_at, or created_at (in that order)
        const appointmentDate = apt.appointment_datetime || apt.scheduled_at || apt.created_at;
        if (!appointmentDate) return false;
        
        const date = new Date(appointmentDate);
        
        // Check start date filter
        if (filters?.startDate) {
          const startDate = startOfDay(filters.startDate);
          if (date < startDate) return false;
        }
        
        // Check end date filter
        if (filters?.endDate) {
          const endDate = endOfDay(filters.endDate);
          if (date > endDate) return false;
        }
        
        return true;
      });
    }

    return filteredAppointments.length;
  } catch (error) {
    console.error('[ROI Service] Error fetching appointments:', error);
    return 0;
  }
}

/**
 * Get current user ID from Supabase auth
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    return user.id;
  } catch (error) {
    console.error('[ROI Service] Error getting user ID:', error);
    return null;
  }
}

