/**
 * IrishJobs.ie Scraper
 * Scrapes NCHD jobs from irishjobs.ie — JS-rendered, requires Playwright.
 */

import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { type ScrapedJob, type ScraperResult, delay } from './base';
import { PlaywrightBaseScraper } from './playwright-base';
import { matchHospital, matchHospitalByCounty, inferCounty } from './hospital-matcher';
import { getHospitalTier } from '@/lib/matchProbability';

const SEARCH_URLS = [
  'https://www.irishjobs.ie/jobs/nchd/',
  'https://www.irishjobs.ie/jobs/senior-house-officer/',
  'https://www.irishjobs.ie/jobs/registrar-medical/',
  'https://www.irishjobs.ie/ShowResults.aspx?Keywords=NCHD&Location=0&Category=49&autosuggestEndpoint=%2fautosuggest&btnSubmit=Search',
];

export class IrishJobsScraper extends PlaywrightBaseScraper {
  constructor() {
    super('https://www.irishjobs.ie', 'IRISH_JOBS');
  }

  protected async doScrape(): Promise<ScraperResult> {
    const allJobs: ScrapedJob[] = [];
    const seenUrls = new Set<string>();

    for (const searchUrl of SEARCH_URLS) {
      try {
        console.log(`IrishJobs: Scraping ${searchUrl}...`);
        const jobs = await this.scrapeSearchPage(searchUrl, seenUrls);
        allJobs.push(...jobs);
        await delay(3000);
      } catch (error) {
        console.error(`IrishJobs error for ${searchUrl}:`, error);
      }
    }

    console.log(`IrishJobs scraper complete: ${allJobs.length} NCHD jobs found`);
    return this.createResult(allJobs);
  }

  private async scrapeSearchPage(url: string, seenUrls: Set<string>): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    try {
      await this.navigateTo(url, '.job-listing, .job-result, [class*="result"]');
    } catch {
      // Page might not load or selector might not exist
      console.warn(`IrishJobs: Could not load ${url}`);
      return jobs;
    }

    await this.scrollToBottom();

    const html = await this.getPageContent();
    const $ = cheerio.load(html);

    // Parse job listings
    $(
      '.job-listing, .job-result, [class*="job-card"], [class*="result-item"], ' +
      'article, .search-result, [class*="listing"], [data-job-id]'
    ).each((_, el) => {
      const $el = $(el);
      const job = this.parseJobCard($, $el, seenUrls);
      if (job) jobs.push(job);
    });

    // Fallback: parse links
    if (jobs.length === 0) {
      $('a[href*="/job/"], a[href*="/Jobs/"]').each((_, el) => {
        const $a = $(el);
        const title = this.cleanText($a.text());
        if (!title || title.length < 5 || !this.isNCHDJob(title)) return;

        let href = $a.attr('href') || '';
        if (!href.startsWith('http')) href = `https://www.irishjobs.ie${href}`;
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
          source_platform: 'IRISH_JOBS',
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
    if (url && !url.startsWith('http')) url = `https://www.irishjobs.ie${url}`;
    if (seenUrls.has(url)) return null;
    seenUrls.add(url);

    const locationText = $el.find('[class*="location"], [class*="county"], .meta').text();
    const county = inferCounty(`${title} ${locationText}`);

    const deadlineText = $el.find('[class*="date"], [class*="deadline"], time, [class*="posted"]').text();
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
      source_url: url || 'https://www.irishjobs.ie',
      source_platform: 'IRISH_JOBS',
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
