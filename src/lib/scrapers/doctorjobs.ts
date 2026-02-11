/**
 * DoctorJobs.ie Scraper
 * Scrapes NCHD jobs from doctorjobs.ie — JS-rendered SPA, requires Playwright.
 */

import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { type ScrapedJob, type ScraperResult, delay } from './base';
import { PlaywrightBaseScraper } from './playwright-base';
import { matchHospital, matchHospitalByCounty, inferCounty } from './hospital-matcher';
import { getHospitalTier } from '@/lib/matchProbability';

export class DoctorJobsScraper extends PlaywrightBaseScraper {
  constructor() {
    super('https://www.doctorjobs.ie', 'DOCTOR_JOBS');
  }

  protected async doScrape(): Promise<ScraperResult> {
    const jobs: ScrapedJob[] = [];
    const seenUrls = new Set<string>();

    // Main search pages
    const searchUrls = [
      'https://www.doctorjobs.ie/jobs/nchd-doctors/',
      'https://www.doctorjobs.ie/disciplines/nchd-doctors',
      'https://www.doctorjobs.ie/jobs/',
    ];

    for (const url of searchUrls) {
      try {
        console.log(`DoctorJobs: Scraping ${url}...`);
        await this.navigateTo(url, '.job-listing, .vacancy, [class*="job"]');
        await this.scrollToBottom();

        // Try "Load More" buttons
        let loadMoreClicks = 0;
        while (loadMoreClicks < 5) {
          const clicked = await this.clickIfExists(
            'button[class*="load-more"], a[class*="load-more"], .pagination a:last-child'
          );
          if (!clicked) break;
          loadMoreClicks++;
          await delay(2000);
        }

        const html = await this.getPageContent();
        const pageJobs = this.parseJobListings(html, seenUrls);
        jobs.push(...pageJobs);
        console.log(`DoctorJobs ${url}: ${pageJobs.length} NCHD jobs`);

        await delay(3000);
      } catch (error) {
        console.error(`DoctorJobs error for ${url}:`, error);
      }
    }

    console.log(`DoctorJobs scraper complete: ${jobs.length} NCHD jobs found`);
    return this.createResult(jobs);
  }

  private parseJobListings(html: string, seenUrls: Set<string>): ScrapedJob[] {
    const $ = cheerio.load(html);
    const jobs: ScrapedJob[] = [];

    // Try structured elements
    $(
      '.job-listing, .vacancy, [class*="job-card"], [class*="job-item"], ' +
      'article, .search-result, [class*="listing"]'
    ).each((_, el) => {
      const $el = $(el);
      const job = this.parseJobCard($, $el, seenUrls);
      if (job) jobs.push(job);
    });

    // Fallback: look for links
    if (jobs.length === 0) {
      $('a[href*="/job/"], a[href*="/jobs/"], a[href*="/vacancy/"]').each((_, el) => {
        const $a = $(el);
        const title = this.cleanText($a.text());
        if (!title || title.length < 5 || !this.isNCHDJob(title)) return;

        let href = $a.attr('href') || '';
        if (!href.startsWith('http')) href = `https://www.doctorjobs.ie${href}`;
        if (seenUrls.has(href)) return;
        seenUrls.add(href);

        const county = inferCounty(title);
        const hospital = matchHospital(title) || matchHospitalByCounty(county);
        const hospitalName = hospital?.name || 'Irish Healthcare Facility';

        jobs.push({
          title,
          grade: this.parseGrade(title),
          specialty: this.parseSpecialty(title),
          scheme_type: this.parseSchemeType(title),
          hospital_name: hospitalName,
          hospital_group: hospital?.hospitalGroup || 'IEHG',
          county,
          application_deadline: this.defaultDeadline(),
          application_url: href,
          historical_centile_tier: getHospitalTier(hospitalName),
          source_url: href,
          source_platform: 'DOCTOR_JOBS',
          scraped_at: new Date().toISOString(),
        });
      });
    }

    return jobs;
  }

  private parseJobCard(
    $: cheerio.CheerioAPI,
    $el: cheerio.Cheerio<any>,
    seenUrls: Set<string>
  ): ScrapedJob | null {
    const titleEl = $el.find('h2 a, h3 a, h4 a, a[class*="title"], h2, h3').first();
    const title = this.cleanText(titleEl.text());
    if (!title || title.length < 5 || !this.isNCHDJob(title)) return null;

    let url = titleEl.attr('href') || $el.find('a').first().attr('href') || '';
    if (url && !url.startsWith('http')) url = `https://www.doctorjobs.ie${url}`;
    if (seenUrls.has(url)) return null;
    seenUrls.add(url);

    const locationText = $el.find('[class*="location"], [class*="county"], .meta').text();
    const county = inferCounty(`${title} ${locationText}`);

    const deadlineText = $el.find('[class*="date"], [class*="deadline"], time').text();
    const deadline = this.extractDate(deadlineText) || this.defaultDeadline();

    const hospital = matchHospital(`${title} ${locationText}`) || matchHospitalByCounty(county);
    const hospitalName = hospital?.name || 'Irish Healthcare Facility';

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
      source_url: url || 'https://www.doctorjobs.ie',
      source_platform: 'DOCTOR_JOBS',
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
      'physician', 'spr', 'senior house officer',
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
    return null;
  }

  private defaultDeadline(): string {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString();
  }
}
