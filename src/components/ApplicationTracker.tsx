'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Building2 } from 'lucide-react';
import { differenceInHours } from 'date-fns';
import type { Job, ApplicationStatus, UserApplication } from '@/types/database.types';
import { SPECIALTY_LABELS } from '@/types/database.types';
import { supabaseApplicationsAPI } from '@/lib/supabase';

interface ApplicationTrackerProps {
  jobs: Job[];
  onJobSelect: (job: Job) => void;
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  NOT_APPLIED: 'Not Applied',
  APPLIED: 'Applied',
  INTERVIEW_OFFERED: 'Interview',
  SHORTLISTED: 'Shortlisted',
  REJECTED: 'Rejected',
  ACCEPTED: 'Accepted',
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  NOT_APPLIED: 'bg-slate-100 text-slate-600',
  APPLIED: 'bg-blue-100 text-blue-700',
  INTERVIEW_OFFERED: 'bg-amber-100 text-amber-700',
  SHORTLISTED: 'bg-teal/10 text-teal',
  REJECTED: 'bg-red-100 text-red-600',
  ACCEPTED: 'bg-green-100 text-green-700',
};

export default function ApplicationTracker({ jobs, onJobSelect }: ApplicationTrackerProps) {
  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [stats, setStats] = useState({ total: 0, applied: 0, interview: 0, shortlisted: 0 });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const [apps, appStats] = await Promise.all([
        supabaseApplicationsAPI.getUserApplications(),
        supabaseApplicationsAPI.getApplicationStats().catch(() => ({ total: 0, applied: 0, interview: 0, shortlisted: 0 })),
      ]);
      setApplications(apps);
      setStats(appStats);
      const notesMap: Record<string, string> = {};
      apps.forEach(app => { if (app.notes) notesMap[app.job_id] = app.notes; });
      setNotes(notesMap);
    } catch {
      setError('Could not load applications. Make sure you are signed in.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: ApplicationStatus) => {
    setApplications(prev => prev.map(a => a.job_id === jobId ? { ...a, status: newStatus } : a));
    try {
      const updated = await supabaseApplicationsAPI.updateStatus(jobId, newStatus, notes[jobId]);
      setApplications(prev => prev.map(a => a.job_id === jobId ? updated : a));
    } catch {
      loadApplications();
    }
  };

  const handleNotesBlur = async (jobId: string) => {
    const app = applications.find(a => a.job_id === jobId);
    if (!app || notes[jobId] === (app.notes ?? '')) return;
    try {
      await supabaseApplicationsAPI.updateStatus(jobId, app.status, notes[jobId]);
    } catch { /* silent */ }
  };

  const jobMap = new Map(jobs.map(j => [j.id, j]));

  const sortedApplications = [...applications].sort((a, b) => {
    const jobA = jobMap.get(a.job_id);
    const jobB = jobMap.get(b.job_id);
    if (!jobA || !jobB) return 0;
    return new Date(jobA.application_deadline).getTime() - new Date(jobB.application_deadline).getTime();
  });

  function DeadlineChip({ deadline }: { deadline: string }) {
    const hours = differenceInHours(new Date(deadline), new Date());
    if (hours <= 0) return <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500 rounded-full">Closed</span>;
    if (hours <= 48) return <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded-full">{Math.ceil(hours)}h left</span>;
    if (hours <= 168) return <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">{Math.ceil(hours / 24)}d left</span>;
    return <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500 rounded-full">{Math.ceil(hours / 24)}d left</span>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-apple-gray">
      {/* Stats Bar */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-slate-100 shadow-sm">
        {[
          { label: 'Tracked', value: stats.total, color: 'text-apple-black' },
          { label: 'Applied', value: stats.applied, color: 'text-blue-600' },
          { label: 'Interview', value: stats.interview, color: 'text-amber-600' },
          { label: 'Shortlisted', value: stats.shortlisted, color: 'text-teal' },
        ].map(stat => (
          <div key={stat.label} className="flex-1 text-center py-1">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-apple-secondary font-medium mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Application List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-teal"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-[13px] text-red-500 font-medium">{error}</p>
          </div>
        ) : sortedApplications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-card">
              <ClipboardList className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-apple-black text-lg font-semibold">No applications tracked</p>
            <p className="text-[13px] text-apple-secondary mt-1 max-w-xs mx-auto">
              Open any job and mark it as Applied to start tracking
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-w-3xl mx-auto">
            {sortedApplications.map(app => {
              const job = jobMap.get(app.job_id);
              if (!job) return null;
              return (
                <div
                  key={app.job_id}
                  className="bg-white rounded-2xl p-4 shadow-card border border-slate-100/80 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => onJobSelect(job)}
                        className="text-[14px] font-semibold text-apple-black hover:text-teal transition-colors text-left w-full truncate block"
                      >
                        {job.title}
                      </button>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] text-apple-secondary">
                          <Building2 className="w-3 h-3" />
                          {job.hospital_name}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                          {SPECIALTY_LABELS[job.specialty]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <DeadlineChip deadline={job.application_deadline} />
                      <select
                        value={app.status}
                        onChange={e => handleStatusChange(app.job_id, e.target.value as ApplicationStatus)}
                        className={`text-[11px] font-semibold rounded-full border-none outline-none cursor-pointer px-2.5 py-1 ${STATUS_COLORS[app.status]}`}
                      >
                        {(Object.entries(STATUS_LABELS) as [ApplicationStatus, string][]).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <textarea
                    value={notes[app.job_id] || ''}
                    onChange={e => setNotes(prev => ({ ...prev, [app.job_id]: e.target.value }))}
                    onBlur={() => handleNotesBlur(app.job_id)}
                    placeholder="Add notes..."
                    rows={2}
                    className="w-full text-[12px] text-apple-secondary bg-apple-gray/60 border border-slate-200/60 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 placeholder:text-slate-300 transition-all"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
