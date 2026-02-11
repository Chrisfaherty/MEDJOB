'use client';

import { formatDistanceToNow, differenceInHours, format } from 'date-fns';
import {
  Clock,
  Mail,
  Building2,
  TrendingUp,
} from 'lucide-react';
import type { Job, MatchRating } from '@/types/database.types';
import {
  SPECIALTY_LABELS,
  GRADE_LABELS,
  MATCH_RATING_CONFIG,
} from '@/types/database.types';
import { calculateMatchRating, getHospitalTier } from '@/lib/matchProbability';
import { hasContactInfo } from '@/lib/emailTemplates';

interface JobCardProps {
  job: Job;
  userCentile?: number;
  isSelected?: boolean;
  onCardClick?: (job: Job) => void;
}

export default function JobCard({
  job,
  userCentile,
  isSelected = false,
  onCardClick,
}: JobCardProps) {
  const hospitalTier = job.historical_centile_tier || getHospitalTier(job.hospital_name);
  const matchRating: MatchRating | undefined =
    userCentile && hospitalTier ? calculateMatchRating(userCentile, hospitalTier) : undefined;

  const hoursUntilDeadline = differenceInHours(
    new Date(job.application_deadline),
    new Date()
  );

  const timePosted = job.created_at
    ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true })
    : '';

  const closingDate = format(new Date(job.application_deadline), 'MMM d, yyyy');

  // Hospital initial for logo placeholder
  const hospitalInitial = job.hospital_name.charAt(0).toUpperCase();

  return (
    <div
      onClick={() => onCardClick?.(job)}
      className={`
        relative bg-white border border-slate-900/10 cursor-pointer
        transition-all duration-200 ease-out
        hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(0,122,126,0.08)]
        ${isSelected
          ? 'border-teal shadow-[0_0_0_1px_#007A7E,0_0_20px_rgba(0,122,126,0.1)]'
          : 'hover:border-slate-900/20'
        }
      `}
    >
      <div className="p-4">
        {/* Top Row: Logo + Title + Time */}
        <div className="flex items-start gap-3 mb-3">
          {/* Hospital Logo Placeholder */}
          <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-slate-400" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-[1.05rem] font-semibold text-slate-900 leading-snug line-clamp-2">
              {job.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{job.hospital_name}</p>
          </div>

          {timePosted && (
            <span className="text-[11px] text-slate-400 flex-shrink-0 whitespace-nowrap">
              {timePosted}
            </span>
          )}
        </div>

        {/* Badge Row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {/* Grade Badge */}
          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-slate-600 text-white rounded">
            {GRADE_LABELS[job.grade]}
          </span>

          {/* Specialty Badge */}
          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-badge-specialty/10 text-badge-specialty rounded">
            {SPECIALTY_LABELS[job.specialty]}
          </span>

          {/* Match Badge */}
          {matchRating && (
            <span
              className={`
                inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded
                ${matchRating === 'LIKELY_MATCH'
                  ? 'bg-badge-match-green/10 text-badge-match-green'
                  : matchRating === 'COMPETITIVE'
                  ? 'bg-badge-match-amber/10 text-badge-match-amber'
                  : 'bg-badge-match-red/10 text-badge-match-red'
                }
              `}
              title={MATCH_RATING_CONFIG[matchRating].description}
            >
              <TrendingUp className="w-3 h-3" />
              {MATCH_RATING_CONFIG[matchRating].label}
            </span>
          )}
        </div>

        {/* Footer: Closing Date + Contact Icon */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Closes {closingDate}
              {hoursUntilDeadline <= 72 && (
                <span className={`ml-1 font-medium ${
                  hoursUntilDeadline <= 48 ? 'text-deadline-critical' : 'text-deadline-warning'
                }`}>
                  ({Math.max(0, Math.floor(hoursUntilDeadline))}h left)
                </span>
              )}
            </span>
          </div>

          {hasContactInfo(job) && (
            <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center" title="Informal enquiry available">
              <Mail className="w-3 h-3 text-teal" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
