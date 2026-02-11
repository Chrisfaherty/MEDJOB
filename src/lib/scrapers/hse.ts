/**
 * HSE Job Scraper (about.hse.ie)
 * Scrapes medical and dental jobs from the official HSE job portal.
 * Uses cheerio for robust HTML parsing.
 */

import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { BaseScraper, type ScrapedJob, type ScraperResult, delay, withRetry } from './base';
import { matchHospital, matchHospitalByCounty, inferCounty } from './hospital-matcher';
import { getHospitalTier } from '@/lib/matchProbability';

/** Keywords that indicate an NCHD-relevant job */
const NCHD_KEYWORDS = [
  'sho', 'registrar', 'senior house officer', 'nchd',
  'intern', 'doctor', 'medical officer', 'physician',
  'specialist registrar', 'spr',
];

/** Keywords that indicate a non-NCHD job — exclude these */
const EXCLUDE_KEYWORDS = [
  'consultant', 'nurse', 'nursing', 'midwife', 'midwifery',
  'admin', 'clerical', 'porter', 'housekeeper', 'chef',
  'physiotherapist', 'occupational therapist', 'social worker',
  'pharmacist', 'radiographer', 'dietitian', 'speech',
  'dental nurse', 'dental hygienist', 'healthcare assistant',
  'psychologist', 'manager', 'director', 'chief',
];

export class HSEScraper extends BaseScraper {
  private readonly medicalJobsUrl = 'https://about.hse.ie/jobs/job-search/?category=medical+and+dental';

  constructor() {
    super('https://about.hse.ie', 'ABOUT_HSE');
  }

  async scrape(): Promise<ScraperResult> {
    try {
      const jobs: ScrapedJob[] = [];

      // First, figure out how many pages there are
      const firstPageHtml = await this.fetchPage(`${this.medicalJobsUrl}&page=1`);
      if (!firstPageHtml) {
        return this.createResult([], 'Failed to fetch first page');
      }

      const totalPages = this.getTotalPages(firstPageHtml);
      console.log(`HSE scraper: Found ${totalPages} pages of medical & dental jobs`);

      // Parse first page
      const firstPageJobs = await this.parseListingPage(firstPageHtml);
      jobs.push(...firstPageJobs);

      // Scrape remaining pages
      for (let page = 2; page <= totalPages; page++) {
        await delay(2000); // Rate limit
        const html = await this.fetchPage(`${this.medicalJobsUrl}&page=${page}`);
        if (html) {
          const pageJobs = await this.parseListingPage(html);
          jobs.push(...pageJobs);
          console.log(`HSE page ${page}/${totalPages}: ${pageJobs.length} NCHD jobs (${jobs.length} total)`);
        }
      }

      console.log(`HSE scraper complete: ${jobs.length} NCHD jobs found`);
      return this.createResult(jobs);
    } catch (error) {
      console.error('HSE scraper error:', error);
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
        console.error(`HSE fetch failed: ${response.status} ${response.statusText} for ${url}`);
        return null;
      }
      return await response.text();
    } catch (error) {
      console.error(`HSE fetch error for ${url}:`, error);
      return null;
    }
  }

  /**
   * Determine total number of pages from pagination element
   */
  private getTotalPages(html: string): number {
    const $ = cheerio.load(html);

    // Look for pagination links — the last numbered page link
    const pageLinks = $('a[href*="page="]');
    let maxPage = 1;

    pageLinks.each((_, el) => {
      const href = $(el).attr('href') || '';
      const match = href.match(/page=(\d+)/);
      if (match) {
        const pageNum = parseInt(match[1], 10);
        if (pageNum > maxPage) maxPage = pageNum;
      }
    });

    // Also check the text of pagination elements
    $('.pagination li, .pager li, nav[aria-label*="pagination"] a').each((_, el) => {
      const text = $(el).text().trim();
      const num = parseInt(text, 10);
      if (!isNaN(num) && num > maxPage) maxPage = num;
    });

    // Safety cap at 30 pages (300 jobs) to prevent runaway scraping
    return Math.min(maxPage, 30);
  }

  /**
   * Parse a listing page and return NCHD-relevant jobs
   */
  private async parseListingPage(html: string): Promise<ScrapedJob[]> {
    const $ = cheerio.load(html);
    const jobs: ScrapedJob[] = [];

    // Find job cards — HSE uses various card structures
    // Try common patterns: article elements, list items with job links, div cards
    const jobElements = $(
      'article, .job-listing, .job-card, .search-results-item, ' +
      '[class*="job"], [class*="listing"], [class*="result"]'
    ).toArray();

    // If no structured elements found, fall back to finding all job links
    if (jobElements.length === 0) {
      return this.parseJobLinks($);
    }

    for (const el of jobElements) {
      const $el = $(el);
      const job = this.parseJobCard($, $el);
      if (job) jobs.push(job);
    }

    // If card parsing got nothing, fall back to link extraction
    if (jobs.length === 0) {
      return this.parseJobLinks($);
    }

    return jobs;
  }

  /**
   * Parse a single job card element
   */
  private parseJobCard($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): ScrapedJob | null {
    // Extract title — try h2, h3, h4, or any heading inside the card
    const titleEl = $el.find('h2 a, h3 a, h4 a, h2, h3, h4').first();
    const title = this.cleanText(titleEl.text());
    if (!title || title.length < 5) return null;

    // Extract URL
    let url = titleEl.attr('href') || $el.find('a').first().attr('href') || '';
    if (url && !url.startsWith('http')) {
      url = `https://about.hse.ie${url}`;
    }

    // Check NCHD relevance
    if (!this.isNCHDJob(title)) return null;

    // Extract county/location
    const locationText = $el.find('[class*="location"], [class*="county"], .meta, .details').text();
    const county = inferCounty(`${title} ${locationText}`);

    // Extract posted date
    const dateText = $el.find('[class*="date"], time, .meta').text();
    const postedDate = this.extractDate(dateText) || new Date();

    // Calculate deadline (typically 2-3 weeks from posting)
    const deadline = new Date(postedDate);
    deadline.setDate(deadline.getDate() + 21);

    // Match hospital
    const hospital = matchHospital(title) || matchHospitalByCounty(county);
    const hospitalName = hospital?.name || 'HSE Facility';
    const hospitalGroup = hospital?.hospitalGroup || 'IEHG';

    return {
      title,
      grade: this.parseGrade(title),
      specialty: this.parseSpecialty(title),
      scheme_type: this.parseSchemeType(title),
      hospital_name: hospitalName,
      hospital_group: hospitalGroup,
      county,
      application_deadline: deadline.toISOString(),
      application_url: url,
      historical_centile_tier: getHospitalTier(hospitalName),
      source_url: url || this.medicalJobsUrl,
      source_platform: 'ABOUT_HSE',
      scraped_at: new Date().toISOString(),
    };
  }

  /**
   * Fallback: extract jobs from all links matching job URL pattern
   */
  private parseJobLinks($: cheerio.CheerioAPI): ScrapedJob[] {
    const jobs: ScrapedJob[] = [];
    const seen = new Set<string>();

    $('a[href*="/jobs/job-search/"]').each((_, el) => {
      const $a = $(el);
      let href = $a.attr('href') || '';
      if (!href || href === '/jobs/job-search/' || href.includes('?')) return;

      if (!href.startsWith('http')) {
        href = `https://about.hse.ie${href}`;
      }

      // Deduplicate by URL
      if (seen.has(href)) return;
      seen.add(href);

      // Get title from link text or parent heading
      const title = this.cleanText(
        $a.text() || $a.closest('h2, h3, h4').text() || ''
      );
      if (!title || title.length < 5) return;

      if (!this.isNCHDJob(title)) return;

      // Find surrounding context for county/date
      const parent = $a.closest('article, li, div, tr');
      const contextText = parent.length ? parent.text() : '';
      const county = inferCounty(`${title} ${contextText}`);

      const postedDate = this.extractDate(contextText) || new Date();
      const deadline = new Date(postedDate);
      deadline.setDate(deadline.getDate() + 21);

      const hospital = matchHospital(title) || matchHospitalByCounty(county);
      const hospitalName = hospital?.name || 'HSE Facility';

      jobs.push({
        title,
        grade: this.parseGrade(title),
        specialty: this.parseSpecialty(title),
        scheme_type: this.parseSchemeType(title),
        hospital_name: hospitalName,
        hospital_group: hospital?.hospitalGroup || 'IEHG',
        county,
        application_deadline: deadline.toISOString(),
        application_url: href,
        historical_centile_tier: getHospitalTier(hospitalName),
        source_url: href,
        source_platform: 'ABOUT_HSE',
        scraped_at: new Date().toISOString(),
      });
    });

    return jobs;
  }

  /**
   * Check if a job title is relevant to NCHD roles
   */
  private isNCHDJob(title: string): boolean {
    const lower = title.toLowerCase();

    // Exclude non-doctor roles first
    for (const exclude of EXCLUDE_KEYWORDS) {
      if (lower.includes(exclude)) return false;
    }

    // Check for NCHD keywords
    for (const keyword of NCHD_KEYWORDS) {
      if (lower.includes(keyword)) return true;
    }

    // Also include if it mentions specific medical specialties without exclusions
    const specialtyKeywords = [
      'medicine', 'surgery', 'paediatric', 'psychiatry', 'anaesth',
      'emergency', 'obstetric', 'gynaecol', 'radiology', 'pathology',
    ];
    for (const kw of specialtyKeywords) {
      if (lower.includes(kw)) return true;
    }

    return false;
  }

  /**
   * Extract a date from text
   */
  private extractDate(text: string): Date | null {
    // Pattern: "13 February 2026"
    const match = text.match(
      /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i
    );
    if (match) {
      const date = new Date(`${match[2]} ${match[1]}, ${match[3]}`);
      if (!isNaN(date.getTime())) return date;
    }

    // Pattern: "13/02/2026" or "13-02-2026"
    const dmyMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
      const date = new Date(`${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`);
      if (!isNaN(date.getTime())) return date;
    }

    return null;
  }

  /**
   * Fetch individual job detail page for additional info (PDF, email, etc.)
   */
  async fetchJobDetails(jobUrl: string): Promise<{
    pdfUrl?: string;
    informalEnquiriesEmail?: string;
    informalEnquiriesName?: string;
    clinicalLead?: string;
    rotationalDetail?: string;
    salaryRange?: string;
    deadline?: string;
  }> {
    try {
      const html = await this.fetchPage(jobUrl);
      if (!html) return {};

      const $ = cheerio.load(html);
      const bodyText = $('body').text();

      return {
        pdfUrl: this.extractPdfUrl($),
        informalEnquiriesEmail: this.extractEmail(bodyText),
        informalEnquiriesName: this.extractContactName(bodyText),
        clinicalLead: this.extractField(bodyText, /clinical lead:?\s*(.+)/i),
        rotationalDetail: this.extractField(bodyText, /rotation:?\s*(.+)/i),
        salaryRange: this.extractSalary(bodyText),
        deadline: this.extractField(bodyText, /closing date:?\s*(.+)/i) ||
                  this.extractField(bodyText, /deadline:?\s*(.+)/i),
      };
    } catch (error) {
      console.error('Error fetching job details:', error);
      return {};
    }
  }

  private extractPdfUrl($: cheerio.CheerioAPI): string | undefined {
    const pdfLink = $('a[href$=".pdf"]').first();
    const href = pdfLink.attr('href');
    if (!href) return undefined;
    return href.startsWith('http') ? href : `https://about.hse.ie${href}`;
  }

  private extractEmail(text: string): string | undefined {
    const match = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[1] : undefined;
  }

  private extractContactName(text: string): string | undefined {
    const match = text.match(/(?:Dr\.?|Contact:?|Enquiries:?)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    return match ? match[1] : undefined;
  }

  private extractField(text: string, pattern: RegExp): string | undefined {
    const match = text.match(pattern);
    return match ? this.cleanText(match[1]) : undefined;
  }

  private extractSalary(text: string): string | undefined {
    const match = text.match(/€([\d,]+)\s*[-–]\s*€([\d,]+)/);
    return match ? `€${match[1]} - €${match[2]}` : undefined;
  }
}
