'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Bell, Calendar, TrendingUp, Briefcase } from 'lucide-react';
import JobCard from '@/components/JobCard';
import type { Job, ApplicationStatus } from '@/types/database.types';
import { jobsAPI, applicationsAPI } from '@/lib/supabase';

// Mock user ID (replace with actual auth later)
const MOCK_USER_ID = 'demo-user-123';

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    specialties: [] as string[],
    hospitalGroups: [] as string[],
    counties: [] as string[],
    schemeTypes: [] as string[],
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await jobsAPI.getActiveJobs();
      setJobs(data || []);
      if (data && data.length > 0) {
        setSelectedJob(data[0]);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (jobId: string, status: ApplicationStatus) => {
    try {
      await applicationsAPI.updateStatus(jobId, MOCK_USER_ID, status);
      // Reload jobs to reflect changes
      await loadJobs();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        job.title.toLowerCase().includes(query) ||
        job.hospital_name.toLowerCase().includes(query) ||
        job.county.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (filters.specialties.length && !filters.specialties.includes(job.specialty)) {
      return false;
    }

    if (filters.hospitalGroups.length && !filters.hospitalGroups.includes(job.hospital_group)) {
      return false;
    }

    if (filters.counties.length && !filters.counties.includes(job.county)) {
      return false;
    }

    if (filters.schemeTypes.length && !filters.schemeTypes.includes(job.scheme_type)) {
      return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-linkedin-blue to-linkedin-blue-light rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">MedMatch-IE</h1>
                <p className="text-xs text-slate-500">July 2026 SHO/REG Rotation</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="px-4 py-2 bg-linkedin-blue text-white text-sm font-medium rounded-lg hover:bg-linkedin-blue-dark transition-colors flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                My Applications
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Pane - Job List */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            {/* Search & Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search jobs, hospitals, specialties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:border-transparent"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
                {(filters.specialties.length +
                  filters.hospitalGroups.length +
                  filters.counties.length +
                  filters.schemeTypes.length) > 0 && (
                  <span className="px-2 py-0.5 bg-linkedin-blue text-white text-xs rounded-full">
                    {filters.specialties.length +
                      filters.hospitalGroups.length +
                      filters.counties.length +
                      filters.schemeTypes.length}
                  </span>
                )}
              </button>

              {/* Filter Panel (expandable) */}
              {showFilters && (
                <div className="pt-3 border-t border-slate-200 space-y-3 animate-slide-up">
                  <p className="text-sm font-medium text-slate-700">Filter by:</p>
                  {/* Add filter checkboxes here */}
                  <div className="text-sm text-slate-500">
                    Filter options coming soon...
                  </div>
                </div>
              )}
            </div>

            {/* Stats Banner */}
            <div className="bg-gradient-to-r from-linkedin-blue to-linkedin-blue-light rounded-lg p-4 text-white shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Active Opportunities</p>
                  <p className="text-3xl font-bold">{filteredJobs.length}</p>
                </div>
                <TrendingUp className="w-10 h-10 opacity-80" />
              </div>
              <p className="text-xs mt-2 opacity-75">
                For July 13, 2026 rotation
              </p>
            </div>

            {/* Job Cards List */}
            <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto pb-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-linkedin-blue"></div>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                  <p className="text-slate-600">No jobs match your criteria</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Try adjusting your filters or search query
                  </p>
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onStatusChange={handleStatusChange}
                    onCardClick={setSelectedJob}
                    isSelected={selectedJob?.id === job.id}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Pane - Detailed View */}
          <div className="lg:col-span-7 xl:col-span-8">
            {selectedJob ? (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Job Details
                </h2>
                <div className="prose max-w-none">
                  <p className="text-slate-600">
                    Detailed view for <strong>{selectedJob.title}</strong> at{' '}
                    <strong>{selectedJob.hospital_name}</strong>
                  </p>
                  <p className="text-sm text-slate-500 mt-4">
                    Full job specification viewer coming soon...
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">Select a job to view details</p>
                <p className="text-sm text-slate-500 mt-2">
                  Click on any job card to see full information
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
