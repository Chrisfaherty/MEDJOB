'use client';

import { formatDistanceToNow, differenceInHours, format } from 'date-fns';
import { Clock, Mail, MapPin, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
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
  index?: number;
}

export default function JobCard({
  job,
  userCentile,
  isSelected = false,
  onCardClick,
  index = 0,
}: JobCardProps) {
  const hospitalTier = job.historical_centile_tier || getHospitalTier(job.hospital_name);
  const matchRating: MatchRating | undefined =
    userCentile && hospitalTier ? calculateMatchRating(userCentile, hospitalTier) : undefined;

  const hoursUntilDeadline = differenceInHours(
    new Date(job.application_deadline),
    new Date()
  );

  const closingDate = format(new Date(job.application_deadline), 'MMM d');

  // Hospital initial for avatar
  const hospitalInitial = job.hospital_name.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.6), ease: [0.25, 0.1, 0.25, 1] }}
      onClick={() => onCardClick?.(job)}
      className={`
        relative cursor-pointer px-4 py-3.5
        transition-all duration-200 ease-out
        ${isSelected
          ? 'bg-teal-50/60 border-l-[3px] border-l-teal'
          : 'border-l-[3px] border-l-transparent hover:bg-slate-50/80'
        }
      `}
    >
      {/* Top: Hospital + County */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-slate-500">{hospitalInitial}</span>
          </div>
          <p className="text-[13px] font-semibold text-apple-black truncate">
            {job.hospital_name}
          </p>
        </div>
        {hasContactInfo(job) && (
          <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0 ml-2" title="Informal enquiry available">
            <Mail className="w-2.5 h-2.5 text-teal" />
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm text-slate-600 leading-snug line-clamp-2 mb-2 pl-9">
        {job.title}
      </h3>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap pl-9 mb-2">
        <span className="inline-flex items-center px-2 py-[3px] text-[10px] font-semibold bg-slate-700 text-white rounded-full tracking-wide">
          {GRADE_LABELS[job.grade]}
        </span>

        <span className="inline-flex items-center px-2 py-[3px] text-[10px] font-medium bg-badge-specialty/10 text-badge-specialty rounded-full">
          {SPECIALTY_LABELS[job.specialty]}
        </span>

        {matchRating && (
          <span
            className={`
              inline-flex items-center gap-0.5 px-2 py-[3px] text-[10px] font-semibold rounded-full
              ${matchRating === 'LIKELY_MATCH'
                ? 'bg-badge-match-green/10 text-badge-match-green'
                : matchRating === 'COMPETITIVE'
                ? 'bg-badge-match-amber/10 text-badge-match-amber'
                : 'bg-badge-match-red/10 text-badge-match-red'
              }
            `}
            title={MATCH_RATING_CONFIG[matchRating].description}
          >
            <TrendingUp className="w-2.5 h-2.5" />
            {MATCH_RATING_CONFIG[matchRating].label}
          </span>
        )}
      </div>

      {/* Footer: County + Deadline */}
      <div className="flex items-center justify-between pl-9">
        <div className="flex items-center gap-1 text-[11px] text-apple-secondary">
          <MapPin className="w-3 h-3" />
          <span>{job.county}</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-apple-secondary">
          <Clock className="w-3 h-3" />
          <span>
            {closingDate}
            {hoursUntilDeadline <= 72 && hoursUntilDeadline > 0 && (
              <span className={`ml-0.5 font-semibold ${
                hoursUntilDeadline <= 48 ? 'text-deadline-critical' : 'text-deadline-warning'
              }`}>
                ({Math.floor(hoursUntilDeadline)}h)
              </span>
            )}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
