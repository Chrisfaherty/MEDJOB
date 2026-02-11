/**
 * Playwright Base Scraper
 * Extended BaseScraper for JS-rendered sites that require a real browser.
 * Used by Rezoomo, IrishJobs, and DoctorJobs scrapers.
 *
 * NOTE: Playwright scrapers cannot run on Vercel (chromium binary is too large).
 * They run via GitHub Actions on a schedule and save directly to Supabase.
 */

import { BaseScraper, type ScrapedJob, type ScraperResult, delay } from './base';

// Dynamic import — Playwright is only available in the GitHub Actions environment
let chromium: any;
let Browser: any;

async function launchBrowser() {
  try {
    const pw = await import('playwright');
    const browser = await pw.chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    return browser;
  } catch (error) {
    throw new Error(
      'Playwright is not available. Playwright-based scrapers only run in GitHub Actions. ' +
      `Error: ${(error as Error).message}`
    );
  }
}

export abstract class PlaywrightBaseScraper extends BaseScraper {
  protected browser: any = null;
  protected page: any = null;

  /**
   * Initialize browser and page
   */
  protected async initBrowser(): Promise<void> {
    this.browser = await launchBrowser();
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1280, height: 800 });
  }

  /**
   * Clean up browser resources
   */
  protected async closeBrowser(): Promise<void> {
    if (this.page) {
      await this.page.close().catch(() => {});
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }

  /**
   * Navigate to a URL and wait for the page to load
   */
  protected async navigateTo(url: string, waitFor?: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    if (waitFor) {
      await this.page.waitForSelector(waitFor, { timeout: 15000 }).catch(() => {
        console.warn(`Selector "${waitFor}" not found on ${url}, continuing anyway`);
      });
    }
  }

  /**
   * Get page HTML content
   */
  protected async getPageContent(): Promise<string> {
    return await this.page.content();
  }

  /**
   * Scroll to bottom to trigger lazy-loaded content
   */
  protected async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await delay(2000);
  }

  /**
   * Click a button/link if it exists
   */
  protected async clickIfExists(selector: string): Promise<boolean> {
    const el = await this.page.$(selector);
    if (el) {
      await el.click();
      await delay(1500);
      return true;
    }
    return false;
  }

  /**
   * Wrapper that handles browser lifecycle
   */
  async scrape(): Promise<ScraperResult> {
    try {
      await this.initBrowser();
      const result = await this.doScrape();
      return result;
    } catch (error) {
      console.error(`${this.platformName} scraper error:`, error);
      return this.createResult([], (error as Error).message);
    } finally {
      await this.closeBrowser();
    }
  }

  /**
   * Actual scraping logic — implemented by each Playwright scraper
   */
  protected abstract doScrape(): Promise<ScraperResult>;
}
