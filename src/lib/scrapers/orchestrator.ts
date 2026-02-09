/**
 * Scraper Orchestrator
 * Coordinates all job scrapers and handles data deduplication/storage
 */

import { HSEScraper } from './hse';
import type { ScrapedJob, ScraperResult } from './base';
import type { Job } from '@/types/database.types';

export interface OrchestrationResult {
  total_jobs_scraped: number;
  total_jobs_saved: number;
  duplicates_removed: number;
  scrapers_run: string[];
  errors: string[];
  scrape_started_at: string;
  scrape_completed_at: string;
  duration_seconds: number;
}

export class ScraperOrchestrator {
  private scrapers: Map<string, any> = new Map();

  constructor() {
    // Register all available scrapers
    this.scrapers.set('HSE', new HSEScraper());
    // Add more scrapers as they're built:
    // this.scrapers.set('Rezoomo', new RezoomoScraper());
    // this.scrapers.set('GlobalMedics', new GlobalMedicsScraper());
  }

  /**
   * Run all registered scrapers
   */
  async scrapeAll(): Promise<OrchestrationResult> {
    const startTime = new Date();
    const results: OrchestrationResult = {
      total_jobs_scraped: 0,
      total_jobs_saved: 0,
      duplicates_removed: 0,
      scrapers_run: [],
      errors: [],
      scrape_started_at: startTime.toISOString(),
      scrape_completed_at: '',
      duration_seconds: 0,
    };

    const allJobs: ScrapedJob[] = [];

    // Run each scraper sequentially (to be respectful to servers)
    for (const [name, scraper] of this.scrapers.entries()) {
      try {
        console.log(`Running ${name} scraper...`);
        const result: ScraperResult = await scraper.scrape();

        results.scrapers_run.push(name);
        results.total_jobs_scraped += result.job_count;
        allJobs.push(...result.jobs);

        if (result.error) {
          results.errors.push(`${name}: ${result.error}`);
        }

        console.log(`${name} scraper completed: ${result.job_count} jobs found`);
      } catch (error) {
        const errorMsg = `${name} scraper failed: ${(error as Error).message}`;
        results.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Deduplicate jobs
    const uniqueJobs = this.deduplicateJobs(allJobs);
    results.duplicates_removed = allJobs.length - uniqueJobs.length;

    // Save to database/storage
    const savedCount = await this.saveJobs(uniqueJobs);
    results.total_jobs_saved = savedCount;

    const endTime = new Date();
    results.scrape_completed_at = endTime.toISOString();
    results.duration_seconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    return results;
  }

  /**
   * Run a specific scraper by name
   */
  async scrapeSingle(scraperName: string): Promise<ScraperResult> {
    const scraper = this.scrapers.get(scraperName);
    if (!scraper) {
      throw new Error(`Scraper "${scraperName}" not found`);
    }

    return await scraper.scrape();
  }

  /**
   * Deduplicate jobs based on title, hospital, and deadline
   */
  private deduplicateJobs(jobs: ScrapedJob[]): ScrapedJob[] {
    const seen = new Set<string>();
    const unique: ScrapedJob[] = [];

    for (const job of jobs) {
      // Create a unique key combining title, hospital, and deadline
      const key = `${job.title.toLowerCase()}|${job.hospital_name.toLowerCase()}|${job.application_deadline}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(job);
      }
    }

    return unique;
  }

  /**
   * Save scraped jobs to storage
   * This can be adapted to use Supabase or localStorage depending on configuration
   */
  private async saveJobs(jobs: ScrapedJob[]): Promise<number> {
    try {
      // Check if we're in browser environment
      if (typeof window !== 'undefined') {
        return this.saveToLocalStorage(jobs);
      } else {
        // Server-side: save to Supabase
        return this.saveToSupabase(jobs);
      }
    } catch (error) {
      console.error('Error saving jobs:', error);
      return 0;
    }
  }

  /**
   * Save to browser localStorage
   */
  private saveToLocalStorage(jobs: ScrapedJob[]): number {
    const STORAGE_KEY = 'medjob_scraped_jobs';

    // Get existing jobs
    const existingData = localStorage.getItem(STORAGE_KEY);
    const existingJobs: ScrapedJob[] = existingData ? JSON.parse(existingData) : [];

    // Merge new jobs with existing (deduplicate again)
    const allJobs = [...existingJobs, ...jobs];
    const uniqueJobs = this.deduplicateJobs(allJobs);

    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueJobs));

    return jobs.length;
  }

  /**
   * Save to Supabase database
   */
  private async saveToSupabase(jobs: ScrapedJob[]): Promise<number> {
    // This will be implemented when we integrate with Supabase
    // For now, return 0
    console.log(`Would save ${jobs.length} jobs to Supabase`);
    return 0;
  }

  /**
   * Get statistics about available scrapers
   */
  getScraperInfo(): Array<{ name: string; platform: string }> {
    return Array.from(this.scrapers.entries()).map(([name, scraper]) => ({
      name,
      platform: scraper.platformName || 'Unknown',
    }));
  }
}

/**
 * Singleton instance
 */
let orchestratorInstance: ScraperOrchestrator | null = null;

export function getOrchestrator(): ScraperOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new ScraperOrchestrator();
  }
  return orchestratorInstance;
}
