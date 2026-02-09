/**
 * API Route: Job Scraping
 * Triggers job scraping from various Irish medical job boards
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrchestrator } from '@/lib/scrapers/orchestrator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for Vercel serverless functions

/**
 * POST /api/scrape
 * Trigger job scraping
 *
 * Query params:
 * - scraper: Optional. Name of specific scraper to run (e.g., "HSE"). Runs all if not specified.
 * - dry_run: Optional. If "true", scrapes but doesn't save to database.
 *
 * Headers:
 * - Authorization: Optional API key for security (recommended for production)
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Check for API key in production
    const apiKey = request.headers.get('Authorization');
    if (process.env.SCRAPER_API_KEY && apiKey !== `Bearer ${process.env.SCRAPER_API_KEY}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid API key.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const scraperName = searchParams.get('scraper');
    const dryRun = searchParams.get('dry_run') === 'true';

    const orchestrator = getOrchestrator();

    // Run specific scraper or all scrapers
    let result;
    if (scraperName) {
      const scraperResult = await orchestrator.scrapeSingle(scraperName);
      result = {
        total_jobs_scraped: scraperResult.job_count,
        total_jobs_saved: dryRun ? 0 : scraperResult.job_count,
        duplicates_removed: 0,
        scrapers_run: [scraperName],
        errors: scraperResult.error ? [scraperResult.error] : [],
        scrape_started_at: scraperResult.scraped_at,
        scrape_completed_at: scraperResult.scraped_at,
        duration_seconds: 0,
      };
    } else {
      result = await orchestrator.scrapeAll();
    }

    return NextResponse.json({
      success: true,
      message: `Successfully scraped ${result.total_jobs_scraped} jobs from ${result.scrapers_run.length} source(s)`,
      data: result,
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Scraping failed',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scrape
 * Get information about available scrapers
 */
export async function GET() {
  try {
    const orchestrator = getOrchestrator();
    const scrapers = orchestrator.getScraperInfo();

    return NextResponse.json({
      success: true,
      scrapers,
      message: `${scrapers.length} scraper(s) available`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get scraper info',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
