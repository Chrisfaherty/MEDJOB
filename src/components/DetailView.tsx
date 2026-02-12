'use client';

import { useState } from 'react';
import { differenceInHours, differenceInDays, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
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
  TrendingUp,
  Timer,
  GraduationCap,
} from 'lucide-react';
import type { Job, MatchRating } from '@/types/database.types';
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

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'team', label: 'The Team' },
  { id: 'application', label: 'Application' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function DetailView({
  job,
  userCentile,
  userName,
  userEmail,
  isFavorite = false,
  onFavoriteToggle,
}: DetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const hospitalTier = job.historical_centile_tier || getHospitalTier(job.hospital_name);
  const matchRating: MatchRating | undefined =
    userCentile && hospitalTier ? calculateMatchRating(userCentile, hospitalTier) : undefined;
  const hoursUntilDeadline = differenceInHours(new Date(job.application_deadline), new Date());
  const daysUntilDeadline = differenceInDays(new Date(job.application_deadline), new Date());

  const emailData = hasContactInfo(job) ? generateEmailFromJob(job, userName, userEmail) : null;

  // Deadline progress (from posting to deadline)
  const totalDays = differenceInDays(new Date(job.application_deadline), new Date(job.created_at || job.start_date));
  const elapsed = totalDays - daysUntilDeadline;
  const progressPercent = totalDays > 0 ? Math.min(100, Math.max(0, (elapsed / totalDays) * 100)) : 0;

  // Hospital initial
  const hospitalInitial = job.hospital_name.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Hero Section */}
      <motion.div
        key={job.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="px-6 pt-6 pb-4 border-b border-slate-200/60"
      >
        {/* Hospital + Actions Row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-teal/8 border border-teal/12 flex items-center justify-center flex-shrink-0">
              <span className="text-base font-bold text-teal">{hospitalInitial}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-[17px] font-bold text-apple-black leading-tight truncate">
                {job.hospital_name}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-apple-secondary flex-shrink-0" />
                <span className="text-[12px] text-apple-secondary truncate">
                  {job.county} · {HOSPITAL_GROUP_LABELS[job.hospital_group]}
                </span>
              </div>
            </div>
          </div>

          {/* Favorite */}
          {onFavoriteToggle && (
            <button
              onClick={() => onFavoriteToggle(job.id)}
              className={`p-2 rounded-xl transition-all duration-200 ${
                isFavorite
                  ? 'bg-red-50 text-red-500'
                  : 'text-slate-300 hover:text-red-400 hover:bg-red-50/50'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Job Title */}
        <h1 className="text-xl font-bold text-apple-black leading-snug mb-3">
          {job.title}
        </h1>

        {/* Badge Row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-[3px] text-[10px] font-semibold bg-slate-700 text-white rounded-full tracking-wide">
            {GRADE_LABELS[job.grade]}
          </span>
          <span className="inline-flex items-center px-2.5 py-[3px] text-[10px] font-medium bg-badge-specialty/10 text-badge-specialty rounded-full">
            {SPECIALTY_LABELS[job.specialty]}
          </span>
          <span className={`inline-flex items-center px-2.5 py-[3px] text-[10px] font-medium rounded-full ${
            job.scheme_type.includes('TRAINING')
              ? 'bg-scheme-training/10 text-scheme-training'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {SCHEME_TYPE_LABELS[job.scheme_type]}
          </span>
          {matchRating && (
            <span className={`inline-flex items-center gap-0.5 px-2.5 py-[3px] text-[10px] font-semibold rounded-full ${
              matchRating === 'LIKELY_MATCH'
                ? 'bg-badge-match-green/10 text-badge-match-green'
                : matchRating === 'COMPETITIVE'
                ? 'bg-badge-match-amber/10 text-badge-match-amber'
                : 'bg-badge-match-red/10 text-badge-match-red'
            }`}>
              <TrendingUp className="w-2.5 h-2.5" />
              {MATCH_RATING_CONFIG[matchRating].label}
            </span>
          )}
        </div>
      </motion.div>

      {/* Animated Tabs */}
      <div className="flex border-b border-slate-200/60 px-6 bg-white/80">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative px-4 py-2.5 text-[13px] font-medium transition-colors"
          >
            <span className={activeTab === tab.id ? 'text-teal' : 'text-apple-secondary hover:text-slate-600'}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-2 right-2 h-[2px] bg-teal rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab
                job={job}
                hoursUntilDeadline={hoursUntilDeadline}
                daysUntilDeadline={daysUntilDeadline}
                progressPercent={progressPercent}
                matchRating={matchRating}
                userCentile={userCentile}
                hospitalTier={hospitalTier}
              />
            )}
            {activeTab === 'team' && <TeamTab job={job} />}
            {activeTab === 'application' && (
              <ApplicationTab job={job} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Action Bar — Glass */}
      <div className="glass border-t border-slate-200/50 px-6 py-3 flex items-center gap-2.5">
        {job.application_url && (
          <a
            href={job.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-5 py-2.5 bg-teal text-white text-[13px] font-semibold rounded-xl hover:bg-teal-dark transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
          >
            Apply Now
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        {hasContactInfo(job) && (
          <a
            href={emailData?.mailto || `mailto:${job.informal_enquiries_email || job.informal_contact_email}`}
            className="px-4 py-2.5 border border-slate-200/80 text-slate-600 text-[13px] font-medium rounded-xl hover:bg-slate-50/80 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Mail className="w-3.5 h-3.5" />
            Email
          </a>
        )}

        {job.job_spec_pdf_url && (
          <a
            href={job.job_spec_pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 border border-slate-200/80 text-slate-600 text-[13px] font-medium rounded-xl hover:bg-slate-50/80 transition-colors inline-flex items-center justify-center gap-2"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Spec</span>
          </a>
        )}
      </div>
    </div>
  );
}

/* ─── Overview Tab ─── */

function OverviewTab({
  job,
  hoursUntilDeadline,
  daysUntilDeadline,
  progressPercent,
  matchRating,
  userCentile,
  hospitalTier,
}: {
  job: Job;
  hoursUntilDeadline: number;
  daysUntilDeadline: number;
  progressPercent: number;
  matchRating?: MatchRating;
  userCentile?: number;
  hospitalTier?: string | null;
}) {
  return (
    <div className="p-6 space-y-5">
      {/* Deadline Timeline */}
      <div className={`p-4 rounded-2xl border ${
        hoursUntilDeadline <= 48
          ? 'bg-red-50/60 border-red-200/60'
          : hoursUntilDeadline <= 168
          ? 'bg-amber-50/60 border-amber-200/60'
          : 'bg-teal-50/60 border-teal/10'
      }`}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${
              hoursUntilDeadline <= 48 ? 'text-red-500' : hoursUntilDeadline <= 168 ? 'text-amber-500' : 'text-teal'
            }`} />
            <span className="text-[13px] font-semibold text-apple-black">
              Closes {format(new Date(job.application_deadline), 'MMM d, yyyy')}
            </span>
          </div>
          <span className={`text-[12px] font-semibold ${
            hoursUntilDeadline <= 48 ? 'text-red-500' : hoursUntilDeadline <= 168 ? 'text-amber-500' : 'text-teal'
          }`}>
            {hoursUntilDeadline <= 48
              ? `${Math.max(0, Math.floor(hoursUntilDeadline))}h left`
              : `${Math.max(0, daysUntilDeadline)}d left`
            }
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              hoursUntilDeadline <= 48 ? 'bg-red-400' : hoursUntilDeadline <= 168 ? 'bg-amber-400' : 'bg-teal'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3">
        <DetailCell
          icon={<Calendar className="w-3.5 h-3.5" />}
          label="Start Date"
          value={format(new Date(job.start_date), 'MMM d, yyyy')}
        />
        {job.duration_months && (
          <DetailCell
            icon={<Timer className="w-3.5 h-3.5" />}
            label="Duration"
            value={`${job.duration_months} months`}
          />
        )}
        <DetailCell
          icon={<Briefcase className="w-3.5 h-3.5" />}
          label="Contract"
          value={job.contract_type || (job.scheme_type.includes('TRAINING') ? 'Training' : 'Service')}
        />
        <DetailCell
          icon={<Building2 className="w-3.5 h-3.5" />}
          label="Source"
          value={job.source}
        />
      </div>

      {/* Rotation Details */}
      {job.rotational_detail && (
        <div>
          <h3 className="text-[12px] font-semibold text-apple-secondary uppercase tracking-wider mb-2">Rotation</h3>
          <p className="text-[13px] text-slate-600 leading-relaxed p-3.5 bg-scheme-training/5 border border-scheme-training/10 rounded-xl">
            {job.rotational_detail}
          </p>
        </div>
      )}

      {/* Pay Scale */}
      <div>
        <h3 className="text-[12px] font-semibold text-apple-secondary uppercase tracking-wider mb-2">Pay Scale (HSE)</h3>
        <div className="p-3.5 bg-apple-gray/60 rounded-xl">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-apple-secondary" />
            <span className="text-[13px] text-slate-600">
              {job.grade === 'SHO' && '€46,895 – €60,810 (point 1-7)'}
              {job.grade === 'REGISTRAR' && '€55,518 – €75,735 (point 1-7)'}
              {job.grade === 'SPECIALIST_REGISTRAR' && '€60,810 – €84,973 (point 1-8)'}
            </span>
          </div>
        </div>
      </div>

      {/* Match Probability */}
      {matchRating && (
        <div>
          <h3 className="text-[12px] font-semibold text-apple-secondary uppercase tracking-wider mb-2">Match Probability</h3>
          <div className={`p-4 rounded-2xl border ${
            matchRating === 'LIKELY_MATCH' ? 'bg-badge-match-green/5 border-badge-match-green/15' :
            matchRating === 'COMPETITIVE' ? 'bg-badge-match-amber/5 border-badge-match-amber/15' :
            'bg-badge-match-red/5 border-badge-match-red/15'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className={`w-4 h-4 ${
                matchRating === 'LIKELY_MATCH' ? 'text-badge-match-green' :
                matchRating === 'COMPETITIVE' ? 'text-badge-match-amber' : 'text-badge-match-red'
              }`} />
              <span className={`text-[13px] font-semibold ${
                matchRating === 'LIKELY_MATCH' ? 'text-badge-match-green' :
                matchRating === 'COMPETITIVE' ? 'text-badge-match-amber' : 'text-badge-match-red'
              }`}>
                {MATCH_RATING_CONFIG[matchRating].label}
              </span>
            </div>
            <p className="text-[12px] text-slate-500 leading-relaxed">
              {MATCH_RATING_CONFIG[matchRating].description}.
              Based on your centile ({userCentile}) and {hospitalTier?.replace('_', ' ').toLowerCase()} hospital tier.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Team Tab ─── */

function TeamTab({ job }: { job: Job }) {
  if (!job.clinical_lead && !job.informal_enquiries_name) {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-14 h-14 rounded-2xl bg-apple-gray flex items-center justify-center mx-auto mb-3">
          <User className="w-6 h-6 text-slate-300" />
        </div>
        <p className="text-[14px] font-medium text-slate-500">No team information available</p>
        <p className="text-[12px] text-apple-secondary mt-1">Contact details may be in the job specification</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-3">
      {job.clinical_lead && (
        <div className="p-4 bg-apple-gray/50 rounded-2xl border border-slate-200/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal/8 flex items-center justify-center flex-shrink-0">
              <User className="w-4.5 h-4.5 text-teal" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-apple-black">{job.clinical_lead}</p>
              <p className="text-[11px] text-apple-secondary font-medium">Clinical Lead</p>
            </div>
          </div>
        </div>
      )}

      {job.informal_enquiries_name && (
        <div className="p-4 bg-apple-gray/50 rounded-2xl border border-slate-200/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-scheme-training/8 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4.5 h-4.5 text-scheme-training" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-apple-black">{job.informal_enquiries_name}</p>
              <p className="text-[11px] text-apple-secondary font-medium">Contact for Informal Enquiries</p>
              {job.informal_enquiries_email && (
                <a
                  href={`mailto:${job.informal_enquiries_email}`}
                  className="text-[12px] text-teal hover:underline font-medium mt-0.5 inline-block"
                >
                  {job.informal_enquiries_email}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Application Tab ─── */

function ApplicationTab({ job }: { job: Job }) {
  const steps = [
    {
      title: 'Review the Job Specification',
      desc: 'Download and read the full job spec to confirm eligibility',
    },
    {
      title: 'Send Informal Enquiry',
      desc: 'Contact the clinical lead to express interest (optional)',
    },
    {
      title: 'Submit Application',
      desc: 'Apply through the official portal before the deadline',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Steps */}
      <div>
        <h3 className="text-[12px] font-semibold text-apple-secondary uppercase tracking-wider mb-3">How to Apply</h3>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-teal text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-apple-black">{step.title}</p>
                <p className="text-[11px] text-apple-secondary mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Details */}
      {(job.informal_enquiries_email || job.medical_manpower_email) && (
        <div>
          <h3 className="text-[12px] font-semibold text-apple-secondary uppercase tracking-wider mb-3">Contact Details</h3>
          <div className="space-y-2">
            {job.informal_enquiries_email && (
              <div className="flex items-center gap-2.5 p-3 bg-apple-gray/50 rounded-xl">
                <Mail className="w-3.5 h-3.5 text-apple-secondary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-apple-secondary">Informal Enquiries</p>
                  <a href={`mailto:${job.informal_enquiries_email}`} className="text-[13px] text-teal hover:underline font-medium truncate block">
                    {job.informal_enquiries_email}
                  </a>
                </div>
              </div>
            )}
            {job.medical_manpower_email && (
              <div className="flex items-center gap-2.5 p-3 bg-apple-gray/50 rounded-xl">
                <Mail className="w-3.5 h-3.5 text-apple-secondary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-apple-secondary">Medical Manpower</p>
                  <a href={`mailto:${job.medical_manpower_email}`} className="text-[13px] text-teal hover:underline font-medium truncate block">
                    {job.medical_manpower_email}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Detail Cell ─── */

function DetailCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-apple-gray/50 border border-slate-200/30">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-apple-secondary">{icon}</span>
        <p className="text-[10px] font-semibold text-apple-secondary uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-[13px] font-medium text-apple-black">{value}</p>
    </div>
  );
}
