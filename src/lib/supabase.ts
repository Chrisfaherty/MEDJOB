import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for common queries
export const jobsAPI = {
  // Get all active jobs
  async getActiveJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('application_deadline', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get jobs with user application status
  async getJobsWithStatus(userId: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        user_applications!left(status, applied_at, interview_date)
      `)
      .eq('is_active', true)
      .eq('user_applications.user_id', userId)
      .order('application_deadline', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get upcoming deadlines (within 7 days)
  async getUpcomingDeadlines(userId?: string) {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    let query = supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .gte('application_deadline', new Date().toISOString())
      .lte('application_deadline', sevenDaysFromNow.toISOString())
      .order('application_deadline', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  // Filter jobs by criteria
  async filterJobs(filters: {
    specialties?: string[];
    hospital_groups?: string[];
    counties?: string[];
    scheme_types?: string[];
  }) {
    let query = supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true);

    if (filters.specialties?.length) {
      query = query.in('specialty', filters.specialties);
    }

    if (filters.hospital_groups?.length) {
      query = query.in('hospital_group', filters.hospital_groups);
    }

    if (filters.counties?.length) {
      query = query.in('county', filters.counties);
    }

    if (filters.scheme_types?.length) {
      query = query.in('scheme_type', filters.scheme_types);
    }

    query = query.order('application_deadline', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  // Search jobs by text
  async searchJobs(searchTerm: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .textSearch('search_vector', searchTerm)
      .eq('is_active', true)
      .order('application_deadline', { ascending: true });

    if (error) throw error;
    return data;
  },
};

export const applicationsAPI = {
  // Update application status
  async updateStatus(jobId: string, userId: string, status: string, notes?: string) {
    const { data, error} = await supabase
      .from('user_applications')
      .upsert({
        job_id: jobId,
        user_id: userId,
        status,
        notes,
        applied_at: status === 'APPLIED' ? new Date().toISOString() : undefined,
      })
      .select();

    if (error) throw error;
    return data;
  },

  // Get user's applications
  async getUserApplications(userId: string) {
    const { data, error } = await supabase
      .from('user_applications')
      .select(`
        *,
        jobs(*)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};

export const preferencesAPI = {
  // Get user preferences
  async getPreferences(userId: string) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  },

  // Update user preferences
  async updatePreferences(userId: string, preferences: any) {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
      })
      .select();

    if (error) throw error;
    return data;
  },
};
