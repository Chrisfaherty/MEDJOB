'use client';

import { useState } from 'react';
import { Play, RefreshCw, CheckCircle, XCircle, Clock, Database } from 'lucide-react';

interface ScrapeResult {
  total_jobs_scraped: number;
  total_jobs_saved: number;
  duplicates_removed: number;
  scrapers_run: string[];
  errors: string[];
  scrape_started_at: string;
  scrape_completed_at: string;
  duration_seconds: number;
}

export default function ScraperAdmin() {
  const [isScraping, setIsScraping] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedScraper, setSelectedScraper] = useState<string>('all');

  const availableScrapers = [
    { id: 'all', name: 'All Scrapers', description: 'Run all available scrapers' },
    { id: 'HSE', name: 'HSE/about.hse.ie', description: 'Official HSE job portal' },
    // Add more as they're implemented
    // { id: 'Rezoomo', name: 'Rezoomo', description: 'HSE regional job listings' },
  ];

  const handleScrape = async () => {
    setIsScraping(true);
    setError(null);
    setResult(null);

    try {
      const url =
        selectedScraper === 'all'
          ? '/api/scrape'
          : `/api/scrape?scraper=${selectedScraper}`;

      const response = await fetch(url, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message || 'Scraping failed');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-linkedin-blue" />
            Job Scraper Control Panel
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Manually trigger job scraping from Irish medical job boards
          </p>
        </div>
      </div>

      {/* Scraper Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Scraper
        </label>
        <select
          value={selectedScraper}
          onChange={(e) => setSelectedScraper(e.target.value)}
          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:border-transparent"
          disabled={isScraping}
        >
          {availableScrapers.map((scraper) => (
            <option key={scraper.id} value={scraper.id}>
              {scraper.name} - {scraper.description}
            </option>
          ))}
        </select>
      </div>

      {/* Action Button */}
      <button
        onClick={handleScrape}
        disabled={isScraping}
        className={`
          w-full py-3 px-6 rounded-lg font-medium text-white
          flex items-center justify-center gap-2
          transition-all duration-200
          ${
            isScraping
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-linkedin-blue hover:bg-linkedin-blue-dark active:scale-95'
          }
        `}
      >
        {isScraping ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Scraping in progress...
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Start Scraping
          </>
        )}
      </button>

      {/* Results */}
      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Scraping Completed Successfully!</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <p className="text-sm text-slate-600">Jobs Scraped</p>
              <p className="text-2xl font-bold text-green-600">{result.total_jobs_scraped}</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-green-200">
              <p className="text-sm text-slate-600">Jobs Saved</p>
              <p className="text-2xl font-bold text-green-600">{result.total_jobs_saved}</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-green-200">
              <p className="text-sm text-slate-600">Duplicates Removed</p>
              <p className="text-2xl font-bold text-amber-600">{result.duplicates_removed}</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-green-200">
              <p className="text-sm text-slate-600 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Duration
              </p>
              <p className="text-2xl font-bold text-blue-600">{result.duration_seconds}s</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-slate-600 mb-2">Scrapers Run:</p>
            <div className="flex flex-wrap gap-2">
              {result.scrapers_run.map((scraper) => (
                <span
                  key={scraper}
                  className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full"
                >
                  {scraper}
                </span>
              ))}
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800 mb-2">Warnings:</p>
              <ul className="text-sm text-amber-700 space-y-1">
                {result.errors.map((err, idx) => (
                  <li key={idx}>• {err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Scraping Failed</h3>
          </div>
          <p className="text-sm text-red-700 mt-2">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">How It Works</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Scrapes job listings from selected Irish medical job boards</li>
          <li>• Automatically deduplicates jobs based on title, hospital, and deadline</li>
          <li>• Saves jobs to your local storage or Supabase database</li>
          <li>• Rate-limited to be respectful to source websites (2-3 second delays)</li>
          <li>• Can be run manually or scheduled via cron job</li>
        </ul>
      </div>
    </div>
  );
}
