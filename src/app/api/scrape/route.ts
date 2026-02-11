/**
 * API Route: Job Scraping
 * Triggers job scraping from various Irish medical job boards.
 *
 * POST /api/scrape — Manual trigger (from admin UI or curl)
 * GET  /api/scrape — Vercel cron trigger (daily at 2 AM UTC) or info endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrchestrator } from '@/lib/scrapers/orchestrator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for Vercel serverless functions

/**
 * POST /api/scrape
 * Trigger job scraping manually
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

    const orchestrator = getOrchestrator();

    let result;
    if (scraperName) {
      const scraperResult = await orchestrator.scrapeSingle(scraperName);
      result = {
        total_jobs_scraped: scraperResult.job_count,
        total_jobs_saved: scraperResult.job_count,
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
 * Vercel cron endpoint — triggers scraping when called by cron.
 * Also serves as info endpoint when called without cron auth.
 */
export async function GET(request: NextRequest) {
  try {
    // Check if this is a Vercel cron invocation
    const authHeader = request.headers.get('Authorization');
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    // Vercel also sets this header for cron jobs
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';

    if (isCron || isVercelCron) {
      // This is a cron trigger — run the scrapers
      console.log('Cron-triggered scraping started');
      const orchestrator = getOrchestrator();
      const result = await orchestrator.scrapeAll();

      return NextResponse.json({
        success: true,
        message: `Cron scrape: ${result.total_jobs_scraped} jobs from ${result.scrapers_run.length} source(s)`,
        data: result,
      });
    }

    // Not a cron call — just return scraper info
    const orchestrator = getOrchestrator();
    const scrapers = orchestrator.getScraperInfo();

    return NextResponse.json({
      success: true,
      scrapers,
      message: `${scrapers.length} scraper(s) available. Use POST to trigger scraping.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
