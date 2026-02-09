/**
 * HSE Job Scraper (about.hse.ie)
 * Scrapes medical and dental jobs from the official HSE job portal
 */

import { BaseScraper, type ScrapedJob, type ScraperResult, delay } from './base';
import hospitalsData from '@/data/hospitals.json';

const hospitals = hospitalsData.hospitals;

export class HSEScraper extends BaseScraper {
  private readonly medicalJobsUrl = 'https://about.hse.ie/jobs/job-search/?category=medical+and+dental';

  constructor() {
    super('https://about.hse.ie', 'ABOUT_HSE');
  }

  async scrape(): Promise<ScraperResult> {
    try {
      const jobs: ScrapedJob[] = [];

      // Scrape multiple pages (HSE shows 10 jobs per page, we'll get first 5 pages = 50 jobs)
      for (let page = 1; page <= 5; page++) {
        const pageUrl = `${this.medicalJobsUrl}&page=${page}`;
        const pageJobs = await this.scrapePage(pageUrl);
        jobs.push(...pageJobs);

        // Rate limiting - be respectful
        await delay(2000);
      }

      return this.createResult(jobs);
    } catch (error) {
      return this.createResult([], (error as Error).message);
    }
  }

  private async scrapePage(url: string): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    try {
      const response = await fetch(url);
      const html = await response.text();

      // Parse HTML using simple string matching (in production, use a proper HTML parser like cheerio)
      const jobMatches = this.extractJobListings(html);

      for (const jobData of jobMatches) {
        try {
          const job = await this.parseJobListing(jobData, url);
          if (job) {
            jobs.push(job);
          }
        } catch (error) {
          console.error('Error parsing job:', error);
          // Continue with other jobs
        }
      }
    } catch (error) {
      console.error(`Error scraping page ${url}:`, error);
    }

    return jobs;
  }

  private extractJobListings(html: string): Array<{
    title: string;
    url: string;
    county: string;
    posted: string;
  }> {
    const listings: Array<{ title: string; url: string; county: string; posted: string }> = [];

    // Extract job cards using regex patterns
    // Pattern: /jobs/job-search/[job-slug]/
    const urlPattern = /\/jobs\/job-search\/([^"\/]+)\//g;
    const urls = Array.from(html.matchAll(urlPattern)).map(m => ({
      slug: m[1],
      url: `https://about.hse.ie/jobs/job-search/${m[1]}/`
    }));

    // Extract titles (simplified - in production use proper HTML parsing)
    const titlePattern = /<h3[^>]*>([^<]+)<\/h3>/g;
    const titles = Array.from(html.matchAll(titlePattern)).map(m => m[1].trim());

    // Extract counties
    const countyPattern = /<span[^>]*>County:<\/span>\s*<span[^>]*>([^<]+)<\/span>/g;
    const counties = Array.from(html.matchAll(countyPattern)).map(m => m[1].trim());

    // Extract posted dates
    const datePattern = /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/g;
    const dates = Array.from(html.matchAll(datePattern)).map(m => m[1]);

    // Combine the extracted data
    const count = Math.min(urls.length, titles.length);
    for (let i = 0; i < count; i++) {
      listings.push({
        title: titles[i] || '',
        url: urls[i]?.url || '',
        county: counties[i] || 'Dublin', // Default to Dublin if not found
        posted: dates[i] || new Date().toISOString(),
      });
    }

    return listings;
  }

  private async parseJobListing(
    jobData: { title: string; url: string; county: string; posted: string },
    sourceUrl: string
  ): Promise<ScrapedJob | null> {
    // Determine if this is a relevant NCHD job
    const title = jobData.title.toLowerCase();
    if (
      !title.includes('sho') &&
      !title.includes('registrar') &&
      !title.includes('senior house officer') &&
      !title.includes('nchd')
    ) {
      return null; // Skip non-NCHD jobs
    }

    // Find matching hospital from our database
    const hospital = this.findHospitalByCounty(jobData.county);

    // Extract reference code from title (e.g., "MW26KR10")
    const refMatch = jobData.title.match(/[A-Z]{2}\d{2}[A-Z]{2}\d{2}/);
    const referenceCode = refMatch ? refMatch[0] : '';

    // Calculate deadline (HSE jobs typically have 2-3 week application windows)
    const postedDate = new Date(jobData.posted);
    const deadline = new Date(postedDate);
    deadline.setDate(deadline.getDate() + 21); // 3 weeks from posting

    return {
      title: jobData.title,
      grade: this.parseGrade(jobData.title),
      specialty: this.parseSpecialty(jobData.title),
      scheme_type: this.parseSchemeType(jobData.title),
      hospital_name: hospital?.name || 'HSE Facility',
      hospital_group: (hospital?.hospitalGroup as any) || 'IEHG',
      county: jobData.county,
      application_deadline: deadline.toISOString(),
      application_url: jobData.url,
      job_spec_pdf_url: undefined, // Would need to visit detail page to get this
      source_url: sourceUrl,
      source_platform: 'ABOUT_HSE',
      scraped_at: new Date().toISOString(),
    };
  }

  private findHospitalByCounty(county: string) {
    return hospitals.find(h => h.county === county || h.location?.city === county);
  }

  /**
   * Fetch job details from individual job page
   * Call this separately if you need PDF URLs and full details
   */
  async fetchJobDetails(jobUrl: string): Promise<{
    pdfUrl?: string;
    informalEnquiriesEmail?: string;
    informalEnquiriesName?: string;
    clinicalLead?: string;
    rotationalDetail?: string;
    salaryRange?: string;
  }> {
    try {
      const response = await fetch(jobUrl);
      const html = await response.text();

      return {
        pdfUrl: this.extractPdfUrl(html),
        informalEnquiriesEmail: this.extractEmail(html),
        informalEnquiriesName: this.extractContactName(html),
        clinicalLead: this.extractClinicalLead(html),
        rotationalDetail: this.extractRotationalDetail(html),
        salaryRange: this.extractSalaryRange(html),
      };
    } catch (error) {
      console.error('Error fetching job details:', error);
      return {};
    }
  }

  private extractPdfUrl(html: string): string | undefined {
    const pdfMatch = html.match(/href="([^"]*\.pdf[^"]*)"/i);
    return pdfMatch ? pdfMatch[1] : undefined;
  }

  private extractEmail(html: string): string | undefined {
    const emailMatch = html.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return emailMatch ? emailMatch[1] : undefined;
  }

  private extractContactName(html: string): string | undefined {
    // Look for patterns like "Dr. Name" or "Contact: Name"
    const nameMatch = html.match(/(?:Dr\.?|Contact:)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    return nameMatch ? nameMatch[1] : undefined;
  }

  private extractClinicalLead(html: string): string | undefined {
    const leadMatch = html.match(/Clinical Lead:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
    return leadMatch ? leadMatch[1] : undefined;
  }

  private extractRotationalDetail(html: string): string | undefined {
    const rotationMatch = html.match(/Rotation:?\s*([^<\n]+)/i);
    return rotationMatch ? this.cleanText(rotationMatch[1]) : undefined;
  }

  private extractSalaryRange(html: string): string | undefined {
    const salaryMatch = html.match(/€([\d,]+)\s*-\s*€([\d,]+)/);
    return salaryMatch ? `€${salaryMatch[1]} - €${salaryMatch[2]}` : undefined;
  }
}
