/**
 * Scraper Orchestrator
 * Coordinates all job scrapers and handles data deduplication/storage
 */

import { HSEScraper } from './hse';
import { HealthcareJobsScraper } from './healthcarejobs';
import { BaseScraper, type ScrapedJob, type ScraperResult } from './base';
import type { Job } from '@/types/database.types';
import { supabaseAdmin } from '@/lib/supabase';

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
  private scrapers: Map<string, BaseScraper> = new Map();

  constructor() {
    // Register fetch-based scrapers (work on Vercel)
    this.scrapers.set('HSE', new HSEScraper());
    this.scrapers.set('HealthcareJobs', new HealthcareJobsScraper());

    // Playwright scrapers are registered conditionally via registerPlaywrightScrapers()
    // They only work in GitHub Actions, not on Vercel
  }

  /**
   * Register Playwright-based scrapers (call this only in GitHub Actions environment)
   */
  async registerPlaywrightScrapers(): Promise<void> {
    try {
      const { RezoomoScraper } = await import('./rezoomo');
      const { DoctorJobsScraper } = await import('./doctorjobs');

      this.scrapers.set('Rezoomo', new RezoomoScraper());
      this.scrapers.set('DoctorJobs', new DoctorJobsScraper());
      // IrishJobs.ie removed — site blocks all automated connections (ECONNREFUSED)

      console.log('Playwright scrapers registered successfully');
    } catch (error) {
      console.warn('Playwright scrapers not available:', (error as Error).message);
    }
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

        // Per-scraper timeout of 120 seconds
        const result: ScraperResult = await Promise.race([
          scraper.scrape(),
          new Promise<ScraperResult>((_, reject) =>
            setTimeout(() => reject(new Error(`${name} scraper timed out after 120s`)), 120000)
          ),
        ]);

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
      throw new Error(`Scraper "${scraperName}" not found. Available: ${Array.from(this.scrapers.keys()).join(', ')}`);
    }

    return await scraper.scrape();
  }

  /**
   * Deduplicate jobs based on normalized title, hospital, and deadline
   */
  private deduplicateJobs(jobs: ScrapedJob[]): ScrapedJob[] {
    const seen = new Set<string>();
    const unique: ScrapedJob[] = [];

    for (const job of jobs) {
      // Normalize: strip ref codes, lowercase, trim whitespace
      const normalizedTitle = job.title
        .toLowerCase()
        .replace(/[A-Z]{2}\d{2}[A-Z]{2}\d{2}/gi, '') // Remove ref codes like MW26KR10
        .replace(/ref:?\s*\S+/gi, '')                  // Remove "ref: XYZ"
        .replace(/\s+/g, ' ')
        .trim();

      const key = `${normalizedTitle}|${job.hospital_name.toLowerCase()}|${job.application_deadline.substring(0, 10)}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(job);
      }
    }

    return unique;
  }

  /**
   * Save scraped jobs to storage
   */
  private async saveJobs(jobs: ScrapedJob[]): Promise<number> {
    try {
      if (typeof window !== 'undefined') {
        return this.saveToLocalStorage(jobs);
      } else {
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
    const STORAGE_KEY = 'medjob_jobs';

    const existingData = localStorage.getItem(STORAGE_KEY);
    const existingJobs: Job[] = existingData ? JSON.parse(existingData) : [];

    const convertedJobs: Job[] = jobs.map((scrapedJob, index) => ({
      id: `scraped_${Date.now()}_${index}`,
      title: scrapedJob.title,
      grade: scrapedJob.grade,
      specialty: scrapedJob.specialty,
      scheme_type: scrapedJob.scheme_type,
      hospital_id: scrapedJob.hospital_name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      hospital_name: scrapedJob.hospital_name,
      hospital_group: scrapedJob.hospital_group,
      county: scrapedJob.county,
      start_date: this.calculateStartDate(scrapedJob.application_deadline),
      duration_months: 6,
      rotational_detail: scrapedJob.rotational_detail,
      contract_type: scrapedJob.scheme_type.includes('TRAINING') ? 'Training' : 'Specified Purpose',
      application_deadline: scrapedJob.application_deadline,
      application_url: scrapedJob.application_url,
      job_spec_pdf_url: scrapedJob.job_spec_pdf_url,
      informal_enquiries_email: scrapedJob.informal_enquiries_email,
      informal_enquiries_name: scrapedJob.informal_enquiries_name,
      informal_contact_email: scrapedJob.informal_contact_email,
      medical_manpower_email: scrapedJob.medical_manpower_email,
      clinical_lead: scrapedJob.clinical_lead,
      historical_centile_tier: scrapedJob.historical_centile_tier,
      source: this.mapSourcePlatform(scrapedJob.source_platform),
      external_id: `${scrapedJob.source_platform}_${scrapedJob.title.substring(0, 20)}`,
      is_active: true,
      created_at: scrapedJob.scraped_at,
      updated_at: scrapedJob.scraped_at,
      last_scraped_at: scrapedJob.scraped_at,
    }));

    // Merge and deduplicate
    const allJobs = [...existingJobs, ...convertedJobs];
    const seen = new Set<string>();
    const uniqueJobs: Job[] = [];

    for (const job of allJobs) {
      const key = `${job.title.toLowerCase()}|${job.hospital_name.toLowerCase()}|${job.application_deadline}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueJobs.push(job);
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueJobs));
    return convertedJobs.length;
  }

  private calculateStartDate(deadline: string): string {
    const deadlineDate = new Date(deadline);
    const year = deadlineDate.getFullYear();
    const month = deadlineDate.getMonth();

    if (month < 6) {
      return `${year}-07-13`;
    } else {
      return `${year + 1}-01-13`;
    }
  }

  private mapSourcePlatform(platform: ScrapedJob['source_platform']): Job['source'] {
    if (platform === 'HSE_NRS' || platform === 'ABOUT_HSE') return 'NRS';
    if (platform === 'REZOOMO') return 'REZOOMO';
    if (platform === 'HEALTHCARE_JOBS') return 'HEALTHCARE_JOBS';
    return 'DIRECT_HOSPITAL';
  }

  /**
   * Save to Supabase database
   */
  private async saveToSupabase(jobs: ScrapedJob[]): Promise<number> {
    try {
      const convertedJobs: Partial<Job>[] = jobs.map((scrapedJob) => ({
        title: scrapedJob.title,
        grade: scrapedJob.grade,
        specialty: scrapedJob.specialty,
        scheme_type: scrapedJob.scheme_type,
        hospital_id: scrapedJob.hospital_name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        hospital_name: scrapedJob.hospital_name,
        hospital_group: scrapedJob.hospital_group,
        county: scrapedJob.county,
        start_date: this.calculateStartDate(scrapedJob.application_deadline),
        duration_months: 6,
        rotational_detail: scrapedJob.rotational_detail,
        contract_type: scrapedJob.scheme_type.includes('TRAINING') ? 'Training' : 'Specified Purpose',
        application_deadline: scrapedJob.application_deadline,
        application_url: scrapedJob.application_url,
        job_spec_pdf_url: scrapedJob.job_spec_pdf_url,
        informal_enquiries_email: scrapedJob.informal_enquiries_email,
        informal_enquiries_name: scrapedJob.informal_enquiries_name,
        informal_contact_email: scrapedJob.informal_contact_email,
        medical_manpower_email: scrapedJob.medical_manpower_email,
        clinical_lead: scrapedJob.clinical_lead,
        historical_centile_tier: scrapedJob.historical_centile_tier,
        source: this.mapSourcePlatform(scrapedJob.source_platform),
        external_id: `${scrapedJob.source_platform}_${scrapedJob.title.substring(0, 20)}_${scrapedJob.application_deadline.substring(0, 10)}`,
        is_active: true,
        last_scraped_at: scrapedJob.scraped_at,
      }));

      console.log(`Saving ${convertedJobs.length} jobs to Supabase...`);

      // Upsert in batches of 50 to avoid payload limits
      let totalSaved = 0;
      const batchSize = 50;

      for (let i = 0; i < convertedJobs.length; i += batchSize) {
        const batch = convertedJobs.slice(i, i + batchSize);

        const { data, error } = await supabaseAdmin
          .from('jobs')
          .upsert(batch, {
            onConflict: 'title,hospital_name,application_deadline',
            ignoreDuplicates: false,
          })
          .select();

        if (error) {
          console.error(`Error upserting batch ${i / batchSize + 1}:`, error);
          // Continue with other batches
        } else {
          totalSaved += data?.length || 0;
        }
      }

      console.log(`Successfully saved ${totalSaved} jobs to Supabase`);

      // Deactivate stale jobs: any job from these sources that wasn't in this scrape
      const scrapedSources = [...new Set(jobs.map(j => this.mapSourcePlatform(j.source_platform)))];
      const scrapedTitles = new Set(jobs.map(j => j.title.toLowerCase()));

      for (const source of scrapedSources) {
        const { data: existingJobs } = await supabaseAdmin
          .from('jobs')
          .select('id, title')
          .eq('source', source)
          .eq('is_active', true);

        if (existingJobs) {
          const staleIds = existingJobs
            .filter(j => !scrapedTitles.has(j.title.toLowerCase()))
            .map(j => j.id);

          if (staleIds.length > 0) {
            const { error: deactivateError } = await supabaseAdmin
              .from('jobs')
              .update({ is_active: false, updated_at: new Date().toISOString() })
              .in('id', staleIds);

            if (deactivateError) {
              console.error(`Error deactivating stale ${source} jobs:`, deactivateError);
            } else {
              console.log(`Deactivated ${staleIds.length} stale ${source} jobs`);
            }
          }
        }
      }

      // Log the scraping operation
      await this.logScrapingOperation(
        jobs.length,
        totalSaved,
        'SUCCESS',
        null
      );

      return totalSaved;
    } catch (error) {
      console.error('Failed to save to Supabase:', error);

      await this.logScrapingOperation(
        jobs.length,
        0,
        'FAILURE',
        (error as Error).message
      );

      if (typeof window !== 'undefined') {
        console.log('Falling back to localStorage');
        return this.saveToLocalStorage(jobs);
      }
      return 0;
    }
  }

  private async logScrapingOperation(
    jobsFound: number,
    jobsSaved: number,
    status: 'SUCCESS' | 'FAILURE' | 'PARTIAL',
    errorMessage: string | null
  ) {
    try {
      const scrapersRun = Array.from(this.scrapers.keys()).join(', ');
      await supabaseAdmin.from('scraping_logs').insert({
        source: scrapersRun,
        status,
        jobs_found: jobsFound,
        jobs_new: jobsSaved,
        jobs_updated: 0,
        error_message: errorMessage,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_seconds: 0,
      });
    } catch (error) {
      console.error('Error logging scraping operation:', error);
    }
  }

  getScraperInfo(): Array<{ name: string; platform: string }> {
    return Array.from(this.scrapers.entries()).map(([name, scraper]) => ({
      name,
      platform: (scraper as any).platformName || 'Unknown',
    }));
  }
}

let orchestratorInstance: ScraperOrchestrator | null = null;

export function getOrchestrator(): ScraperOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new ScraperOrchestrator();
  }
  return orchestratorInstance;
}
