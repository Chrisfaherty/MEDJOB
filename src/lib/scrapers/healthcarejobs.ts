/**
 * HealthcareJobs.ie Scraper
 * Scrapes NCHD jobs from healthcarejobs.ie — server-rendered, works with fetch + cheerio.
 */

import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { BaseScraper, type ScrapedJob, type ScraperResult, delay, withRetry } from './base';
import { matchHospital, matchHospitalByCounty, inferCounty } from './hospital-matcher';
import { getHospitalTier } from '@/lib/matchProbability';

export class HealthcareJobsScraper extends BaseScraper {
  private readonly searchUrl = 'https://www.healthcarejobs.ie/jobs/medical/';

  constructor() {
    super('https://www.healthcarejobs.ie', 'HEALTHCARE_JOBS');
  }

  async scrape(): Promise<ScraperResult> {
    try {
      const jobs: ScrapedJob[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 10) {
        const url = page === 1 ? this.searchUrl : `${this.searchUrl}?page=${page}`;
        const html = await this.fetchPage(url);
        if (!html) break;

        const pageJobs = this.parseListingPage(html);
        if (pageJobs.length === 0) {
          hasMore = false;
        } else {
          jobs.push(...pageJobs);
          console.log(`HealthcareJobs page ${page}: ${pageJobs.length} jobs (${jobs.length} total)`);
          page++;
          await delay(2000);
        }
      }

      console.log(`HealthcareJobs scraper complete: ${jobs.length} NCHD jobs found`);
      return this.createResult(jobs);
    } catch (error) {
      console.error('HealthcareJobs scraper error:', error);
      return this.createResult([], (error as Error).message);
    }
  }

  private async fetchPage(url: string): Promise<string | null> {
    try {
      const response = await withRetry(() =>
        fetch(url, {
          headers: {
            'User-Agent': 'MedJob-IE/1.0 (NCHD Job Aggregator)',
            'Accept': 'text/html',
          },
        })
      );
      if (!response.ok) {
        console.error(`HealthcareJobs fetch failed: ${response.status} for ${url}`);
        return null;
      }
      return await response.text();
    } catch (error) {
      console.error(`HealthcareJobs fetch error for ${url}:`, error);
      return null;
    }
  }

  private parseListingPage(html: string): ScrapedJob[] {
    const $ = cheerio.load(html);
    const jobs: ScrapedJob[] = [];

    // HealthcareJobs uses job listing cards with various structures
    $(
      '.job-listing, .job-card, article, [class*="job-result"], ' +
      '[class*="listing"], .search-result, .vacancy'
    ).each((_, el) => {
      const $el = $(el);
      const job = this.parseJobCard($, $el);
      if (job) jobs.push(job);
    });

    // Fallback: look for job links
    if (jobs.length === 0) {
      $('a[href*="/job/"], a[href*="/vacancy/"], a[href*="/jobs/"]').each((_, el) => {
        const $a = $(el);
        const href = $a.attr('href') || '';
        if (!href || href === this.searchUrl) return;

        const title = this.cleanText($a.text());
        if (!title || title.length < 5 || !this.isNCHDJob(title)) return;

        const fullUrl = href.startsWith('http') ? href : `https://www.healthcarejobs.ie${href}`;
        const parent = $a.closest('li, div, tr, article');
        const contextText = parent.length ? parent.text() : '';
        const county = inferCounty(`${title} ${contextText}`);
        const hospital = matchHospital(title) || matchHospitalByCounty(county);
        const hospitalName = hospital?.name || 'Healthcare Facility';

        jobs.push({
          title,
          grade: this.parseGrade(title),
          specialty: this.parseSpecialty(title),
          scheme_type: this.parseSchemeType(title),
          hospital_name: hospitalName,
          hospital_group: hospital?.hospitalGroup || 'IEHG',
          county,
          application_deadline: this.defaultDeadline(),
          application_url: fullUrl,
          historical_centile_tier: getHospitalTier(hospitalName),
          source_url: fullUrl,
          source_platform: 'HEALTHCARE_JOBS',
          scraped_at: new Date().toISOString(),
        });
      });
    }

    return jobs;
  }

  private parseJobCard($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): ScrapedJob | null {
    const titleEl = $el.find('h2 a, h3 a, h4 a, a[class*="title"], h2, h3').first();
    const title = this.cleanText(titleEl.text());
    if (!title || title.length < 5 || !this.isNCHDJob(title)) return null;

    let url = titleEl.attr('href') || $el.find('a').first().attr('href') || '';
    if (url && !url.startsWith('http')) {
      url = `https://www.healthcarejobs.ie${url}`;
    }

    const locationText = $el.find('[class*="location"], [class*="county"], .meta').text();
    const county = inferCounty(`${title} ${locationText}`);

    // Try to extract deadline from card
    const deadlineText = $el.find('[class*="date"], [class*="deadline"], time').text();
    const deadline = this.extractDate(deadlineText) || this.defaultDeadline();

    const hospital = matchHospital(`${title} ${locationText}`) || matchHospitalByCounty(county);
    const hospitalName = hospital?.name || 'Healthcare Facility';

    return {
      title,
      grade: this.parseGrade(title),
      specialty: this.parseSpecialty(title),
      scheme_type: this.parseSchemeType(title),
      hospital_name: hospitalName,
      hospital_group: hospital?.hospitalGroup || 'IEHG',
      county,
      application_deadline: deadline,
      application_url: url,
      historical_centile_tier: getHospitalTier(hospitalName),
      source_url: url || this.searchUrl,
      source_platform: 'HEALTHCARE_JOBS',
      scraped_at: new Date().toISOString(),
    };
  }

  private isNCHDJob(title: string): boolean {
    const lower = title.toLowerCase();
    const excludes = [
      'consultant', 'nurse', 'nursing', 'midwife', 'admin', 'clerical',
      'physiotherapist', 'pharmacist', 'radiographer', 'dietitian',
      'healthcare assistant', 'psychologist', 'manager', 'porter',
    ];
    for (const ex of excludes) {
      if (lower.includes(ex)) return false;
    }

    const includes = [
      'sho', 'registrar', 'nchd', 'intern', 'doctor', 'medical officer',
      'physician', 'specialist registrar', 'spr', 'senior house officer',
      'medicine', 'surgery', 'paediatric', 'psychiatry', 'anaesth',
      'emergency', 'obstetric', 'gynaecol',
    ];
    for (const inc of includes) {
      if (lower.includes(inc)) return true;
    }
    return false;
  }

  private extractDate(text: string): string | null {
    const match = text.match(
      /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i
    );
    if (match) {
      const date = new Date(`${match[2]} ${match[1]}, ${match[3]}`);
      if (!isNaN(date.getTime())) return date.toISOString();
    }
    const dmyMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
      const date = new Date(`${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`);
      if (!isNaN(date.getTime())) return date.toISOString();
    }
    return null;
  }

  private defaultDeadline(): string {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString();
  }
}
