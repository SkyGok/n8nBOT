/**
 * ROI Service
 * Functions to fetch appointment data from Supabase for ROI calculations
 * All queries use tenant-scoped Supabase client for automatic tenant isolation
 */

import { supabase, getTenantSupabase, Database } from '@/lib/supabase';
import { startOfDay, endOfDay } from 'date-fns';

// Database row types
type AppointmentRow = Database['public']['Tables']['appointments']['Row'];

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
    // Use tenant-scoped client for automatic tenant isolation
    const tenantSupabase = getTenantSupabase();
    
    // Fetch all appointments and filter by date in JavaScript for better reliability
    const { data: allAppointments, error } = await tenantSupabase
      .from('appointments')
      .select('id, appointment_datetime, scheduled_at, created_at') as { data: AppointmentRow[] | null; error: any };

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
      filteredAppointments = (allAppointments || []).filter((apt) => {
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

