# MedMatch-IE Job Scraper System

This document explains how to use the job scraping system to populate MedMatch-IE with real Irish medical job listings.

## Overview

The scraper system automatically collects NCHD (SHO/Registrar) job postings from multiple Irish medical job boards and aggregates them into a single unified database.

## Architecture

```
src/lib/scrapers/
├── base.ts           # Base scraper class and utilities
├── hse.ts            # HSE/about.hse.ie scraper
├── rezoomo.ts        # Rezoomo scraper (coming soon)
└── orchestrator.ts   # Coordinates all scrapers

src/app/api/scrape/
└── route.ts          # API endpoint to trigger scraping

src/components/
└── ScraperAdmin.tsx  # Admin UI for manual scraping
```

## Current Data Sources

### ✅ Implemented

1. **about.hse.ie** (HSE Official Job Portal)
   - Official HSE medical and dental job listings
   - ~92 current postings
   - Includes SHO, Registrar, and Specialist Registrar positions
   - Provides job reference codes, counties, and posting dates

### 🚧 Planned

2. **Rezoomo** (HSE Regional Portals)
   - HSE Dublin and North East
   - HSE South (Cork)
   - HSE West and North West (Galway)
   - HSE Mid West

3. **Global Medics** (Recruitment Agency)
4. **DoctorJobs.ie** (NCHD Job Board)
5. **IrishJobs.ie** (NCHD Filter)

## Usage

### Method 1: Manual Scraping via UI

1. Add the `ScraperAdmin` component to your dashboard or create an admin page:

```tsx
import ScraperAdmin from '@/components/ScraperAdmin';

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <ScraperAdmin />
    </div>
  );
}
```

2. Click "Start Scraping" to trigger the scraper
3. View results including jobs scraped, duplicates removed, and any errors

### Method 2: API Endpoint

**Scrape all sources:**
```bash
curl -X POST http://localhost:3000/api/scrape
```

**Scrape specific source:**
```bash
curl -X POST "http://localhost:3000/api/scrape?scraper=HSE"
```

**Get scraper info:**
```bash
curl http://localhost:3000/api/scrape
```

### Method 3: Programmatic Usage

```typescript
import { getOrchestrator } from '@/lib/scrapers/orchestrator';

// Scrape all sources
const orchestrator = getOrchestrator();
const result = await orchestrator.scrapeAll();

// Scrape specific source
const hseResult = await orchestrator.scrapeSingle('HSE');
```

## Features

### Automatic Deduplication

Jobs are deduplicated based on:
- Job title
- Hospital name
- Application deadline

This ensures the same job listed on multiple platforms only appears once.

### Smart Parsing

The scrapers automatically extract and normalize:
- **Grade**: SHO, Registrar, or Specialist Registrar
- **Specialty**: General Medicine, Surgery, Anaesthesia, etc.
- **Scheme Type**: Training (BST/HST/IST) or Non-Training
- **Hospital**: Matched to our hospital database by county
- **Deadline**: Parsed from various date formats

### Rate Limiting

Scrapers include built-in delays (2-3 seconds between requests) to be respectful to source websites and avoid overwhelming their servers.

## Data Storage

Scraped jobs are stored in:
- **Browser**: localStorage (for demo/development)
- **Production**: Supabase database (when configured)

Data is automatically merged with existing jobs and deduplicated on each scrape.

## Scheduling

### Vercel Cron (Recommended for Production)

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/scrape",
    "schedule": "0 2 * * *"
  }]
}
```

This runs the scraper daily at 2 AM UTC.

### Manual Scheduling

For development or self-hosted deployments, set up a cron job:

```bash
# Run daily at 2 AM
0 2 * * * curl -X POST https://your-app.vercel.app/api/scrape
```

## Security

For production deployments, protect the scraping endpoint with an API key:

1. Set environment variable:
```bash
SCRAPER_API_KEY=your-secret-key-here
```

2. Call with Authorization header:
```bash
curl -X POST https://your-app.vercel.app/api/scrape \
  -H "Authorization: Bearer your-secret-key-here"
```

## Extending the System

### Adding a New Scraper

1. Create a new scraper class extending `BaseScraper`:

```typescript
// src/lib/scrapers/my-scraper.ts
import { BaseScraper, ScrapedJob, ScraperResult } from './base';

export class MyScra per extends BaseScraper {
  constructor() {
    super('https://example.com', 'MY_PLATFORM');
  }

  async scrape(): Promise<ScraperResult> {
    // Your scraping logic here
    const jobs: ScrapedJob[] = [];

    // ... scrape and parse jobs ...

    return this.createResult(jobs);
  }
}
```

2. Register it in the orchestrator:

```typescript
// src/lib/scrapers/orchestrator.ts
import { MyScraper } from './my-scraper';

constructor() {
  this.scrapers.set('HSE', new HSEScraper());
  this.scrapers.set('MyScraper', new MyScraper()); // Add here
}
```

## Limitations & Known Issues

1. **HTML Structure Changes**: Scrapers may break if source websites change their HTML structure. Monitor errors and update scrapers accordingly.

2. **JavaScript-Rendered Sites**: Sites like Rezoomo use client-side React rendering, which requires browser automation (Playwright) rather than simple HTTP requests.

3. **Rate Limits**: Some sites may rate-limit or block automated scraping. Respect robots.txt and use appropriate delays.

4. **Data Quality**: Scraped data requires normalization and validation. Not all fields can be automatically extracted from all sources.

## Troubleshooting

**Scraper returns 0 jobs:**
- Check if the source website structure has changed
- Verify the website is accessible
- Check console logs for parsing errors

**Duplicate jobs appearing:**
- Ensure deduplication logic is running
- Check if job titles/hospitals are being normalized correctly

**Scraping times out:**
- Reduce the number of pages scraped
- Increase the timeout in `src/app/api/scrape/route.ts`
- Run specific scrapers instead of all at once

## Future Enhancements

- [ ] Playwright integration for JavaScript-heavy sites (Rezoomo)
- [ ] Scrape job detail pages for PDF URLs and contact info
- [ ] Email notifications when new jobs matching user preferences are found
- [ ] Historical job data tracking and analytics
- [ ] Machine learning for better job categorization

## Support

For issues or questions about the scraper system:
1. Check the console logs for error messages
2. Review the source website's HTML structure
3. Test the scraper with a single page first
4. Open an issue on GitHub with scraper logs and error details
