'use client';

import { differenceInHours, format } from 'date-fns';
import * as Tabs from '@radix-ui/react-tabs';
import {
  Building2,
  MapPin,
  Calendar,
  Clock,
  Heart,
  Mail,
  ExternalLink,
  FileText,
  Send,
  Briefcase,
  User,
} from 'lucide-react';
import type { Job, ApplicationStatus, MatchRating } from '@/types/database.types';
import {
  SPECIALTY_LABELS,
  GRADE_LABELS,
  SCHEME_TYPE_LABELS,
  HOSPITAL_GROUP_LABELS,
  MATCH_RATING_CONFIG,
} from '@/types/database.types';
import { calculateMatchRating, getHospitalTier } from '@/lib/matchProbability';
import { generateEmailFromJob, hasContactInfo } from '@/lib/emailTemplates';

interface DetailViewProps {
  job: Job;
  userCentile?: number;
  userName?: string;
  userEmail?: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (jobId: string) => void;
}

export default function DetailView({
  job,
  userCentile,
  userName,
  userEmail,
  isFavorite = false,
  onFavoriteToggle,
}: DetailViewProps) {
  const hospitalTier = job.historical_centile_tier || getHospitalTier(job.hospital_name);
  const matchRating: MatchRating | undefined =
    userCentile && hospitalTier ? calculateMatchRating(userCentile, hospitalTier) : undefined;
  const hoursUntilDeadline = differenceInHours(new Date(job.application_deadline), new Date());

  const emailData = hasContactInfo(job) ? generateEmailFromJob(job, userName, userEmail) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Hero Section */}
      <div className="p-6 border-b border-slate-200">
        {/* Hospital Name + Actions */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-teal" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{job.hospital_name}</h2>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="w-3.5 h-3.5" />
                <span>{job.county}</span>
                <span className="text-slate-300">|</span>
                <span>{HOSPITAL_GROUP_LABELS[job.hospital_group]}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onFavoriteToggle && (
              <button
                onClick={() => onFavoriteToggle(job.id)}
                className={`p-2 rounded-lg border transition-colors ${
                  isFavorite
                    ? 'bg-red-50 border-red-200 text-red-500'
                    : 'border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}

            {hasContactInfo(job) && (
              <a
                href={emailData?.mailto || `mailto:${job.informal_enquiries_email || job.informal_contact_email}`}
                className="px-4 py-2 bg-white border border-teal text-teal text-sm font-medium rounded-lg hover:bg-teal-50 transition-colors inline-flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Contact Consultant
              </a>
            )}
          </div>
        </div>

        {/* Job Title */}
        <h1 className="text-2xl font-bold text-slate-900 mb-3">{job.title}</h1>

        {/* Badge Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 text-xs font-medium bg-slate-600 text-white rounded">
            {GRADE_LABELS[job.grade]}
          </span>
          <span className="px-2.5 py-1 text-xs font-medium bg-badge-specialty/10 text-badge-specialty rounded">
            {SPECIALTY_LABELS[job.specialty]}
          </span>
          <span className={`px-2.5 py-1 text-xs font-medium rounded ${
            job.scheme_type.includes('TRAINING')
              ? 'bg-blue-50 text-blue-700'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {SCHEME_TYPE_LABELS[job.scheme_type]}
          </span>
          {matchRating && (
            <span className={`px-2.5 py-1 text-xs font-medium rounded ${
              matchRating === 'LIKELY_MATCH'
                ? 'bg-badge-match-green/10 text-badge-match-green'
                : matchRating === 'COMPETITIVE'
                ? 'bg-badge-match-amber/10 text-badge-match-amber'
                : 'bg-badge-match-red/10 text-badge-match-red'
            }`}>
              {MATCH_RATING_CONFIG[matchRating].label}
            </span>
          )}
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <Tabs.Root defaultValue="overview" className="flex flex-col h-full">
          <Tabs.List className="flex border-b border-slate-200 px-6 bg-white sticky top-0 z-10">
            <Tabs.Trigger
              value="overview"
              className="px-4 py-3 text-sm font-medium text-slate-500 border-b-2 border-transparent data-[state=active]:text-teal data-[state=active]:border-teal transition-colors"
            >
              Overview
            </Tabs.Trigger>
            <Tabs.Trigger
              value="team"
              className="px-4 py-3 text-sm font-medium text-slate-500 border-b-2 border-transparent data-[state=active]:text-teal data-[state=active]:border-teal transition-colors"
            >
              The Team
            </Tabs.Trigger>
            <Tabs.Trigger
              value="application"
              className="px-4 py-3 text-sm font-medium text-slate-500 border-b-2 border-transparent data-[state=active]:text-teal data-[state=active]:border-teal transition-colors"
            >
              Application
            </Tabs.Trigger>
          </Tabs.List>

          {/* Overview Tab */}
          <Tabs.Content value="overview" className="p-6 space-y-6">
            {/* Deadline */}
            <div className={`p-4 rounded-lg border ${
              hoursUntilDeadline <= 48
                ? 'bg-red-50 border-red-200'
                : hoursUntilDeadline <= 168
                ? 'bg-amber-50 border-amber-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center gap-2">
                <Clock className={`w-5 h-5 ${
                  hoursUntilDeadline <= 48 ? 'text-red-600' : hoursUntilDeadline <= 168 ? 'text-amber-600' : 'text-green-600'
                }`} />
                <div>
                  <p className="font-semibold text-slate-900">
                    Closes {format(new Date(job.application_deadline), 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm text-slate-600">
                    {hoursUntilDeadline <= 48
                      ? `${Math.max(0, Math.floor(hoursUntilDeadline))} hours remaining`
                      : `${Math.ceil(hoursUntilDeadline / 24)} days remaining`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500 mb-1">Start Date</p>
                <p className="text-sm font-medium text-slate-900">
                  {format(new Date(job.start_date), 'MMM d, yyyy')}
                </p>
              </div>
              {job.duration_months && (
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-500 mb-1">Duration</p>
                  <p className="text-sm font-medium text-slate-900">{job.duration_months} months</p>
                </div>
              )}
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500 mb-1">Contract</p>
                <p className="text-sm font-medium text-slate-900">
                  {job.contract_type || (job.scheme_type.includes('TRAINING') ? 'Training' : 'Service')}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500 mb-1">Source</p>
                <p className="text-sm font-medium text-slate-900">{job.source}</p>
              </div>
            </div>

            {/* Rotation Details */}
            {job.rotational_detail && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Rotation Details</h3>
                <p className="text-sm text-slate-600 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  {job.rotational_detail}
                </p>
              </div>
            )}

            {/* Pay Scale */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Pay Scale (HSE Consolidated)</h3>
              <div className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">
                {job.grade === 'SHO' && <p>SHO: €46,895 - €60,810 (point 1-7)</p>}
                {job.grade === 'REGISTRAR' && <p>Registrar: €55,518 - €75,735 (point 1-7)</p>}
                {job.grade === 'SPECIALIST_REGISTRAR' && <p>SpR: €60,810 - €84,973 (point 1-8)</p>}
              </div>
            </div>

            {/* Centile History / Match */}
            {matchRating && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Match Probability</h3>
                <div className={`p-3 rounded-lg ${
                  matchRating === 'LIKELY_MATCH' ? 'bg-green-50 border border-green-200' :
                  matchRating === 'COMPETITIVE' ? 'bg-amber-50 border border-amber-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    matchRating === 'LIKELY_MATCH' ? 'text-green-800' :
                    matchRating === 'COMPETITIVE' ? 'text-amber-800' : 'text-red-800'
                  }`}>
                    {MATCH_RATING_CONFIG[matchRating].label} — {MATCH_RATING_CONFIG[matchRating].description}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Based on your centile ({userCentile}) and {hospitalTier?.replace('_', ' ').toLowerCase()} hospital tier
                  </p>
                </div>
              </div>
            )}
          </Tabs.Content>

          {/* Team Tab */}
          <Tabs.Content value="team" className="p-6 space-y-4">
            {job.clinical_lead ? (
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-teal" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{job.clinical_lead}</p>
                    <p className="text-xs text-slate-500">Clinical Lead</p>
                  </div>
                </div>
              </div>
            ) : null}

            {job.informal_enquiries_name ? (
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{job.informal_enquiries_name}</p>
                    <p className="text-xs text-slate-500">Contact for Informal Enquiries</p>
                    {job.informal_enquiries_email && (
                      <a href={`mailto:${job.informal_enquiries_email}`} className="text-xs text-teal hover:underline">
                        {job.informal_enquiries_email}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {!job.clinical_lead && !job.informal_enquiries_name && (
              <div className="text-center py-12">
                <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No team information available for this posting</p>
                <p className="text-xs text-slate-400 mt-1">Contact details may be in the job specification</p>
              </div>
            )}
          </Tabs.Content>

          {/* Application Tab */}
          <Tabs.Content value="application" className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">How to Apply</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Review the Job Specification</p>
                    <p className="text-xs text-slate-500 mt-0.5">Download and read the full job spec to confirm eligibility</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Send Informal Enquiry (Optional)</p>
                    <p className="text-xs text-slate-500 mt-0.5">Contact the clinical lead to express interest and ask questions</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Submit Application</p>
                    <p className="text-xs text-slate-500 mt-0.5">Apply through the official portal before the deadline</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info for Application */}
            {(job.informal_enquiries_email || job.medical_manpower_email) && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Contact Details</h3>
                <div className="space-y-2">
                  {job.informal_enquiries_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">Informal Enquiries: </span>
                      <a href={`mailto:${job.informal_enquiries_email}`} className="text-teal hover:underline">
                        {job.informal_enquiries_email}
                      </a>
                    </div>
                  )}
                  {job.medical_manpower_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">Medical Manpower: </span>
                      <a href={`mailto:${job.medical_manpower_email}`} className="text-teal hover:underline">
                        {job.medical_manpower_email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* Floating Action Bar */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-6 py-3 flex items-center gap-3">
        {job.application_url && (
          <a
            href={job.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-5 py-2.5 bg-teal text-white text-sm font-semibold rounded-lg hover:bg-teal-dark transition-colors inline-flex items-center justify-center gap-2"
          >
            Apply Now
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {hasContactInfo(job) && (
          <a
            href={emailData?.mailto || `mailto:${job.informal_enquiries_email || job.informal_contact_email}`}
            className="px-5 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Email Inquiry
          </a>
        )}

        {job.job_spec_pdf_url && (
          <a
            href={job.job_spec_pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Job Spec</span>
          </a>
        )}
      </div>
    </div>
  );
}
