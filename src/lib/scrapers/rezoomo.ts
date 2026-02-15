/**
 * Rezoomo Scraper
 * Scrapes NCHD jobs from hospital-specific Rezoomo recruitment pages.
 * Rezoomo is a React SPA — requires Playwright.
 *
 * Known hospital Rezoomo pages:
 * - CHI (Children's Health Ireland)
 * - Mater Misericordiae University Hospital
 * - University Hospital Galway / Saolta
 * - HSE South / SSWHG
 * - RCSI Hospital Group
 */

import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { type ScrapedJob, type ScraperResult, delay } from './base';
import { PlaywrightBaseScraper } from './playwright-base';
import { matchHospital, matchHospitalByCounty, inferCounty, inferCountyFromRefCode } from './hospital-matcher';
import { getHospitalTier } from '@/lib/matchProbability';

/** Known Rezoomo employer pages with medical jobs */
const REZOOMO_SOURCES = [
  {
    name: 'CHI',
    url: 'https://www.rezoomo.com/company/childrens-health-ireland/jobs/',
    hospitalId: 'chi',
  },
  {
    name: 'Mater Hospital',
    url: 'https://www.rezoomo.com/company/mater-hospital/jobs/',
    hospitalId: 'mater',
  },
  {
    name: 'HSE South',
    url: 'https://www.rezoomo.com/company/hse-south/jobs/',
    hospitalId: 'cuh',
  },
  {
    name: 'HSE Mid West',
    url: 'https://www.rezoomo.com/company/hse-mid-west/jobs/',
    hospitalId: 'ulh',
  },
  {
    name: 'HSE Dublin North East',
    url: 'https://www.rezoomo.com/company/hse-community-healthcare-dublin-north-city-and-county/jobs/',
    hospitalId: 'beaumont',
  },
  {
    name: 'HSE West',
    url: 'https://www.rezoomo.com/company/community-healthcare-west/jobs/',
    hospitalId: 'uhg',
  },
  {
    name: 'National Maternity Hospital',
    url: 'https://www.rezoomo.com/company/the-national-maternity-hospital/jobs/',
    hospitalId: 'nmh',
  },
  {
    name: 'Ireland East',
    url: 'https://www.rezoomo.com/company/ireland-east-hospital-group/jobs/',
    hospitalId: 'stvincents',
  },
];

export class RezoomoScraper extends PlaywrightBaseScraper {
  constructor() {
    super('https://www.rezoomo.com', 'REZOOMO');
  }

  protected async doScrape(): Promise<ScraperResult> {
    const allJobs: ScrapedJob[] = [];

    for (const source of REZOOMO_SOURCES) {
      try {
        console.log(`Rezoomo: Scraping ${source.name}...`);
        const jobs = await this.scrapeEmployerPage(source);
        allJobs.push(...jobs);
        console.log(`Rezoomo ${source.name}: ${jobs.length} NCHD jobs`);
        await delay(3000); // Be respectful between employers
      } catch (error) {
        console.error(`Rezoomo error for ${source.name}:`, error);
      }
    }

    console.log(`Rezoomo scraper complete: ${allJobs.length} NCHD jobs found`);
    return this.createResult(allJobs);
  }

  private async scrapeEmployerPage(source: typeof REZOOMO_SOURCES[number]): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    await this.navigateTo(source.url, '.job-listing, .vacancy, [class*="job"]');
    await this.scrollToBottom();

    // Try clicking "Load More" buttons
    let loadMoreClicks = 0;
    while (loadMoreClicks < 5) {
      const clicked = await this.clickIfExists(
        'button[class*="load-more"], a[class*="load-more"], [class*="show-more"] button'
      );
      if (!clicked) break;
      loadMoreClicks++;
      await delay(2000);
    }

    const html = await this.getPageContent();
    const $ = cheerio.load(html);

    // Parse job listings
    $(
      '.job-listing, .vacancy, [class*="job-card"], [class*="job-item"], ' +
      'article, .search-result, [class*="listing"]'
    ).each((_, el) => {
      const $el = $(el);
      const job = this.parseRezoomoJob($, $el, source);
      if (job) jobs.push(job);
    });

    // Fallback: look for job links
    if (jobs.length === 0) {
      $('a[href*="/job/"], a[href*="/vacancy/"]').each((_, el) => {
        const $a = $(el);
        const title = this.cleanText($a.text());
        if (!title || title.length < 5 || !this.isNCHDJob(title)) return;

        let href = $a.attr('href') || '';
        if (!href.startsWith('http')) href = `https://www.rezoomo.com${href}`;

        const searchText = `${title} ${source.name}`;
        const county = inferCounty(searchText);
        const hospital = matchHospital(searchText)
          || matchHospitalByCounty(county)
          || this.resolveSourceHospital(source.hospitalId);
        const hospitalName = hospital?.name || source.name;

        jobs.push({
          title,
          grade: this.parseGrade(title),
          specialty: this.parseSpecialty(title),
          scheme_type: this.parseSchemeType(title),
          hospital_name: hospitalName,
          hospital_group: hospital?.hospitalGroup || 'IEHG',
          county: hospital?.county || county,
          application_deadline: this.defaultDeadline(),
          application_url: href,
          historical_centile_tier: getHospitalTier(hospitalName),
          source_url: href,
          source_platform: 'REZOOMO',
          scraped_at: new Date().toISOString(),
        });
      });
    }

    return jobs;
  }

  private parseRezoomoJob(
    $: cheerio.CheerioAPI,
    $el: cheerio.Cheerio<any>,
    source: typeof REZOOMO_SOURCES[number]
  ): ScrapedJob | null {
    const titleEl = $el.find('h2 a, h3 a, h4 a, a[class*="title"], h2, h3').first();
    const title = this.cleanText(titleEl.text());
    if (!title || title.length < 5 || !this.isNCHDJob(title)) return null;

    let url = titleEl.attr('href') || $el.find('a').first().attr('href') || '';
    if (url && !url.startsWith('http')) url = `https://www.rezoomo.com${url}`;

    const locationText = $el.find('[class*="location"], [class*="county"]').text();
    // Include source name and title for better county/hospital inference
    const searchText = `${title} ${locationText} ${source.name}`;
    const county = inferCounty(searchText);

    const deadlineText = $el.find('[class*="date"], [class*="deadline"], time').text();
    const deadline = this.extractDate(deadlineText) || this.defaultDeadline();

    // Try text matching first, then fall back to the source's known hospitalId
    const hospital = matchHospital(searchText)
      || matchHospitalByCounty(county)
      || this.resolveSourceHospital(source.hospitalId);
    const hospitalName = hospital?.name || source.name;

    return {
      title,
      grade: this.parseGrade(title),
      specialty: this.parseSpecialty(title),
      scheme_type: this.parseSchemeType(title),
      hospital_name: hospitalName,
      hospital_group: hospital?.hospitalGroup || 'IEHG',
      county: hospital?.county || county,
      application_deadline: deadline,
      application_url: url,
      historical_centile_tier: getHospitalTier(hospitalName),
      source_url: url || source.url,
      source_platform: 'REZOOMO',
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

  /** Resolve hospital from the source config's hospitalId */
  private resolveSourceHospital(hospitalId: string): ReturnType<typeof matchHospital> {
    return matchHospital(hospitalId);
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
