'use client';

import { useEffect, useState } from 'react';
import { BarChart3, AlertTriangle, MapPin, Building2, Stethoscope, RefreshCw } from 'lucide-react';
import { supabaseJobsAPI } from '@/lib/supabase';
import type { Job } from '@/types/database.types';

const GENERIC_HOSPITAL_NAMES = [
  'HSE Facility',
  'Healthcare Facility',
  'Irish Healthcare Facility',
];

interface QualityStats {
  totalActive: number;
  genericHospital: number;
  genericHospitalJobs: { title: string; hospital_name: string; county: string }[];
  byCounty: Record<string, number>;
  bySource: Record<string, number>;
  bySpecialty: Record<string, number>;
  byGrade: Record<string, number>;
}

function analyzeJobs(jobs: Job[]): QualityStats {
  const genericHospitalJobs = jobs.filter(j =>
    GENERIC_HOSPITAL_NAMES.includes(j.hospital_name)
  );

  const byCounty: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const bySpecialty: Record<string, number> = {};
  const byGrade: Record<string, number> = {};

  for (const job of jobs) {
    byCounty[job.county] = (byCounty[job.county] || 0) + 1;
    bySource[job.source || 'Unknown'] = (bySource[job.source || 'Unknown'] || 0) + 1;
    bySpecialty[job.specialty] = (bySpecialty[job.specialty] || 0) + 1;
    byGrade[job.grade] = (byGrade[job.grade] || 0) + 1;
  }

  return {
    totalActive: jobs.length,
    genericHospital: genericHospitalJobs.length,
    genericHospitalJobs: genericHospitalJobs.map(j => ({
      title: j.title,
      hospital_name: j.hospital_name,
      county: j.county,
    })),
    byCounty,
    bySource,
    bySpecialty,
    byGrade,
  };
}

function sortedEntries(obj: Record<string, number>): [string, number][] {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function DataQualityPanel() {
  const [stats, setStats] = useState<QualityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const jobs = await supabaseJobsAPI.getActiveJobs();
      setStats(analyzeJobs(jobs));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Loading data quality metrics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <span>Failed to load job data: {error}</span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const qualityScore = stats.totalActive > 0
    ? Math.round(((stats.totalActive - stats.genericHospital) / stats.totalActive) * 100)
    : 100;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal" />
            Data Quality Monitor
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Overview of job data completeness and hospital resolution accuracy
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Top-level stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Active Jobs</p>
          <p className="text-3xl font-bold text-slate-900">{stats.totalActive}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Sources</p>
          <p className="text-3xl font-bold text-slate-900">{Object.keys(stats.bySource).length}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Counties</p>
          <p className="text-3xl font-bold text-slate-900">{Object.keys(stats.byCounty).length}</p>
        </div>
        <div className={`p-4 rounded-lg border ${
          qualityScore >= 95 ? 'bg-green-50 border-green-200' :
          qualityScore >= 80 ? 'bg-amber-50 border-amber-200' :
          'bg-red-50 border-red-200'
        }`}>
          <p className="text-sm text-slate-600">Hospital Match Rate</p>
          <p className={`text-3xl font-bold ${
            qualityScore >= 95 ? 'text-green-600' :
            qualityScore >= 80 ? 'text-amber-600' :
            'text-red-600'
          }`}>{qualityScore}%</p>
        </div>
      </div>

      {/* Generic hospital warning */}
      {stats.genericHospital > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-900">
              {stats.genericHospital} job{stats.genericHospital !== 1 ? 's' : ''} with unresolved hospital
            </h3>
          </div>
          <p className="text-sm text-amber-700 mb-3">
            These jobs have generic hospital names — the matcher couldn't identify a specific hospital.
          </p>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-amber-800">
                  <th className="pb-1 font-medium">Title</th>
                  <th className="pb-1 font-medium">Hospital</th>
                  <th className="pb-1 font-medium">County</th>
                </tr>
              </thead>
              <tbody className="text-amber-700">
                {stats.genericHospitalJobs.slice(0, 20).map((job, i) => (
                  <tr key={i} className="border-t border-amber-100">
                    <td className="py-1 pr-2 truncate max-w-[300px]">{job.title}</td>
                    <td className="py-1 pr-2">{job.hospital_name}</td>
                    <td className="py-1">{job.county}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.genericHospitalJobs.length > 20 && (
              <p className="text-xs text-amber-600 mt-2">
                ...and {stats.genericHospitalJobs.length - 20} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By County */}
        <div>
          <h3 className="font-semibold text-slate-900 flex items-center gap-1.5 mb-3">
            <MapPin className="w-4 h-4 text-teal" />
            Jobs by County
          </h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {sortedEntries(stats.byCounty).map(([county, count]) => (
              <div key={county} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{county}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal rounded-full"
                      style={{ width: `${(count / stats.totalActive) * 100}%` }}
                    />
                  </div>
                  <span className="text-slate-500 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Source */}
        <div>
          <h3 className="font-semibold text-slate-900 flex items-center gap-1.5 mb-3">
            <Building2 className="w-4 h-4 text-teal" />
            Jobs by Source
          </h3>
          <div className="space-y-1.5">
            {sortedEntries(stats.bySource).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{formatLabel(source)}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(count / stats.totalActive) * 100}%` }}
                    />
                  </div>
                  <span className="text-slate-500 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Specialty */}
        <div>
          <h3 className="font-semibold text-slate-900 flex items-center gap-1.5 mb-3">
            <Stethoscope className="w-4 h-4 text-teal" />
            Jobs by Specialty
          </h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {sortedEntries(stats.bySpecialty).map(([specialty, count]) => (
              <div key={specialty} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{formatLabel(specialty)}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${(count / stats.totalActive) * 100}%` }}
                    />
                  </div>
                  <span className="text-slate-500 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Grade */}
        <div>
          <h3 className="font-semibold text-slate-900 flex items-center gap-1.5 mb-3">
            <BarChart3 className="w-4 h-4 text-teal" />
            Jobs by Grade
          </h3>
          <div className="space-y-1.5">
            {sortedEntries(stats.byGrade).map(([grade, count]) => (
              <div key={grade} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{formatLabel(grade)}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${(count / stats.totalActive) * 100}%` }}
                    />
                  </div>
                  <span className="text-slate-500 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
