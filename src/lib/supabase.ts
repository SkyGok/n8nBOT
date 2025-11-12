/**
 * Supabase client configuration
 * Initialize Supabase client with environment variables
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only throw error if Supabase is explicitly enabled but credentials are missing
const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true';
if (useSupabase && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('Supabase is enabled but credentials are missing. Falling back to mock data.');
}

// Create Supabase client with fallback to placeholder if not configured
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Database types matching your Supabase schema
export interface Database {
  public: {
    Tables: {
      calls: {
        Row: {
          id: string;
          phone_number: string;
          contact_name: string | null;
          direction: string;
          status: string;
          duration_seconds: number;
          timestamp: string;
          notes: string | null;
          agent_id: string | null;
          created_at: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          source: string | null;
          scheduled_at: string | null;
          created_by: string | null;
          call_id: string | null;
          status: string;
          created_at: string;
        };
      };
      engagement_metrics: {
        Row: {
          id: number;
          metric_date: string;
          appointments_via_agent: number;
          whatsapp_conversations: number;
          whatsapp_appointments: number;
          notes_count_today: number;
          last_updated: string;
        };
      };
      timeseries: {
        Row: {
          id: number;
          metric: string;
          timestamp: string;
          value: number;
          metadata: Record<string, unknown>;
        };
      };
      status_summary: {
        Row: {
          id: number;
          period: string;
          answered: number;
          missed: number;
          other: number;
          updated_at: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: string | null;
          created_at: string;
        };
      };
    };
  };
}

