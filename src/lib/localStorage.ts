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

// User API
export const localUserAPI = {
  getCurrentUser() {
    if (typeof window === 'undefined') return null;

    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  setCurrentUser(user: { email: string; name: string } | null) {
    if (typeof window === 'undefined') return;

    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  async login(email: string): Promise<{ email: string; name: string }> {
    const user = {
      email,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    };

    this.setCurrentUser(user);
    return user;
  },

  logout() {
    this.setCurrentUser(null);
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

// Combined API that tries Supabase first, falls back to local
export const storageAPI = {
  jobs: localJobsAPI,
  applications: localApplicationsAPI,
  user: localUserAPI,
  preferences: localPreferencesAPI,
};
