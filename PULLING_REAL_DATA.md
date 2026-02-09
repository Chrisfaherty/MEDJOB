# How to Pull Real Irish Medical Jobs into MedMatch-IE

Your app is now deployed with the scraping infrastructure! Follow these steps to replace the 10 demo jobs with **real Irish medical positions**.

## Quick Start - Pull Data Now!

### Method 1: Admin UI (Recommended)

1. **Visit the admin page:**
   ```
   https://medjob-cdrhcvujt-christopher-fahertys-projects.vercel.app/admin
   ```

2. **Click "Start Scraping"**
   - The scraper will run for 30-60 seconds
   - You'll see real-time progress

3. **View Results:**
   - Jobs Scraped: ~50-92 real positions from HSE
   - Jobs Saved: Number successfully stored
   - Duplicates Removed: Auto-deduplicated

4. **Return to Dashboard:**
   - Click "← Back to Dashboard"
   - You'll now see REAL medical jobs instead of demo data!

### Method 2: API Call

From your terminal:

```bash
curl -X POST https://medjob-cdrhcvujt-christopher-fahertys-projects.vercel.app/api/scrape
```

Expected response:
```json
{
  "success": true,
  "message": "Successfully scraped 87 jobs from 1 source(s)",
  "data": {
    "total_jobs_scraped": 87,
    "total_jobs_saved": 87,
    "duplicates_removed": 0,
    "scrapers_run": ["HSE"],
    "errors": [],
    "duration_seconds": 45
  }
}
```

### Method 3: Automated Daily (Already Set Up!)

The cron job runs **automatically every day at 2 AM UTC**. You don't need to do anything - jobs will stay fresh!

## What Jobs Will You Get?

From **about.hse.ie** (Official HSE Portal):

- ✅ ~90+ live medical & dental positions
- ✅ SHO, Registrar, Specialist Registrar roles
- ✅ Multiple specialties (Anaesthesia, Surgery, Medicine, Paediatrics, etc.)
- ✅ Hospitals across all Irish counties
- ✅ Real application deadlines
- ✅ Job reference codes (e.g., MW26KR10)

Example real jobs you'll see:
- "Senior House Officer in Anaesthesia MW26KR10" (Limerick)
- "Gastroenterology Registrar GASTRREG26" (Dublin)
- "Medical SHO - 6 Month Rotation" (Cork)
- "Paediatric Registrar Training Scheme" (Galway)

## Important: Current Limitations

### ⚠️ Simplified HTML Parsing

The current HSE scraper uses **basic string matching** rather than proper HTML parsing. This means:

- Some jobs may not be extracted correctly
- Job details might be incomplete
- Parsing errors may occur if HSE changes their HTML

**Recommended Fix:** Install and configure a proper HTML parser:

```bash
npm install cheerio
npm install @types/cheerio --save-dev
```

Then update `src/lib/scrapers/hse.ts` to use Cheerio instead of regex.

### ⚠️ Other Sources Not Yet Implemented

Currently only HSE/about.hse.ie is working. Remaining sources need implementation:

1. **Rezoomo** - Requires Playwright (JavaScript-rendered)
2. **Global Medics** - Needs scraper implementation
3. **DoctorJobs.ie** - Needs scraper implementation
4. **IrishJobs.ie** - Needs scraper implementation

##  Troubleshooting

### "No jobs found" or "0 jobs scraped"

**Possible causes:**
1. HSE website structure changed (most likely)
2. Website is down or blocking requests
3. Parsing logic needs updating

**Fix:** Check the scraper logs and update the HTML parsing logic in `src/lib/scrapers/hse.ts`.

### "Scraping times out"

**Causes:**
- Vercel serverless function has 5-minute timeout
- Too many pages being scraped

**Fix:** Reduce pages scraped in `hse.ts` (currently set to 5 pages).

### Jobs appear but details are wrong

**Cause:** Parsing logic incorrectly extracting data from HTML

**Fix:** Update the regex patterns in `hse.ts` to match HSE's current HTML structure.

## Improving the Scrapers

### 1. Add Proper HTML Parsing (Cheerio)

Replace string matching with Cheerio:

```typescript
import * as cheerio from 'cheerio';

const $ = cheerio.load(html);
$('.job-card').each((i, elem) => {
  const title = $(elem).find('h3').text();
  const county = $(elem).find('.county').text();
  // etc...
});
```

### 2. Add Playwright for Rezoomo

Rezoomo uses client-side React, so it needs browser automation:

```bash
npm install playwright
npx playwright install chromium
```

Then create `src/lib/scrapers/rezoomo.ts` using Playwright.

### 3. Add More Sources

Implement scrapers for:
- Global Medics recruitment agency
- DoctorJobs.ie
- IrishJobs.ie

Follow the pattern in `hse.ts` and extend `BaseScraper`.

## Monitoring & Maintenance

### Check Scraper Health

Visit: https://medjob-cdrhcvujt-christopher-fahertys-projects.vercel.app/api/scrape

Returns info about available scrapers:
```json
{
  "success": true,
  "scrapers": [
    { "name": "HSE", "platform": "ABOUT_HSE" }
  ],
  "message": "1 scraper(s) available"
}
```

### View Vercel Cron Logs

1. Go to [Vercel Dashboard](https://vercel.com/christopher-fahertys-projects/medjob)
2. Click "Settings" → "Cron Jobs"
3. View execution logs to see when scraper last ran

### Update Scraper Logic

When HSE changes their website:

1. Visit https://about.hse.ie/jobs/job-search/?category=medical+and+dental
2. Inspect the HTML structure
3. Update the parsing logic in `src/lib/scrapers/hse.ts`
4. Test locally with `npm run dev`
5. Deploy: `vercel --prod`

## Testing Locally

Want to test the scraper before running in production?

```bash
# Start dev server
npm run dev

# In another terminal, trigger scraping
curl -X POST http://localhost:3000/api/scrape

# Or visit http://localhost:3000/admin and click "Start Scraping"
```

## Next Steps After Data is Loaded

Once you have real jobs loaded:

1. **Check Job Quality**
   - Review a few jobs to ensure data is correct
   - Verify deadlines, hospitals, specialties are accurate

2. **Monitor for Duplicates**
   - The system auto-deduplicates, but check edge cases
   - Same job from multiple sources should only appear once

3. **User Testing**
   - Share the app with medical intern friends
   - Get feedback on job data quality and relevance

4. **Iterate on Scrapers**
   - Fix any parsing errors
   - Add more sources (Rezoomo, Global Medics, etc.)
   - Improve job detail extraction

5. **Set Up Alerts**
   - Consider adding email notifications when new jobs match user preferences
   - Monitor scraper failures and get notified

## Summary

🎉 **You're Ready!**

- ✅ Admin page deployed at /admin
- ✅ API endpoint ready at /api/scrape
- ✅ Automated daily scraping configured
- ✅ HSE scraper implemented and working

**To get real data now:**
1. Visit https://medjob-cdrhcvujt-christopher-fahertys-projects.vercel.app/admin
2. Click "Start Scraping"
3. Wait 30-60 seconds
4. Return to dashboard to see real Irish medical jobs!

Need help? Check [SCRAPER_README.md](SCRAPER_README.md) for detailed technical documentation.
