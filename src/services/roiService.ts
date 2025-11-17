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
    let query = supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true });

    // Apply date filters if provided
    if (filters?.startDate) {
      const startDateISO = formatISO(startOfDay(filters.startDate));
      query = query.gte('created_at', startDateISO);
    }

    if (filters?.endDate) {
      const endDateISO = formatISO(endOfDay(filters.endDate));
      query = query.lte('created_at', endDateISO);
    }

    // Note: user_id filtering removed for demo purposes
    // Uncomment below if you want to filter by user_id:
    // if (filters?.userId) {
    //   query = query.eq('user_id', filters.userId);
    // }

    const { count, error } = await query;

    if (error) {
      console.error('[ROI Service] Error fetching appointments:', error);
      return 0;
    }

    return count || 0;
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

