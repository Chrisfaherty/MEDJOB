'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  TrendingUp,
  Briefcase,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import JobCard from '@/components/JobCard';
import DetailView from '@/components/DetailView';
import LoginModal from '@/components/LoginModal';
import type { Job, SpecialtyType, HospitalGroup, SchemeType } from '@/types/database.types';
import {
  SPECIALTY_LABELS,
  HOSPITAL_GROUP_LABELS,
  SCHEME_TYPE_LABELS,
} from '@/types/database.types';
import { storageAPI, initializeLocalStorage } from '@/lib/localStorage';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Data state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [userCentile, setUserCentile] = useState<number | undefined>();

  // Filter state
  const [filters, setFilters] = useState<{
    specialties: SpecialtyType[];
    hospitalGroups: HospitalGroup[];
    counties: string[];
    schemeTypes: SchemeType[];
  }>({
    specialties: [],
    hospitalGroups: [],
    counties: [],
    schemeTypes: [],
  });

  useEffect(() => {
    initializeLocalStorage();
    loadData();
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      setShowLoginModal(true);
    }
  }, [authLoading, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const jobsData = await storageAPI.jobs.getActiveJobs();
      const favoritesData = storageAPI.favorites.getFavorites();
      setJobs(jobsData);
      setFavorites(new Set(favoritesData));
      if (jobsData.length > 0) {
        setSelectedJob(jobsData[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { authService } = await import('@/lib/auth');
    await authService.signOut();
    setShowLoginModal(true);
  };

  const handleFavoriteToggle = async (jobId: string) => {
    const isFavorite = await storageAPI.favorites.toggleFavorite(jobId);
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (isFavorite) {
        newFavorites.add(jobId);
      } else {
        newFavorites.delete(jobId);
      }
      return newFavorites;
    });
  };

  const toggleFilter = (filterKey: keyof typeof filters, value: string) => {
    setFilters(prev => {
      const currentValues = prev[filterKey] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v: string) => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterKey]: newValues as any };
    });
  };

  const clearFilters = () => {
    setFilters({ specialties: [], hospitalGroups: [], counties: [], schemeTypes: [] });
  };

  const uniqueSpecialties = Array.from(new Set(jobs.map(j => j.specialty)));
  const uniqueHospitalGroups = Array.from(new Set(jobs.map(j => j.hospital_group)));
  const uniqueCounties = Array.from(new Set(jobs.map(j => j.county))).sort();
  const uniqueSchemeTypes = Array.from(new Set(jobs.map(j => j.scheme_type)));

  // Apply filters and search
  const filteredJobs = jobs.filter(job => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches =
        job.title.toLowerCase().includes(q) ||
        job.hospital_name.toLowerCase().includes(q) ||
        job.county.toLowerCase().includes(q) ||
        job.clinical_lead?.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (filters.specialties.length && !filters.specialties.includes(job.specialty)) return false;
    if (filters.hospitalGroups.length && !filters.hospitalGroups.includes(job.hospital_group)) return false;
    if (filters.counties.length && !filters.counties.includes(job.county)) return false;
    if (filters.schemeTypes.length && !filters.schemeTypes.includes(job.scheme_type)) return false;
    return true;
  });

  const activeFilterCount =
    filters.specialties.length + filters.hospitalGroups.length +
    filters.counties.length + filters.schemeTypes.length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal mx-auto mb-4"></div>
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Glassmorphism Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          {/* Left: Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">MedMatch-IE</h1>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">NCHD Jobs Ireland</p>
            </div>
          </div>

          {/* Center: Centile Input */}
          <div className="hidden sm:flex items-center gap-2 bg-white/80 border border-slate-200 rounded-lg px-3 py-1.5">
            <TrendingUp className="w-4 h-4 text-teal" />
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Enter your Centile"
              value={userCentile || ''}
              onChange={(e) => setUserCentile(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-28 text-sm bg-transparent border-none outline-none placeholder:text-slate-400"
            />
            {userCentile && (
              <span className="text-xs font-medium text-teal">{userCentile}th</span>
            )}
          </div>

          {/* Right: User & Logout */}
          <div className="flex items-center gap-3">
            <span className="hidden md:block text-sm text-slate-600">{user.name}</span>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main: Master-Detail Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Job List (400px) */}
        <aside className={`w-full lg:w-[400px] lg:min-w-[400px] flex flex-col border-r border-slate-200 bg-white ${
          selectedJob ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Search & Filter Bar */}
          <div className="p-3 space-y-2 border-b border-slate-100">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search jobs, hospitals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>

            {/* Mobile centile input */}
            <div className="sm:hidden relative">
              <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal" />
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Enter your Centile"
                value={userCentile || ''}
                onChange={(e) => setUserCentile(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-teal/10 text-teal'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-teal text-white text-[10px] rounded-full leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-600">Active Filters</p>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-[10px] text-teal hover:underline">
                      Clear all
                    </button>
                  )}
                </div>

                {/* Specialty */}
                <div>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Specialty</p>
                  <div className="flex flex-wrap gap-1">
                    {uniqueSpecialties.map(s => (
                      <button
                        key={s}
                        onClick={() => toggleFilter('specialties', s)}
                        className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                          filters.specialties.includes(s)
                            ? 'bg-teal text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {SPECIALTY_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hospital Group */}
                <div>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Hospital Group</p>
                  <div className="flex flex-wrap gap-1">
                    {uniqueHospitalGroups.map(g => (
                      <button
                        key={g}
                        onClick={() => toggleFilter('hospitalGroups', g)}
                        className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                          filters.hospitalGroups.includes(g)
                            ? 'bg-teal text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {HOSPITAL_GROUP_LABELS[g]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* County */}
                <div>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">County</p>
                  <div className="flex flex-wrap gap-1">
                    {uniqueCounties.map(c => (
                      <button
                        key={c}
                        onClick={() => toggleFilter('counties', c)}
                        className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                          filters.counties.includes(c)
                            ? 'bg-teal text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scheme Type */}
                <div>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Scheme</p>
                  <div className="flex flex-wrap gap-1">
                    {uniqueSchemeTypes.map(s => (
                      <button
                        key={s}
                        onClick={() => toggleFilter('schemeTypes', s)}
                        className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                          filters.schemeTypes.includes(s)
                            ? 'bg-teal text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {SCHEME_TYPE_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Job List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No jobs match your criteria</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredJobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    userCentile={userCentile}
                    isSelected={selectedJob?.id === job.id}
                    onCardClick={setSelectedJob}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right Pane: Detail View */}
        <main className={`flex-1 flex flex-col bg-white ${
          selectedJob ? 'flex' : 'hidden lg:flex'
        }`}>
          {selectedJob ? (
            <>
              {/* Mobile Back Button */}
              <button
                onClick={() => setSelectedJob(null)}
                className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 text-sm text-teal font-medium border-b border-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Jobs
              </button>

              <DetailView
                job={selectedJob}
                userCentile={userCentile}
                userName={user?.name}
                userEmail={user?.email}
                isFavorite={favorites.has(selectedJob.id)}
                onFavoriteToggle={handleFavoriteToggle}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Briefcase className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 text-lg font-medium">Select a job to view details</p>
                <p className="text-sm text-slate-400 mt-1">Click any job card on the left</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
