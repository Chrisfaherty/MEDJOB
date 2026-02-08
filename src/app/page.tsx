'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Bell,
  Calendar,
  TrendingUp,
  Briefcase,
  LogOut,
  X,
  CheckCircle2,
  Mail,
  ExternalLink,
  FileText,
  MapPin,
  Building2,
  Clock,
  User,
} from 'lucide-react';
import JobCard from '@/components/JobCard';
import LoginModal from '@/components/LoginModal';
import type { Job, ApplicationStatus, SpecialtyType, HospitalGroup, SchemeType } from '@/types/database.types';
import {
  SPECIALTY_LABELS,
  HOSPITAL_GROUP_LABELS,
  SCHEME_TYPE_LABELS,
} from '@/types/database.types';
import {
  storageAPI,
  initializeLocalStorage,
  localApplicationsAPI,
} from '@/lib/localStorage';
import { checkDeadlines } from '@/lib/deadlineNotifications';
import { format, differenceInHours } from 'date-fns';

export default function Dashboard() {
  // Auth state
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Data state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Map<string, ApplicationStatus>>(new Map());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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

  // Initialize
  useEffect(() => {
    initializeLocalStorage();
    checkAuth();
    loadData();
  }, []);

  const checkAuth = () => {
    const currentUser = storageAPI.user.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      setShowLoginModal(true);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const jobsData = await storageAPI.jobs.getActiveJobs();
      const appsData = await storageAPI.applications.getUserApplications();

      setJobs(jobsData);

      const appsMap = new Map();
      appsData.forEach(app => appsMap.set(app.job_id, app.status));
      setApplications(appsMap);

      if (jobsData.length > 0) {
        setSelectedJob(jobsData[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string) => {
    const newUser = await storageAPI.user.login(email);
    setUser(newUser);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    storageAPI.user.logout();
    setUser(null);
    setShowLoginModal(true);
  };

  const handleStatusChange = async (jobId: string, status: ApplicationStatus) => {
    await storageAPI.applications.updateStatus(jobId, status);
    setApplications(prev => new Map(prev).set(jobId, status));
  };

  const toggleFilter = (
    filterKey: keyof typeof filters,
    value: string
  ) => {
    setFilters(prev => {
      const currentValues = prev[filterKey] as string[];
      const isIncluded = currentValues.includes(value);
      const newValues = isIncluded
        ? currentValues.filter((v: string) => v !== value)
        : [...currentValues, value];

      return {
        ...prev,
        [filterKey]: newValues as any,
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      specialties: [],
      hospitalGroups: [],
      counties: [],
      schemeTypes: [],
    });
  };

  // Get unique values for filters
  const uniqueSpecialties = Array.from(new Set(jobs.map(j => j.specialty)));
  const uniqueHospitalGroups = Array.from(new Set(jobs.map(j => j.hospital_group)));
  const uniqueCounties = Array.from(new Set(jobs.map(j => j.county))).sort();
  const uniqueSchemeTypes = Array.from(new Set(jobs.map(j => j.scheme_type)));

  // Apply filters and search
  const filteredJobs = jobs.filter(job => {
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        job.title.toLowerCase().includes(query) ||
        job.hospital_name.toLowerCase().includes(query) ||
        job.county.toLowerCase().includes(query) ||
        job.clinical_lead?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Filters
    if (filters.specialties.length && !filters.specialties.includes(job.specialty)) return false;
    if (filters.hospitalGroups.length && !filters.hospitalGroups.includes(job.hospital_group)) return false;
    if (filters.counties.length && !filters.counties.includes(job.county)) return false;
    if (filters.schemeTypes.length && !filters.schemeTypes.includes(job.scheme_type)) return false;

    return true;
  });

  // Deadline alerts
  const deadlineAlerts = checkDeadlines(filteredJobs);
  const criticalAlerts = deadlineAlerts.filter(a => a.urgency === 'critical');

  // Application stats
  const appStats = {
    total: applications.size,
    applied: Array.from(applications.values()).filter(s => s === 'APPLIED').length,
    interview: Array.from(applications.values()).filter(s => s === 'INTERVIEW_OFFERED').length,
    shortlisted: Array.from(applications.values()).filter(s => s === 'SHORTLISTED').length,
  };

  const activeFilterCount =
    filters.specialties.length +
    filters.hospitalGroups.length +
    filters.counties.length +
    filters.schemeTypes.length;

  if (!user) {
    return (
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    );
  }

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
              {/* User Info */}
              <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                <User className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">{user.name}</span>
              </div>

              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {criticalAlerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {/* My Applications */}
              <button className="px-4 py-2 bg-linkedin-blue text-white text-sm font-medium rounded-lg hover:bg-linkedin-blue-dark transition-colors flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">My Applications</span>
                {appStats.total > 0 && (
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {appStats.total}
                  </span>
                )}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Notification Dropdown */}
        {showNotifications && deadlineAlerts.length > 0 && (
          <div className="absolute top-16 right-4 w-96 bg-white rounded-lg shadow-2xl border border-slate-200 p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Upcoming Deadlines</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {deadlineAlerts.slice(0, 5).map(alert => (
                <div
                  key={alert.job.id}
                  className={`p-3 rounded-lg border ${
                    alert.urgency === 'critical'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900">
                    {alert.job.title}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Pane - Job List */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            {/* Stats Banner */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-r from-linkedin-blue to-linkedin-blue-light rounded-lg p-4 text-white shadow-sm">
                <p className="text-xs opacity-90">Active Jobs</p>
                <p className="text-3xl font-bold">{filteredJobs.length}</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4 text-white shadow-sm">
                <p className="text-xs opacity-90">Applied</p>
                <p className="text-3xl font-bold">{appStats.applied}</p>
              </div>
            </div>

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
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 bg-linkedin-blue text-white text-xs rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Filter Panel */}
              {showFilters && (
                <div className="pt-3 border-t border-slate-200 space-y-4 animate-slide-up">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">Active Filters</p>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-linkedin-blue hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Specialty Filter */}
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-2">Specialty</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {uniqueSpecialties.map(specialty => (
                        <label key={specialty} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filters.specialties.includes(specialty)}
                            onChange={() => toggleFilter('specialties', specialty)}
                            className="rounded border-slate-300 text-linkedin-blue focus:ring-linkedin-blue"
                          />
                          <span className="text-slate-700">{SPECIALTY_LABELS[specialty]}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Hospital Group Filter */}
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-2">Hospital Group</p>
                    <div className="space-y-1">
                      {uniqueHospitalGroups.map(group => (
                        <label key={group} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filters.hospitalGroups.includes(group)}
                            onChange={() => toggleFilter('hospitalGroups', group)}
                            className="rounded border-slate-300 text-linkedin-blue focus:ring-linkedin-blue"
                          />
                          <span className="text-slate-700">{HOSPITAL_GROUP_LABELS[group]}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* County Filter */}
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-2">County</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {uniqueCounties.map(county => (
                        <label key={county} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filters.counties.includes(county)}
                            onChange={() => toggleFilter('counties', county)}
                            className="rounded border-slate-300 text-linkedin-blue focus:ring-linkedin-blue"
                          />
                          <span className="text-slate-700">{county}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Scheme Type Filter */}
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-2">Scheme Type</p>
                    <div className="space-y-1">
                      {uniqueSchemeTypes.map(scheme => (
                        <label key={scheme} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filters.schemeTypes.includes(scheme)}
                            onChange={() => toggleFilter('schemeTypes', scheme)}
                            className="rounded border-slate-300 text-linkedin-blue focus:ring-linkedin-blue"
                          />
                          <span className="text-slate-700">{SCHEME_TYPE_LABELS[scheme]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Job Cards List */}
            <div className="space-y-3 max-h-[calc(100vh-480px)] overflow-y-auto pb-4">
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
                filteredJobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    userStatus={applications.get(job.id)}
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
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-6">
                {/* Header */}
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    {selectedJob.title}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-linkedin-blue text-white">
                      {selectedJob.grade}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedJob.scheme_type.includes('TRAINING')
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {SCHEME_TYPE_LABELS[selectedJob.scheme_type]}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                      {SPECIALTY_LABELS[selectedJob.specialty]}
                    </span>
                  </div>
                </div>

                {/* Deadline Alert */}
                {(() => {
                  const hours = differenceInHours(new Date(selectedJob.application_deadline), new Date());
                  return (
                    <div className={`p-4 rounded-lg border ${
                      hours <= 48
                        ? 'bg-red-50 border-red-200'
                        : hours <= 168
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Clock className={`w-5 h-5 ${
                          hours <= 48 ? 'text-red-600' : hours <= 168 ? 'text-amber-600' : 'text-green-600'
                        }`} />
                        <div>
                          <p className={`font-semibold ${
                            hours <= 48 ? 'text-red-900' : hours <= 168 ? 'text-amber-900' : 'text-green-900'
                          }`}>
                            Application Deadline: {format(new Date(selectedJob.application_deadline), 'MMM d, yyyy @ h:mm a')}
                          </p>
                          <p className={`text-sm ${
                            hours <= 48 ? 'text-red-700' : hours <= 168 ? 'text-amber-700' : 'text-green-700'
                          }`}>
                            {hours <= 48 ? `⚠️ URGENT: Only ${Math.floor(hours)} hours remaining!` :
                             hours <= 168 ? `${Math.ceil(hours / 24)} days remaining` :
                             'Plenty of time to apply'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Hospital & Location */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-semibold text-slate-900">{selectedJob.hospital_name}</p>
                      <p className="text-sm text-slate-600">
                        {HOSPITAL_GROUP_LABELS[selectedJob.hospital_group]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-slate-400" />
                    <p className="text-slate-700">{selectedJob.county}</p>
                  </div>
                </div>

                {/* Job Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Position Details</h3>

                  {selectedJob.rotational_detail && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm font-medium text-blue-900 mb-1">Rotational Structure</p>
                      <p className="text-blue-800">{selectedJob.rotational_detail}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Start Date</p>
                      <p className="font-medium text-slate-900">
                        {format(new Date(selectedJob.start_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    {selectedJob.duration_months && (
                      <div>
                        <p className="text-sm text-slate-600">Duration</p>
                        <p className="font-medium text-slate-900">{selectedJob.duration_months} months</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contacts */}
                {(selectedJob.informal_enquiries_email || selectedJob.clinical_lead) && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-900">Contact Information</h3>

                    {selectedJob.informal_enquiries_email && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm font-medium text-blue-900 mb-2">Informal Enquiries</p>
                        {selectedJob.informal_enquiries_name && (
                          <p className="font-medium text-blue-800 mb-1">
                            {selectedJob.informal_enquiries_name}
                          </p>
                        )}
                        <a
                          href={`mailto:${selectedJob.informal_enquiries_email}`}
                          className="inline-flex items-center gap-2 text-linkedin-blue hover:underline"
                        >
                          <Mail className="w-4 h-4" />
                          {selectedJob.informal_enquiries_email}
                        </a>
                      </div>
                    )}

                    {selectedJob.clinical_lead && (
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm font-medium text-slate-700 mb-1">Clinical Lead</p>
                        <p className="text-slate-900">{selectedJob.clinical_lead}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
                  {selectedJob.application_url && (
                    <a
                      href={selectedJob.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-linkedin-blue text-white font-medium rounded-lg hover:bg-linkedin-blue-dark transition-colors inline-flex items-center gap-2"
                    >
                      Apply Now
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {selectedJob.job_spec_pdf_url && (
                    <a
                      href={selectedJob.job_spec_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      View Job Spec
                    </a>
                  )}
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
