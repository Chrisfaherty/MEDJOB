/**
 * Local Storage System - Works without Supabase
 * Provides persistent storage using browser localStorage
 */

import type { Job, UserApplication, ApplicationStatus } from '@/types/database.types';
import { sampleJobs } from '@/data/sampleJobs';

const STORAGE_KEYS = {
  JOBS: 'medjob_jobs',
  APPLICATIONS: 'medjob_applications',
  USER: 'medjob_user',
  PREFERENCES: 'medjob_preferences',
  FAVORITES: 'medjob_favorites',
  USERS: 'medjob_users',
};

// Initialize with sample data if empty
export function initializeLocalStorage() {
  if (typeof window === 'undefined') return;

  const existingJobs = localStorage.getItem(STORAGE_KEYS.JOBS);
  if (!existingJobs) {
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(sampleJobs));
  }

  const existingApplications = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
  if (!existingApplications) {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
  }
}

// Jobs API
export const localJobsAPI = {
  async getActiveJobs(): Promise<Job[]> {
    if (typeof window === 'undefined') return sampleJobs;

    const jobs = localStorage.getItem(STORAGE_KEYS.JOBS);
    return jobs ? JSON.parse(jobs) : sampleJobs;
  },

  async getJobById(id: string): Promise<Job | null> {
    const jobs = await this.getActiveJobs();
    return jobs.find(job => job.id === id) || null;
  },

  async searchJobs(query: string): Promise<Job[]> {
    const jobs = await this.getActiveJobs();
    const lowerQuery = query.toLowerCase();

    return jobs.filter(job =>
      job.title.toLowerCase().includes(lowerQuery) ||
      job.hospital_name.toLowerCase().includes(lowerQuery) ||
      job.county.toLowerCase().includes(lowerQuery) ||
      job.clinical_lead?.toLowerCase().includes(lowerQuery)
    );
  },

  async filterJobs(filters: {
    specialties?: string[];
    hospital_groups?: string[];
    counties?: string[];
    scheme_types?: string[];
  }): Promise<Job[]> {
    const jobs = await this.getActiveJobs();

    return jobs.filter(job => {
      if (filters.specialties?.length && !filters.specialties.includes(job.specialty)) {
        return false;
      }
      if (filters.hospital_groups?.length && !filters.hospital_groups.includes(job.hospital_group)) {
        return false;
      }
      if (filters.counties?.length && !filters.counties.includes(job.county)) {
        return false;
      }
      if (filters.scheme_types?.length && !filters.scheme_types.includes(job.scheme_type)) {
        return false;
      }
      return true;
    });
  },
};

// Applications API
export const localApplicationsAPI = {
  async getUserApplications(): Promise<UserApplication[]> {
    if (typeof window === 'undefined') return [];

    const applications = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    return applications ? JSON.parse(applications) : [];
  },

  async getApplicationForJob(jobId: string): Promise<UserApplication | null> {
    const applications = await this.getUserApplications();
    return applications.find(app => app.job_id === jobId) || null;
  },

  async updateStatus(
    jobId: string,
    status: ApplicationStatus,
    notes?: string
  ): Promise<UserApplication> {
    const applications = await this.getUserApplications();
    const existingIndex = applications.findIndex(app => app.job_id === jobId);

    const application: UserApplication = {
      id: existingIndex >= 0 ? applications[existingIndex].id : `app_${Date.now()}`,
      job_id: jobId,
      user_id: 'local_user',
      status,
      notes,
      applied_at: status === 'APPLIED' ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      applications[existingIndex] = application;
    } else {
      applications.push(application);
    }

    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
    return application;
  },

  async getApplicationStats(): Promise<{
    total: number;
    applied: number;
    interview: number;
    shortlisted: number;
  }> {
    const applications = await this.getUserApplications();

    return {
      total: applications.length,
      applied: applications.filter(a => a.status === 'APPLIED').length,
      interview: applications.filter(a => a.status === 'INTERVIEW_OFFERED').length,
      shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
    };
  },
};

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

// Admin credentials (in production, this should be in environment variables)
const ADMIN_EMAILS = ['admin@medjob.ie', 'christopher.faherty@gmail.com'];

// User API
export const localUserAPI = {
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;

    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  setCurrentUser(user: User | null) {
    if (typeof window === 'undefined') return;

    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  async login(email: string): Promise<User> {
    // Check if user already exists
    const users = this.getAllUsers();
    let existingUser = users.find(u => u.email === email);

    if (existingUser) {
      this.setCurrentUser(existingUser);
      return existingUser;
    }

    // Create new user
    const user: User = {
      id: `user_${Date.now()}`,
      email,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      role: ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
    };

    // Save user to users list
    users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Set as current user
    this.setCurrentUser(user);
    return user;
  },

  logout() {
    this.setCurrentUser(null);
  },

  getAllUsers(): User[] {
    if (typeof window === 'undefined') return [];

    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
  },

  deleteUser(userId: string): boolean {
    const users = this.getAllUsers();
    const filteredUsers = users.filter(u => u.id !== userId);

    if (filteredUsers.length < users.length) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredUsers));
      return true;
    }

    return false;
  },

  updateUserRole(userId: string, role: 'admin' | 'user'): boolean {
    const users = this.getAllUsers();
    const user = users.find(u => u.id === userId);

    if (user) {
      user.role = role;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      // Update current user if it's the same user
      const currentUser = this.getCurrentUser();
      if (currentUser?.id === userId) {
        this.setCurrentUser(user);
      }

      return true;
    }

    return false;
  },
};

// Preferences API
export const localPreferencesAPI = {
  async getPreferences() {
    if (typeof window === 'undefined') return null;

    const prefs = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return prefs ? JSON.parse(prefs) : null;
  },

  async updatePreferences(preferences: any) {
    if (typeof window === 'undefined') return;

    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
  },
};

// Favorites API
export const localFavoritesAPI = {
  getFavorites(): string[] {
    if (typeof window === 'undefined') return [];

    const favorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return favorites ? JSON.parse(favorites) : [];
  },

  addFavorite(jobId: string): void {
    const favorites = this.getFavorites();

    if (!favorites.includes(jobId)) {
      favorites.push(jobId);
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    }
  },

  removeFavorite(jobId: string): void {
    const favorites = this.getFavorites();
    const filtered = favorites.filter(id => id !== jobId);

    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered));
  },

  toggleFavorite(jobId: string): boolean {
    const favorites = this.getFavorites();
    const isFavorite = favorites.includes(jobId);

    if (isFavorite) {
      this.removeFavorite(jobId);
      return false;
    } else {
      this.addFavorite(jobId);
      return true;
    }
  },

  isFavorite(jobId: string): boolean {
    return this.getFavorites().includes(jobId);
  },

  async getFavoriteJobs(): Promise<Job[]> {
    const favorites = this.getFavorites();
    const allJobs = await localJobsAPI.getActiveJobs();

    return allJobs.filter(job => favorites.includes(job.id));
  },
};

// =====================================================
// HYBRID STORAGE API
// Tries Supabase first, falls back to localStorage
// =====================================================

import {
  supabaseJobsAPI,
  supabaseApplicationsAPI,
  supabaseFavoritesAPI,
  supabasePreferencesAPI,
} from './supabase';

/**
 * Check if Supabase is configured
 */
const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

/**
 * Combined API that tries Supabase first, falls back to localStorage
 * Provides seamless migration path and offline capability
 */
export const storageAPI = {
  jobs: {
    async getActiveJobs(): Promise<Job[]> {
      if (isSupabaseConfigured()) {
        try {
          return await supabaseJobsAPI.getActiveJobs();
        } catch (error) {
          console.error('Supabase error, falling back to localStorage:', error);
          return await localJobsAPI.getActiveJobs();
        }
      }
      return await localJobsAPI.getActiveJobs();
    },

    async getJobById(id: string): Promise<Job | null> {
      if (isSupabaseConfigured()) {
        try {
          return await supabaseJobsAPI.getJobById(id);
        } catch (error) {
          console.error('Supabase error, falling back to localStorage:', error);
          return await localJobsAPI.getJobById(id);
        }
      }
      return await localJobsAPI.getJobById(id);
    },

    async searchJobs(query: string): Promise<Job[]> {
      if (isSupabaseConfigured()) {
        try {
          return await supabaseJobsAPI.searchJobs(query);
        } catch (error) {
          console.error('Supabase error, falling back to localStorage:', error);
          return await localJobsAPI.searchJobs(query);
        }
      }
      return await localJobsAPI.searchJobs(query);
    },

    async filterJobs(filters: {
      specialties?: string[];
      hospital_groups?: string[];
      counties?: string[];
      scheme_types?: string[];
    }): Promise<Job[]> {
      if (isSupabaseConfigured()) {
        try {
          return await supabaseJobsAPI.filterJobs(filters);
        } catch (error) {
          console.error('Supabase error, falling back to localStorage:', error);
          return await localJobsAPI.filterJobs(filters);
        }
      }
      return await localJobsAPI.filterJobs(filters);
    },
  },

  applications: {
    async getUserApplications(): Promise<UserApplication[]> {
      if (isSupabaseConfigured()) {
        try {
          return await supabaseApplicationsAPI.getUserApplications();
        } catch (error) {
          console.error('Supabase error, falling back to localStorage:', error);
          return await localApplicationsAPI.getUserApplications();
        }
      }
      return await localApplicationsAPI.getUserApplications();
    },

    async getApplicationForJob(jobId: string): Promise<UserApplication | null> {
      if (isSupabaseConfigured()) {
        try {
          return await supabaseApplicationsAPI.getApplicationForJob(jobId);
        } catch (error) {
          console.error('Supabase error, falling back to localStorage:', error);
          return await localApplicationsAPI.getApplicationForJob(jobId);
        }
      }
      return await localApplicationsAPI.getApplicationForJob(jobId);
    },

    async updateStatus(
      jobId: string,
      status: ApplicationStatus,
      notes?: string
    ): Promise<UserApplication> {
      if (isSupabaseConfigured()) {
        try {
          return await supabaseApplicationsAPI.updateStatus(jobId, status, notes);
        } catch (error) {
          console.error('Supabase error, falling back to localStorage:', error);
          return await localApplicationsAPI.updateStatus(jobId, status, notes);
        }
      }
      return await localApplicationsAPI.updateStatus(jobId, status, notes);
    },

    async getApplicationStats() {
      if (isSupabaseConfigured()) {
        try {
          return await supabaseApplicationsAPI.getApplicationStats();
        } catch (error) {
          console.error('Supabase error, falling back to localStorage:', error);
          return await localApplicationsAPI.getApplicationStats();
        }
      }
      return await localApplicationsAPI.getApplicationStats();
    },
  },

  favorites: {
    // Synchronous method for immediate UI updates
    getFavorites(): string[] {
      return localFavoritesAPI.getFavorites();
    },

    // Async method for Supabase
    async getFavoritesAsync(): Promise<string[]> {
      if (isSupabaseConfigured()) {
        try {
          return await supabaseFavoritesAPI.getFavorites();
        } catch (error) {
          console.error('Supabase error, falling back to localStorage:', error);
          return localFavoritesAPI.getFavorites();
        }
      }
      return localFavoritesAPI.getFavorites();
    },

    async addFavorite(jobId: string): Promise<void> {
      if (isSupabaseConfigured()) {
        try {
          await supabaseFavoritesAPI.addFavorite(jobId);
          // Also update localStorage for immediate UI feedback
          localFavoritesAPI.addFavorite(jobId);
        } catch (error) {
          console.error('Supabase error, using localStorage:', error);
          localFavoritesAPI.addFavorite(jobId);
        }
      } else {
        localFavoritesAPI.addFavorite(jobId);
      }
    },

    async removeFavorite(jobId: string): Promise<void> {
      if (isSupabaseConfigured()) {
        try {
          await supabaseFavoritesAPI.removeFavorite(jobId);
          // Also update localStorage for immediate UI feedback
          localFavoritesAPI.removeFavorite(jobId);
        } catch (error) {
          console.error('Supabase error, using localStorage:', error);
          localFavoritesAPI.removeFavorite(jobId);
        }
      } else {
        localFavoritesAPI.removeFavorite(jobId);
      }
    },

    async toggleFavorite(jobId: string): Promise<boolean> {
      if (isSupabaseConfigured()) {
        try {
          const result = await supabaseFavoritesAPI.toggleFavorite(jobId);
          // Sync with localStorage
          if (result) {
            localFavoritesAPI.addFavorite(jobId);
          } else {
            localFavoritesAPI.removeFavorite(jobId);
          }
          return result;
        } catch (error) {
          console.error('Supabase error, using localStorage:', error);
          return localFavoritesAPI.toggleFavorite(jobId);
        }
      } else {
        return localFavoritesAPI.toggleFavorite(jobId);
      }
    },

    isFavorite(jobId: string): boolean {
      return localFavoritesAPI.isFavorite(jobId);
    },

    async getFavoriteJobs(): Promise<Job[]> {
      if (isSupabaseConfigured()) {
        try {
          return await supabaseFavoritesAPI.getFavoriteJobs();
        } catch (error) {
          console.error('Supabase error, falling back to localStorage:', error);
          return await localFavoritesAPI.getFavoriteJobs();
        }
      }
      return await localFavoritesAPI.getFavoriteJobs();
    },
  },

  preferences: {
    async getPreferences() {
      if (isSupabaseConfigured()) {
        try {
          return await supabasePreferencesAPI.getPreferences();
        } catch (error) {
          console.error('Supabase error, falling back to localStorage:', error);
          return await localPreferencesAPI.getPreferences();
        }
      }
      return await localPreferencesAPI.getPreferences();
    },

    async updatePreferences(preferences: any) {
      if (isSupabaseConfigured()) {
        try {
          await supabasePreferencesAPI.updatePreferences(preferences);
          // Also update localStorage for offline access
          await localPreferencesAPI.updatePreferences(preferences);
        } catch (error) {
          console.error('Supabase error, using localStorage:', error);
          await localPreferencesAPI.updatePreferences(preferences);
        }
      } else {
        await localPreferencesAPI.updatePreferences(preferences);
      }
    },
  },

  // Keep existing user API that uses localStorage
  // (Will be handled by AuthContext for Supabase)
  user: localUserAPI,
};
