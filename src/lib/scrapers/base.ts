/**
 * Base Scraper Infrastructure for MedMatch-IE
 * Common utilities and types for web scraping Irish medical job boards
 */

import type { Job, SpecialtyType, SchemeType, HospitalGroup, HospitalTier } from '@/types/database.types';

export interface ScrapedJob {
  title: string;
  grade: 'SHO' | 'REGISTRAR' | 'SPECIALIST_REGISTRAR';
  specialty: SpecialtyType;
  scheme_type: SchemeType;
  hospital_name: string;
  hospital_group: HospitalGroup;
  county: string;
  application_deadline: string;
  application_url?: string;
  job_spec_pdf_url?: string;
  informal_enquiries_email?: string;
  informal_enquiries_name?: string;
  informal_contact_email?: string;
  medical_manpower_email?: string;
  clinical_lead?: string;
  rotational_detail?: string;
  salary_range?: string;
  hours_per_week?: number;
  on_call?: boolean;
  historical_centile_tier?: HospitalTier;
  source_url: string;
  source_platform: 'HSE_NRS' | 'REZOOMO' | 'ABOUT_HSE' | 'HEALTHCARE_JOBS' | 'GLOBAL_MEDICS' | 'DOCTOR_JOBS' | 'IRISH_JOBS' | 'DIRECT_HOSPITAL';
  scraped_at: string;
}

export interface ScraperResult {
  jobs: ScrapedJob[];
  success: boolean;
  error?: string;
  scraped_at: string;
  job_count: number;
}

/**
 * Base scraper class with common functionality
 */
export abstract class BaseScraper {
  protected baseUrl: string;
  protected platformName: ScrapedJob['source_platform'];

  constructor(baseUrl: string, platformName: ScrapedJob['source_platform']) {
    this.baseUrl = baseUrl;
    this.platformName = platformName;
  }

  /**
   * Main scraping method - to be implemented by each scraper
   */
  abstract scrape(): Promise<ScraperResult>;

  /**
   * Parse grade from job title or description
   */
  protected parseGrade(title: string, description?: string): ScrapedJob['grade'] {
    const text = `${title} ${description || ''}`.toLowerCase();

    if (text.includes('specialist registrar') || text.includes('spr')) {
      return 'SPECIALIST_REGISTRAR';
    }
    if (text.includes('registrar') || text.includes('reg ')) {
      return 'REGISTRAR';
    }
    if (text.includes('sho') || text.includes('senior house officer')) {
      return 'SHO';
    }

    // Default to SHO if unclear
    return 'SHO';
  }

  /**
   * Parse specialty from job title or description
   */
  protected parseSpecialty(title: string, description?: string): SpecialtyType {
    const text = `${title} ${description || ''}`.toLowerCase();

    // Specific specialties checked first
    const specificSpecialties: [string, SpecialtyType][] = [
      ['emergency medicine', 'EMERGENCY_MEDICINE'],
      ['a&e', 'EMERGENCY_MEDICINE'],
      ['anaesthesia', 'ANAESTHETICS'],
      ['anaesthetic', 'ANAESTHETICS'],
      ['paediatric', 'PAEDIATRICS'],
      ['paediatrics', 'PAEDIATRICS'],
      ['obstetrics', 'OBSTETRICS_GYNAECOLOGY'],
      ['gynaecology', 'OBSTETRICS_GYNAECOLOGY'],
      ['psychiatry', 'PSYCHIATRY'],
      ['radiology', 'RADIOLOGY'],
      ['pathology', 'PATHOLOGY'],
      ['cardiology', 'CARDIOLOGY'],
      ['respiratory', 'RESPIRATORY'],
      ['gastroenterology', 'GASTROENTEROLOGY'],
      ['endocrinology', 'ENDOCRINOLOGY'],
      ['neurology', 'NEUROLOGY'],
      ['dermatology', 'DERMATOLOGY'],
      ['orthopaedic', 'ORTHOPAEDICS'],
      ['urology', 'UROLOGY'],
      ['otolaryngology', 'ENT'],
      ['ear nose', 'ENT'],
      ['oncology', 'ONCOLOGY'],
      ['ophthalmology', 'OPHTHALMOLOGY'],
    ];

    for (const [keyword, specialty] of specificSpecialties) {
      if (text.includes(keyword)) {
        return specialty;
      }
    }

    // Word-boundary check for 'ENT' — before generic fallbacks so
    // "ENT Surgery" matches ENT, not GENERAL_SURGERY
    if (/\bent\b/.test(text)) {
      return 'ENT';
    }

    // Generic fallbacks
    const genericFallbacks: [string, SpecialtyType][] = [
      ['general medicine', 'GENERAL_MEDICINE'],
      ['general surgery', 'GENERAL_SURGERY'],
      ['emergency', 'EMERGENCY_MEDICINE'],
      ['medicine', 'GENERAL_MEDICINE'],
      ['surgery', 'GENERAL_SURGERY'],
    ];

    for (const [keyword, specialty] of genericFallbacks) {
      if (text.includes(keyword)) {
        return specialty;
      }
    }

    return 'GENERAL_MEDICINE'; // Default
  }

  /**
   * Parse scheme type from job title or description
   */
  protected parseSchemeType(title: string, description?: string): SchemeType {
    const text = `${title} ${description || ''}`.toLowerCase();

    if (text.includes('bst') || text.includes('basic specialist training')) {
      return 'TRAINING_BST';
    }
    if (text.includes('hst') || text.includes('higher specialist training')) {
      return 'TRAINING_HST';
    }
    if (text.includes('training')) {
      return 'TRAINING_BST'; // Default to BST if training mentioned
    }
    if (text.includes('stand alone') || text.includes('standalone')) {
      return 'STAND_ALONE';
    }

    return 'NON_TRAINING_SERVICE';
  }

  /**
   * Parse deadline from various date formats
   */
  protected parseDeadline(dateString: string): string {
    try {
      // Handle common Irish date formats
      const formats = [
        /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{4})-(\d{2})-(\d{2})/,
      ];

      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }

      return new Date().toISOString(); // Fallback to now if parsing fails
    } catch {
      return new Date().toISOString();
    }
  }

  /**
   * Clean and normalize text
   */
  protected cleanText(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
  }

  /**
   * Create base result object
   */
  protected createResult(jobs: ScrapedJob[], error?: string): ScraperResult {
    return {
      jobs,
      success: !error,
      error,
      scraped_at: new Date().toISOString(),
      job_count: jobs.length,
    };
  }
}

/**
 * Utility function to delay execution (for rate limiting)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for scraping operations
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await delay(delayMs * (i + 1)); // Exponential backoff
      }
    }
  }

  throw lastError;
}
