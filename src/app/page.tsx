'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  Stethoscope,
  Briefcase,
  Home,
  LogOut,
  ChevronLeft,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import JobCard from '@/components/JobCard';
import DetailView from '@/components/DetailView';
import LoginModal from '@/components/LoginModal';
import LandingPage from '@/components/LandingPage';
import AccommodationSection from '@/components/accommodation/AccommodationSection';
import type { Job, SpecialtyType, HospitalGroup, SchemeType } from '@/types/database.types';
import {
  SPECIALTY_LABELS,
  HOSPITAL_GROUP_LABELS,
  SCHEME_TYPE_LABELS,
} from '@/types/database.types';
import { storageAPI, initializeLocalStorage } from '@/lib/localStorage';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeSection, setActiveSection] = useState<'jobs' | 'accommodation'>('jobs');

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
    hospitals: string[];
    counties: string[];
    schemeTypes: SchemeType[];
  }>({
    specialties: [],
    hospitalGroups: [],
    hospitals: [],
    counties: [],
    schemeTypes: [],
  });

  useEffect(() => {
    if (user) {
      initializeLocalStorage();
      loadData();
    }
  }, [user]);

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
    await signOut();
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
    setFilters({ specialties: [], hospitalGroups: [], hospitals: [], counties: [], schemeTypes: [] });
  };

  const uniqueSpecialties = Array.from(new Set(jobs.map(j => j.specialty)));
  const uniqueHospitalGroups = Array.from(new Set(jobs.map(j => j.hospital_group)));
  const uniqueHospitals = Array.from(new Set(jobs.map(j => j.hospital_name))).sort();
  const uniqueCounties = Array.from(new Set(jobs.map(j => j.county))).sort();
  const uniqueSchemeTypes = Array.from(new Set(jobs.map(j => j.scheme_type)));

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
    if (filters.hospitals.length && !filters.hospitals.includes(job.hospital_name)) return false;
    if (filters.counties.length && !filters.counties.includes(job.county)) return false;
    if (filters.schemeTypes.length && !filters.schemeTypes.includes(job.scheme_type)) return false;
    return true;
  });

  const activeFilterCount =
    filters.specialties.length + filters.hospitalGroups.length +
    filters.hospitals.length + filters.counties.length + filters.schemeTypes.length;

  // User initials for avatar
  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (authLoading) {
    return (
      <div className="min-h-screen bg-apple-gray flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-teal mx-auto mb-4"></div>
          <p className="text-sm text-apple-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingPage
          onGetStarted={() => setShowLoginModal(true)}
          onSignIn={() => setShowLoginModal(true)}
        />
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-apple-gray overflow-hidden">
      {/* Header — Frosted Glass */}
      <header className="sticky top-0 z-50 glass border-b border-slate-200/50">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          {/* Left: Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal rounded-xl flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-apple-black leading-none tracking-tight">MedMatch-IE</h1>
              <p className="text-[10px] text-apple-secondary leading-none mt-0.5">NCHD Jobs Ireland</p>
            </div>
          </div>

          {/* Center: Section Tabs + Centile */}
          <div className="flex items-center gap-3">
            {/* Section Switcher */}
            <div className="flex bg-slate-100/80 rounded-xl p-0.5">
              <button
                onClick={() => setActiveSection('jobs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all duration-200 ${
                  activeSection === 'jobs'
                    ? 'bg-white text-apple-black shadow-sm'
                    : 'text-apple-secondary hover:text-apple-black'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Jobs</span>
              </button>
              <button
                onClick={() => setActiveSection('accommodation')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all duration-200 ${
                  activeSection === 'accommodation'
                    ? 'bg-white text-apple-black shadow-sm'
                    : 'text-apple-secondary hover:text-apple-black'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Accommodation</span>
              </button>
            </div>

            {/* Centile Input — only show for jobs */}
            {activeSection === 'jobs' && (
          <div className="hidden sm:flex items-center gap-2 bg-white/60 border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-card">
            <TrendingUp className="w-3.5 h-3.5 text-teal" />
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Your centile"
              value={userCentile || ''}
              onChange={(e) => setUserCentile(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-24 text-[13px] bg-transparent border-none outline-none placeholder:text-slate-400 text-apple-black"
            />
            {userCentile && (
              <span className="text-[11px] font-semibold text-teal">{userCentile}th</span>
            )}
          </div>
            )}
          </div>

          {/* Right: Avatar + Logout */}
          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-teal/10 flex items-center justify-center">
                <span className="text-[10px] font-bold text-teal">{userInitials}</span>
              </div>
              <span className="text-[13px] text-slate-600 font-medium">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content — conditional on activeSection */}
      {activeSection === 'jobs' ? (
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className={`w-full lg:w-[380px] lg:min-w-[380px] flex flex-col border-r border-slate-200/60 bg-white/50 ${
          selectedJob ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Search & Filter Bar */}
          <div className="p-3 space-y-2 border-b border-slate-100/80">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search jobs, hospitals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-apple-gray/60 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 placeholder:text-slate-400 transition-all"
              />
            </div>

            {/* Mobile centile input */}
            <div className="sm:hidden relative">
              <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal" />
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Your centile"
                value={userCentile || ''}
                onChange={(e) => setUserCentile(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-apple-gray/60 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 placeholder:text-slate-400 transition-all"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-apple-secondary font-medium">
                {filteredJobs.length} position{filteredJobs.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-teal/10 text-teal'
                    : 'text-apple-secondary hover:bg-slate-100/80'
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-teal text-white text-[9px] font-bold rounded-full leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 border-t border-slate-100/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-apple-black">Active Filters</p>
                      {activeFilterCount > 0 && (
                        <button onClick={clearFilters} className="text-[10px] text-teal hover:underline font-medium">
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Specialty */}
                    <FilterSection label="Specialty">
                      {uniqueSpecialties.map(s => (
                        <FilterChip
                          key={s}
                          label={SPECIALTY_LABELS[s]}
                          active={filters.specialties.includes(s)}
                          onClick={() => toggleFilter('specialties', s)}
                        />
                      ))}
                    </FilterSection>

                    {/* Hospital Group */}
                    <FilterSection label="Hospital Group">
                      {uniqueHospitalGroups.map(g => (
                        <FilterChip
                          key={g}
                          label={HOSPITAL_GROUP_LABELS[g]}
                          active={filters.hospitalGroups.includes(g)}
                          onClick={() => toggleFilter('hospitalGroups', g)}
                        />
                      ))}
                    </FilterSection>

                    {/* Hospital */}
                    <FilterSection label="Hospital">
                      {uniqueHospitals.map(h => (
                        <FilterChip
                          key={h}
                          label={h}
                          active={filters.hospitals.includes(h)}
                          onClick={() => toggleFilter('hospitals', h)}
                        />
                      ))}
                    </FilterSection>

                    {/* County */}
                    <FilterSection label="County">
                      {uniqueCounties.map(c => (
                        <FilterChip
                          key={c}
                          label={c}
                          active={filters.counties.includes(c)}
                          onClick={() => toggleFilter('counties', c)}
                        />
                      ))}
                    </FilterSection>

                    {/* Scheme */}
                    <FilterSection label="Scheme">
                      {uniqueSchemeTypes.map(s => (
                        <FilterChip
                          key={s}
                          label={SCHEME_TYPE_LABELS[s]}
                          active={filters.schemeTypes.includes(s)}
                          onClick={() => toggleFilter('schemeTypes', s)}
                        />
                      ))}
                    </FilterSection>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Job List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-teal"></div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <Briefcase className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">No jobs match your criteria</p>
                <p className="text-[11px] text-apple-secondary mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100/80">
                {filteredJobs.map((job, index) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    userCentile={userCentile}
                    isSelected={selectedJob?.id === job.id}
                    onCardClick={setSelectedJob}
                    index={index}
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
                className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 text-[13px] text-teal font-semibold border-b border-slate-100"
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
                <div className="w-16 h-16 rounded-2xl bg-apple-gray flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-apple-black text-lg font-semibold">Select a position</p>
                <p className="text-[13px] text-apple-secondary mt-1">Click any job card to view details</p>
              </div>
            </div>
          )}
        </main>
      </div>
      ) : (
        <AccommodationSection />
      )}
    </div>
  );
}

// --- Sub-components ---

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-apple-secondary uppercase tracking-wider mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1">
        {children}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-all duration-150 ${
        active
          ? 'bg-teal text-white shadow-sm'
          : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
      }`}
    >
      {label}
    </button>
  );
}
