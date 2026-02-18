/**
 * Supabase Client and API Methods
 * Comprehensive database operations for MedJob
 */

import { createClient } from '@supabase/supabase-js';
import type { Job, UserApplication, ApplicationStatus, AccommodationListing, AccommodationInquiry } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Guard against empty URL (build time, missing env vars)
function createSupabaseClient(url: string, key: string) {
  if (!url || !key) {
    console.warn('Supabase credentials missing — client will not work');
    // Return a dummy proxy that won't crash on access but will fail on actual calls
    return null as unknown as ReturnType<typeof createClient>;
  }
  return createClient(url, key);
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Service role client for server-side operations (bypasses RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const supabaseAdmin = supabaseServiceKey
  ? createSupabaseClient(supabaseUrl, supabaseServiceKey)
  : supabase;

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
    const stats = data as { total: number; applied: number; interview: number; shortlisted: number };
    return {
      total: Number(stats.total),
      applied: Number(stats.applied),
      interview: Number(stats.interview),
      shortlisted: Number(stats.shortlisted),
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

// =====================================================
// ACCOMMODATION API
// =====================================================

export const supabaseAccommodationAPI = {
  /**
   * Get all active listings
   */
  async getActiveListings(): Promise<AccommodationListing[]> {
    // Try join with user_profiles (requires direct FK); fall back to plain select
    const { data, error } = await supabase
      .from('accommodation_listings')
      .select('*, user_profiles(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      // If the join fails (no FK relationship detected), fetch without join
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('accommodation_listings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fallbackError) throw fallbackError;
      return (fallbackData || []).map((d: any) => ({
        ...d,
        poster_name: 'Anonymous',
      })) as AccommodationListing[];
    }

    return (data || []).map((d: any) => ({
      ...d,
      poster_name: d.user_profiles?.name || 'Anonymous',
      user_profiles: undefined,
    })) as AccommodationListing[];
  },

  /**
   * Get listing by ID
   */
  async getListingById(id: string): Promise<AccommodationListing | null> {
    const { data, error } = await supabase
      .from('accommodation_listings')
      .select('*, user_profiles(name)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      // Fallback without join
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('accommodation_listings')
        .select('*')
        .eq('id', id)
        .single();
      if (fallbackError) {
        if (fallbackError.code === 'PGRST116') return null;
        throw fallbackError;
      }
      return { ...fallbackData, poster_name: 'Anonymous' } as AccommodationListing;
    }
    return {
      ...data,
      poster_name: (data as any).user_profiles?.name || 'Anonymous',
      user_profiles: undefined,
    } as AccommodationListing;
  },

  /**
   * Get listings by hospital
   */
  async getListingsByHospital(hospitalId: string): Promise<AccommodationListing[]> {
    const { data, error } = await supabase
      .from('accommodation_listings')
      .select('*, user_profiles(name)')
      .eq('is_active', true)
      .eq('hospital_id', hospitalId)
      .order('created_at', { ascending: false });

    if (error) {
      const { data: fb, error: fbErr } = await supabase
        .from('accommodation_listings')
        .select('*')
        .eq('is_active', true)
        .eq('hospital_id', hospitalId)
        .order('created_at', { ascending: false });
      if (fbErr) throw fbErr;
      return (fb || []).map((d: any) => ({ ...d, poster_name: 'Anonymous' })) as AccommodationListing[];
    }
    return (data || []).map((d: any) => ({
      ...d,
      poster_name: d.user_profiles?.name || 'Anonymous',
      user_profiles: undefined,
    })) as AccommodationListing[];
  },

  /**
   * Get listings by county
   */
  async getListingsByCounty(county: string): Promise<AccommodationListing[]> {
    const { data, error } = await supabase
      .from('accommodation_listings')
      .select('*, user_profiles(name)')
      .eq('is_active', true)
      .eq('county', county)
      .order('created_at', { ascending: false });

    if (error) {
      const { data: fb, error: fbErr } = await supabase
        .from('accommodation_listings')
        .select('*')
        .eq('is_active', true)
        .eq('county', county)
        .order('created_at', { ascending: false });
      if (fbErr) throw fbErr;
      return (fb || []).map((d: any) => ({ ...d, poster_name: 'Anonymous' })) as AccommodationListing[];
    }
    return (data || []).map((d: any) => ({
      ...d,
      poster_name: d.user_profiles?.name || 'Anonymous',
      user_profiles: undefined,
    })) as AccommodationListing[];
  },

  /**
   * Get current user's listings
   */
  async getUserListings(): Promise<AccommodationListing[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('accommodation_listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AccommodationListing[];
  },

  /**
   * Create a new listing
   */
  async createListing(listing: Omit<AccommodationListing, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'poster_name'>): Promise<AccommodationListing> {
    const { data, error } = await supabase
      .from('accommodation_listings')
      .insert(listing)
      .select()
      .single();

    if (error) throw error;
    return data as AccommodationListing;
  },

  /**
   * Update a listing
   */
  async updateListing(id: string, updates: Partial<AccommodationListing>): Promise<AccommodationListing> {
    const { data, error } = await supabase
      .from('accommodation_listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AccommodationListing;
  },

  /**
   * Soft delete a listing
   */
  async deleteListing(id: string): Promise<void> {
    const { error } = await supabase
      .from('accommodation_listings')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Upload a photo to accommodation-photos bucket
   */
  async uploadPhoto(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `listings/${fileName}`;

    const { error } = await supabase.storage
      .from('accommodation-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('accommodation-photos')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  },

  /**
   * Delete a photo from storage
   */
  async deletePhoto(url: string): Promise<void> {
    const path = url.split('/accommodation-photos/')[1];
    if (!path) return;

    const { error } = await supabase.storage
      .from('accommodation-photos')
      .remove([path]);

    if (error) throw error;
  },

  /**
   * Send an inquiry about a listing
   */
  async sendInquiry(listingId: string, message: string): Promise<AccommodationInquiry> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('accommodation_inquiries')
      .insert({
        listing_id: listingId,
        sender_id: user.id,
        message,
      })
      .select()
      .single();

    if (error) throw error;
    return data as AccommodationInquiry;
  },

  /**
   * Get inquiries for a listing (listing owner)
   */
  async getInquiriesForListing(listingId: string): Promise<AccommodationInquiry[]> {
    const { data, error } = await supabase
      .from('accommodation_inquiries')
      .select('*, user_profiles(name, email)')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) {
      const { data: fb, error: fbErr } = await supabase
        .from('accommodation_inquiries')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });
      if (fbErr) throw fbErr;
      return (fb || []).map((d: any) => ({ ...d, sender_name: 'Anonymous' })) as AccommodationInquiry[];
    }
    return (data || []).map((d: any) => ({
      ...d,
      sender_name: d.user_profiles?.name || 'Anonymous',
      sender_email: d.user_profiles?.email,
      user_profiles: undefined,
    })) as AccommodationInquiry[];
  },
};
