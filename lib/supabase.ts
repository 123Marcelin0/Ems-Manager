import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side Supabase client (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Server-side Supabase client (bypasses RLS)
// Falls back to regular client if service key is not available
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase

// Database types will be generated here later
export type Database = {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          name: string
          user_id: string
          phone_number: string
          role: 'manager' | 'allrounder' | 'versorger' | 'verkauf' | 'essen'
          skills: string[]
          employment_type: 'part_time' | 'fixed'
          is_always_needed: boolean
          last_worked_date: string | null
          total_hours_worked: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
          phone_number: string
          role: 'manager' | 'allrounder' | 'versorger' | 'verkauf' | 'essen'
          skills?: string[]
          employment_type?: 'part_time' | 'fixed'
          is_always_needed?: boolean
          last_worked_date?: string | null
          total_hours_worked?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
          phone_number?: string
          role?: 'manager' | 'allrounder' | 'versorger' | 'verkauf' | 'essen'
          skills?: string[]
          employment_type?: 'part_time' | 'fixed'
          is_always_needed?: boolean
          last_worked_date?: string | null
          total_hours_worked?: number
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          location: string
          event_date: string
          start_time: string
          end_time: string | null
          description: string | null
          specialties: string | null
          hourly_rate: number
          employees_needed: number
          employees_to_ask: number
          status: 'draft' | 'recruiting' | 'planned' | 'active' | 'completed' | 'cancelled'
          created_by: string | null
          created_at: string
          updated_at: string
          is_template: boolean
          template_id: string | null
        }
        Insert: {
          id?: string
          title: string
          location: string
          event_date: string
          start_time: string
          end_time?: string | null
          description?: string | null
          specialties?: string | null
          hourly_rate: number
          employees_needed: number
          employees_to_ask: number
          status?: 'draft' | 'recruiting' | 'planned' | 'active' | 'completed' | 'cancelled'
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_template?: boolean
          template_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          location?: string
          event_date?: string
          start_time?: string
          end_time?: string | null
          description?: string | null
          specialties?: string | null
          hourly_rate?: number
          employees_needed?: number
          employees_to_ask?: number
          status?: 'draft' | 'recruiting' | 'planned' | 'active' | 'completed' | 'cancelled'
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_template?: boolean
          template_id?: string | null
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          template_type: 'event' | 'work_area' | 'combined'
          location: string | null
          event_data: any
          work_areas_data: any
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          template_type: 'event' | 'work_area' | 'combined'
          location?: string | null
          event_data?: any
          work_areas_data?: any
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          template_type?: 'event' | 'work_area' | 'combined'
          location?: string | null
          event_data?: any
          work_areas_data?: any
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      work_areas: {
        Row: {
          id: string
          event_id: string
          name: string
          location: string
          max_capacity: number
          is_active: boolean
          role_requirements: any
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          location: string
          max_capacity: number
          is_active?: boolean
          role_requirements: any
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          location?: string
          max_capacity?: number
          is_active?: boolean
          role_requirements?: any
          created_at?: string
        }
      }
      work_assignments: {
        Row: {
          id: string
          employee_id: string
          work_area_id: string
          event_id: string
          assigned_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          work_area_id: string
          event_id: string
          assigned_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          work_area_id?: string
          event_id?: string
          assigned_at?: string
        }
      }
      // More tables will be added as we implement them
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_event_with_work_areas: {
        Args: {
          p_event_data: any
          p_work_areas_data?: any
        }
        Returns: any
      }
      save_work_assignments: {
        Args: {
          p_event_id: string
          p_assignments: any
        }
        Returns: any
      }
      create_template_from_event: {
        Args: {
          p_event_id: string
          p_template_name: string
          p_template_type?: string
        }
        Returns: string
      }
    }
    Enums: {
      employee_role: 'manager' | 'allrounder' | 'versorger' | 'verkauf' | 'essen'
      employment_type: 'part_time' | 'fixed'
      event_status: 'draft' | 'recruiting' | 'planned' | 'active' | 'completed' | 'cancelled'
      employee_event_status_enum: 'not_asked' | 'asked' | 'available' | 'unavailable' | 'selected' | 'working' | 'completed'
      time_record_status: 'active' | 'completed' | 'cancelled'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}