'use client';

import { useState } from 'react';
import { formatDistanceToNow, differenceInHours, format } from 'date-fns';
import {
  Clock,
  MapPin,
  Building2,
  GraduationCap,
  Mail,
  ExternalLink,
  FileText,
  Calendar,
} from 'lucide-react';
import type { Job, ApplicationStatus } from '@/types/database.types';
import {
  SPECIALTY_LABELS,
  GRADE_LABELS,
  SCHEME_TYPE_LABELS,
  HOSPITAL_GROUP_LABELS,
} from '@/types/database.types';

interface JobCardProps {
  job: Job;
  userStatus?: ApplicationStatus;
  onStatusChange?: (jobId: string, status: ApplicationStatus) => void;
  onCardClick?: (job: Job) => void;
  isSelected?: boolean;
}

export default function JobCard({
  job,
  userStatus,
  onStatusChange,
  onCardClick,
  isSelected = false,
}: JobCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate deadline urgency
  const hoursUntilDeadline = differenceInHours(
    new Date(job.application_deadline),
    new Date()
  );

  const getDeadlineColor = () => {
    if (hoursUntilDeadline <= 48) return 'deadline-critical';
    if (hoursUntilDeadline <= 168) return 'deadline-warning'; // 7 days
    return 'deadline-normal';
  };

  const getDeadlineText = () => {
    if (hoursUntilDeadline <= 48) {
      return `${Math.floor(hoursUntilDeadline)} hours left`;
    }
    return formatDistanceToNow(new Date(job.application_deadline), {
      addSuffix: true,
    });
  };

  const getSchemeColor = () => {
    return job.scheme_type.includes('TRAINING') ? 'scheme-training' : 'scheme-non-training';
  };

  const STATUS_OPTIONS: { value: ApplicationStatus; label: string; color: string }[] = [
    { value: 'NOT_APPLIED', label: 'Not Applied', color: 'bg-slate-100 text-slate-700' },
    { value: 'APPLIED', label: 'Applied', color: 'bg-status-applied text-white' },
    { value: 'INTERVIEW_OFFERED', label: 'Interview', color: 'bg-status-interview text-white' },
    { value: 'SHORTLISTED', label: 'Shortlisted', color: 'bg-status-shortlisted text-white' },
    { value: 'REJECTED', label: 'Rejected', color: 'bg-status-rejected text-white' },
    { value: 'ACCEPTED', label: 'Accepted', color: 'bg-green-600 text-white' },
  ];

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === (userStatus || 'NOT_APPLIED'));

  return (
    <div
      className={`
        bg-white rounded-lg border transition-all duration-200 cursor-pointer
        ${isSelected ? 'border-linkedin-blue shadow-linkedin ring-2 ring-linkedin-blue ring-opacity-50' : 'border-slate-200'}
        ${isHovered ? 'shadow-card-hover' : 'shadow-card'}
        hover:shadow-linkedin
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onCardClick?.(job)}
    >
      {/* Deadline Banner */}
      <div
        className={`
          px-4 py-2 rounded-t-lg flex items-center justify-between text-sm font-semibold
          ${
            hoursUntilDeadline <= 48
              ? 'bg-red-50 text-red-700 border-b border-red-100'
              : hoursUntilDeadline <= 168
              ? 'bg-amber-50 text-amber-700 border-b border-amber-100'
              : 'bg-green-50 text-green-700 border-b border-green-100'
          }
        `}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Closes {getDeadlineText()}</span>
        </div>
        <span className="text-xs font-normal opacity-80">
          {format(new Date(job.application_deadline), 'MMM d, yyyy • h:mm a')}
        </span>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-3">
        {/* Title & Grade */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 line-clamp-2 mb-1">
            {job.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-linkedin-blue text-white">
              {GRADE_LABELS[job.grade]}
            </span>
            <span
              className={`
                inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                ${job.scheme_type.includes('TRAINING') ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}
              `}
            >
              <GraduationCap className="w-3 h-3" />
              {SCHEME_TYPE_LABELS[job.scheme_type]}
            </span>
          </div>
        </div>

        {/* Specialty */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="font-medium">{SPECIALTY_LABELS[job.specialty]}</span>
          {job.duration_months && (
            <>
              <span className="text-slate-400">•</span>
              <span>{job.duration_months} months</span>
            </>
          )}
        </div>

        {/* Rotational Detail */}
        {job.rotational_detail && (
          <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
            <span className="font-medium">Rotation: </span>
            {job.rotational_detail}
          </div>
        )}

        {/* Hospital & Location */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="font-medium">{job.hospital_name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{job.county}</span>
            <span className="text-slate-400">•</span>
            <span className="text-xs px-2 py-0.5 bg-slate-100 rounded">
              {HOSPITAL_GROUP_LABELS[job.hospital_group]}
            </span>
          </div>
        </div>

        {/* Contact Info */}
        {job.informal_enquiries_email && (
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-blue-50 p-2 rounded border border-blue-100">
            <Mail className="w-4 h-4 text-linkedin-blue flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {job.informal_enquiries_name && (
                <div className="font-medium text-slate-700 truncate">
                  {job.informal_enquiries_name}
                </div>
              )}
              <a
                href={`mailto:${job.informal_enquiries_email}`}
                className="text-linkedin-blue hover:underline truncate block"
                onClick={(e) => e.stopPropagation()}
              >
                {job.informal_enquiries_email}
              </a>
            </div>
          </div>
        )}

        {/* Clinical Lead */}
        {job.clinical_lead && (
          <div className="text-sm text-slate-600">
            <span className="font-medium">Clinical Lead: </span>
            {job.clinical_lead}
          </div>
        )}

        {/* Start Date */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Starts {format(new Date(job.start_date), 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 bg-slate-50 rounded-b-lg border-t border-slate-100 flex items-center justify-between gap-3">
        {/* Status Selector */}
        <div className="flex-1">
          <select
            value={userStatus || 'NOT_APPLIED'}
            onChange={(e) => {
              e.stopPropagation();
              onStatusChange?.(job.id, e.target.value as ApplicationStatus);
            }}
            className={`
              w-full px-3 py-1.5 rounded-md text-sm font-medium border-0 cursor-pointer
              focus:ring-2 focus:ring-linkedin-blue focus:outline-none
              ${currentStatus?.color || 'bg-slate-100 text-slate-700'}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {job.job_spec_pdf_url && (
            <a
              href={job.job_spec_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-600 hover:text-linkedin-blue hover:bg-white rounded-md transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="View Job Specification"
            >
              <FileText className="w-4 h-4" />
            </a>
          )}
          {job.application_url && (
            <a
              href={job.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-linkedin-blue text-white text-sm font-medium rounded-md hover:bg-linkedin-blue-dark transition-colors inline-flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              Apply
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Source Badge */}
      <div className="absolute top-2 right-2">
        <span className="text-[10px] px-2 py-0.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full text-slate-600 font-medium">
          {job.source}
        </span>
      </div>
    </div>
  );
}
