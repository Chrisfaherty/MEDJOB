/**
 * Supabase Client and API Methods
 * Comprehensive database operations for MedJob
 */

import { createClient } from '@supabase/supabase-js';
import type { Job, UserApplication, ApplicationStatus } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =====================================================
// JOBS API
// =====================================================

export const supabaseJobsAPI = {
  /**
   * Get all active jobs
   */
  async getActiveJobs(): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('application_deadline', { ascending: true });

    if (error) throw error;
    return (data || []) as Job[];
  },

  /**
   * Get job by ID
   */
  async getJobById(id: string): Promise<Job | null> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as Job;
  },

  /**
   * Search jobs using full-text search
   */
  async searchJobs(query: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .textSearch('search_vector', query, { type: 'websearch' })
      .eq('is_active', true)
      .order('application_deadline', { ascending: true });

    if (error) throw error;
    return (data || []) as Job[];
  },

  /**
   * Filter jobs by criteria
   */
  async filterJobs(filters: {
    specialties?: string[];
    hospital_groups?: string[];
    counties?: string[];
    scheme_types?: string[];
  }): Promise<Job[]> {
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
    return (data || []) as Job[];
  },

  /**
   * Bulk upsert jobs (for scraper)
   */
  async upsertJobs(jobs: Partial<Job>[]): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .upsert(jobs, {
        onConflict: 'title,hospital_name,application_deadline',
        ignoreDuplicates: false,
      })
      .select();

    if (error) throw error;
    return (data || []) as Job[];
  },

  /**
   * Get upcoming deadlines (within specified days)
   */
  async getUpcomingDeadlines(days: number = 7): Promise<Job[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .gte('application_deadline', new Date().toISOString())
      .lte('application_deadline', futureDate.toISOString())
      .order('application_deadline', { ascending: true });

    if (error) throw error;
    return (data || []) as Job[];
  },
};

// =====================================================
// APPLICATIONS API
// =====================================================

export const supabaseApplicationsAPI = {
  /**
   * Get all applications for current user
   */
  async getUserApplications(): Promise<UserApplication[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as UserApplication[];
  },

  /**
   * Get application for specific job
   */
  async getApplicationForJob(jobId: string): Promise<UserApplication | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_applications')
      .select('*')
      .eq('user_id', user.id)
      .eq('job_id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as UserApplication;
  },

  /**
   * Update application status
   */
  async updateStatus(
    jobId: string,
    status: ApplicationStatus,
    notes?: string
  ): Promise<UserApplication> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_applications')
      .upsert({
        job_id: jobId,
        user_id: user.id,
        status,
        notes,
        applied_at: status === 'APPLIED' ? new Date().toISOString() : undefined,
      })
      .select()
      .single();

    if (error) throw error;
    return data as UserApplication;
  },

  /**
   * Get application statistics
   */
  async getApplicationStats(): Promise<{
    total: number;
    applied: number;
    interview: number;
    shortlisted: number;
  }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .rpc('get_application_stats', { p_user_id: user.id })
      .single();

    if (error) throw error;
    return {
      total: Number(data.total),
      applied: Number(data.applied),
      interview: Number(data.interview),
      shortlisted: Number(data.shortlisted),
    };
  },
};

// =====================================================
// FAVORITES API
// =====================================================

export const supabaseFavoritesAPI = {
  /**
   * Get all favorite job IDs
   */
  async getFavorites(): Promise<string[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_favorites')
      .select('job_id')
      .eq('user_id', user.id);

    if (error) throw error;
    return (data || []).map((f) => f.job_id);
  },

  /**
   * Add job to favorites
   */
  async addFavorite(jobId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_favorites')
      .insert({ user_id: user.id, job_id: jobId });

    if (error && error.code !== '23505') {
      // Ignore duplicate key error
      throw error;
    }
  },

  /**
   * Remove job from favorites
   */
  async removeFavorite(jobId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('job_id', jobId);

    if (error) throw error;
  },

  /**
   * Toggle favorite status
   */
  async toggleFavorite(jobId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    const isFavorite = favorites.includes(jobId);

    if (isFavorite) {
      await this.removeFavorite(jobId);
      return false;
    } else {
      await this.addFavorite(jobId);
      return true;
    }
  },

  /**
   * Check if job is favorited
   */
  isFavorite(jobId: string, favorites: string[]): boolean {
    return favorites.includes(jobId);
  },

  /**
   * Get favorite jobs with full details
   */
  async getFavoriteJobs(): Promise<Job[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_favorites')
      .select('jobs(*)')
      .eq('user_id', user.id);

    if (error) throw error;
    return (data || [])
      .map((f: any) => f.jobs)
      .filter(Boolean) as Job[];
  },
};

// =====================================================
// PREFERENCES API
// =====================================================

export const supabasePreferencesAPI = {
  /**
   * Get user preferences
   */
  async getPreferences(): Promise<any | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: any): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('user_preferences').upsert({
      user_id: user.id,
      ...preferences,
    });

    if (error) throw error;
  },
};

// =====================================================
// USER ADMIN API (Admin only operations)
// =====================================================

export const supabaseUserAPI = {
  /**
   * Get all users (admin only)
   */
  async getAllUsers() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Update user role (admin only)
   */
  async updateUserRole(
    userId: string,
    role: 'admin' | 'user'
  ): Promise<boolean> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      return false;
    }
    return true;
  },

  /**
   * Delete user (admin only)
   * This will cascade delete all related data due to FK constraints
   */
  async deleteUser(userId: string): Promise<boolean> {
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }
    return true;
  },
};
