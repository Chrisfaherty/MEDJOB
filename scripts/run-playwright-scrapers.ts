/**
 * Script to run Playwright-based scrapers.
 * Executed by GitHub Actions workflow — not meant for Vercel deployment.
 *
 * Usage: npx tsx scripts/run-playwright-scrapers.ts
 */

import { getOrchestrator } from '../src/lib/scrapers/orchestrator';

async function main() {
  console.log('=== Playwright Scrapers Runner ===');
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('');

  const orchestrator = getOrchestrator();

  // Register Playwright scrapers
  console.log('Registering Playwright scrapers...');
  await orchestrator.registerPlaywrightScrapers();

  // Run all scrapers (fetch-based + Playwright)
  console.log('Running all scrapers...');
  const result = await orchestrator.scrapeAll();

  console.log('');
  console.log('=== Results ===');
  console.log(`Scrapers run: ${result.scrapers_run.join(', ')}`);
  console.log(`Total jobs scraped: ${result.total_jobs_scraped}`);
  console.log(`Total jobs saved: ${result.total_jobs_saved}`);
  console.log(`Duplicates removed: ${result.duplicates_removed}`);
  console.log(`Duration: ${result.duration_seconds}s`);

  if (result.errors.length > 0) {
    console.log('');
    console.log('Errors:');
    result.errors.forEach(e => console.log(`  - ${e}`));
  }

  console.log('');
  console.log(`Completed at: ${new Date().toISOString()}`);

  // Exit with error code if no jobs were saved
  if (result.total_jobs_saved === 0 && result.total_jobs_scraped === 0) {
    console.error('No jobs scraped or saved — something is wrong');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
