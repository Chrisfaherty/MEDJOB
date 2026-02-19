/**
 * Admin Page - Scraper Control Panel
 * Access at /admin to manually trigger job scraping
 */

import ScraperAdmin from '@/components/ScraperAdmin';
import DataQualityPanel from '@/components/DataQualityPanel';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">MedMatch-IE Admin</h1>
          <p className="text-slate-600 mt-2">
            Control panel for managing job data scraping and aggregation
          </p>
        </div>

        {/* Scraper Admin Component */}
        <ScraperAdmin />

        {/* Data Quality Monitor */}
        <div className="mt-8">
          <DataQualityPanel />
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/"
            className="p-4 bg-white rounded-lg border border-slate-200 hover:border-linkedin-blue transition-colors"
          >
            <h3 className="font-semibold text-slate-900 mb-1">← Back to Dashboard</h3>
            <p className="text-sm text-slate-600">Return to main job listings</p>
          </a>

          <a
            href="/admin/users"
            className="p-4 bg-white rounded-lg border border-slate-200 hover:border-linkedin-blue transition-colors"
          >
            <h3 className="font-semibold text-slate-900 mb-1">User Management</h3>
            <p className="text-sm text-slate-600">Manage users and permissions</p>
          </a>

          <a
            href="/api/scrape"
            className="p-4 bg-white rounded-lg border border-slate-200 hover:border-linkedin-blue transition-colors"
          >
            <h3 className="font-semibold text-slate-900 mb-1">API Documentation</h3>
            <p className="text-sm text-slate-600">View scraper API endpoints</p>
          </a>

          <a
            href="https://github.com/Chrisfaherty/MEDJOB/blob/main/SCRAPER_README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white rounded-lg border border-slate-200 hover:border-linkedin-blue transition-colors"
          >
            <h3 className="font-semibold text-slate-900 mb-1">Documentation</h3>
            <p className="text-sm text-slate-600">Read the scraper guide</p>
          </a>
        </div>

        {/* Status Info */}
        <div className="mt-8 p-6 bg-gradient-to-r from-linkedin-blue to-linkedin-blue-light rounded-lg text-white">
          <h3 className="font-semibold text-lg mb-2">💡 Pro Tip</h3>
          <p className="text-sm opacity-90">
            Set up automated daily scraping by configuring a Vercel Cron job. Jobs will automatically
            update every day at 2 AM, keeping your listings fresh without manual intervention.
          </p>
        </div>
      </div>
    </div>
  );
}
