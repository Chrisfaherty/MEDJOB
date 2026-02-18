# MedMatch-IE

**The all-in-one platform for Irish NCHD doctors to find jobs, track applications, and swap accommodation during hospital rotations.**

MedMatch-IE aggregates Non-Consultant Hospital Doctor (NCHD) job postings from across Ireland's health service, provides intelligent match probability ratings, automates informal enquiry contacts, and includes a peer-to-peer accommodation exchange for interns rotating between hospitals every 6 months.

![Dashboard Overview](docs/screenshots/dashboard-overview.png)

---

## Table of Contents

- [Features](#features)
  - [Job Aggregation & Smart Scraping](#1-job-aggregation--smart-scraping)
  - [Match Probability Engine](#2-match-probability-engine)
  - [Informal Enquiry Automation](#3-informal-enquiry-automation)
  - [Accommodation Exchange](#4-accommodation-exchange)
  - [Authentication & User Profiles](#5-authentication--user-profiles)
  - [Admin Panel](#6-admin-panel)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Deployment](#deployment)
- [Scraper Configuration](#scraper-configuration)
- [Project Structure](#project-structure)

---

## Features

### 1. Job Aggregation & Smart Scraping

MedMatch-IE automatically scrapes NCHD job postings from 4 Irish healthcare recruitment sources daily, deduplicates them, and presents them in a unified interface.

![Job Listings](docs/screenshots/job-listings.png)

**Sources scraped:**

| Source | Method | Schedule |
|--------|--------|----------|
| HSE (about.hse.ie) | Fetch + Cheerio | Daily 2 AM UTC (Vercel Cron) |
| HealthcareJobs.ie | Fetch + Cheerio | Daily 2 AM UTC (Vercel Cron) |
| Rezoomo | Playwright | Daily 3 AM UTC (GitHub Actions) |
| DoctorJobs.ie | Playwright | Daily 3 AM UTC (GitHub Actions) |

**Key capabilities:**
- Intelligent NCHD filtering (excludes consultant, nursing, and non-medical roles)
- Hospital matching via fuzzy search against 50+ Irish hospitals
- Automatic specialty and grade parsing from job titles
- Deduplication by normalised title + hospital + deadline
- Rate-limited requests (2-3s delays) to avoid blocking
- Stale job deactivation when postings disappear from source
- Batch upsert to Supabase (50 jobs per batch)
- Full logging of every scraper run

**Filtering & Search:**

![Filters Panel](docs/screenshots/filters-panel.png)

- Filter by **specialty** (20+ medical specialties)
- Filter by **hospital group** (IEHG, DMHG, RCSI, Saolta, SSWHG, MWHG, UL)
- Filter by **individual hospital** (50+ hospitals)
- Filter by **county**
- Filter by **scheme type** (BST, HST, Non-Training, Stand-alone)
- Free-text search across job title, hospital name, county, and clinical lead

---

### 2. Match Probability Engine

Enter your HSE exam centile and instantly see your match likelihood for every position. Each job is colour-coded based on the hospital's historical competitiveness.

![Match Probability](docs/screenshots/match-probability.png)

**Hospital tiers:**

| Tier | Centile Required | Examples |
|------|-----------------|----------|
| Top Tier | >70th | Mater, St Vincent's, Beaumont, Cork UH, Galway UH |
| Mid Tier | 40th-70th | Tallaght, Connolly, Sligo, Waterford |
| Safety Net | <40th | Letterkenny, Portiuncula, Mullingar |

**Match ratings:**
- **Likely Match** (green) - Your centile is above the typical cutoff
- **Competitive** (amber) - You're within the competitive range
- **Reach** (red) - Your centile is below the typical cutoff

Each rating includes a personalised strategic insight to help with application decisions.

---

### 3. Informal Enquiry Automation

Every job listing extracts and displays informal enquiry contact details. One click to email or call the clinical lead before applying.

![Job Detail View](docs/screenshots/job-detail.png)

**Contact extraction includes:**
- Informal enquiry email and name
- Clinical lead name
- Medical manpower / HR email
- Application URL and job spec PDF link

**Detail view features:**
- Full job specifications
- Application deadline with countdown timer (colour-coded urgency)
- Application status tracking (Not Applied / Applied / Interview / Shortlisted / Accepted / Rejected)
- Favourite/bookmark jobs
- Match probability badge with strategic advice
- One-click email with pre-filled enquiry template
- Copy email button

---

### 4. Accommodation Exchange

A peer-to-peer marketplace where interns can list and find accommodation near their rotation hospitals. Medical interns rotate every 6 months and need housing - this feature connects outgoing interns with incoming ones.

![Accommodation Section](docs/screenshots/accommodation-section.png)

**Listing features:**
- Room types: Entire Place, Private Room, Shared Room
- Rent per month with bills-included indicator
- Deposit amount
- Address, Eircode, and map location (OpenStreetMap embed)
- Linked to specific hospital for location context
- Availability dates (from/to) and minimum lease period
- Up to 6 photos with client-side compression (max 1200px, JPEG)
- Amenities: furnished, parking, WiFi, washer, dryer, dishwasher, garden, balcony, ensuite

**Browsing & filtering:**

![Accommodation Filters](docs/screenshots/accommodation-filters.png)

- Filter by county, room type, and max rent
- Search by hospital name, location, or description
- Photo thumbnail previews in listing cards

**Creating a listing:**

![Create Listing](docs/screenshots/create-listing.png)

- Full form with county/hospital dropdowns (auto-filtered from 50+ hospitals)
- Drag-and-drop photo upload with live previews
- Client-side image compression before upload
- Contact email pre-filled from user profile
- Validation for all required fields

**Enquiry system:**

![Accommodation Detail](docs/screenshots/accommodation-detail.png)

- Send enquiries directly to listing owners
- Email owner button with one-click mailto
- Copy email and call buttons
- Photo gallery with carousel navigation
- Posted-by attribution with date

---

### 5. Authentication & User Profiles

Secure authentication via Supabase Auth with email-based sign-up and role-based access control.

![Login Screen](docs/screenshots/login.png)

- Email + password sign-up/sign-in
- Magic link (passwordless) authentication
- Password reset via email
- Automatic user profile creation on sign-up
- Role-based access: `user` and `admin`
- Session persistence across browser refreshes
- PKCE OAuth flow for security
- Fallback localStorage mode for development without Supabase

---

### 6. Admin Panel

Protected admin area for managing scrapers and users.

![Admin Panel](docs/screenshots/admin-panel.png)

**Scraper management (`/admin`):**
- Manually trigger individual or all scrapers
- View results: jobs found, new jobs, duplicates removed, duration
- See warnings and errors from each run
- View scraping logs history

**User management (`/admin/users`):**

![User Management](docs/screenshots/user-management.png)

- View all registered users
- Promote/demote admin roles
- Delete users (cascades all related data)
- User statistics dashboard

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 19 |
| **Styling** | Tailwind CSS 4 |
| **Animations** | Framer Motion 12 |
| **Icons** | Lucide React |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage) |
| **State** | Zustand 5 + React Context |
| **Scraping** | Cheerio 1.2 (fetch-based) + Playwright 1.58 (browser-based) |
| **Date Handling** | date-fns 4 |
| **Hosting** | Vercel |
| **CI/CD** | GitHub Actions (Playwright scrapers) |

---

## Architecture

```
                                  +------------------+
                                  |   Vercel Cron    |
                                  |  (Daily 2 AM)   |
                                  +--------+---------+
                                           |
                              POST /api/scrape (fetch scrapers)
                                           |
+------------------+              +--------v---------+              +------------------+
| GitHub Actions   |              |    Next.js App   |              |    Supabase      |
| (Daily 3 AM)     +------------->|                  +------------->|                  |
| Playwright       |  run script  |  - Dashboard     |   Supabase   |  - PostgreSQL    |
| Scrapers         |              |  - Admin Panel   |   Client     |  - Auth          |
+------------------+              |  - API Routes    |              |  - Storage       |
                                  |  - Accommodation |              |  - RLS Policies  |
                                  +--------+---------+              +------------------+
                                           |
                                    Vercel Deploy
                                           |
                                  +--------v---------+
                                  |    Users         |
                                  |  (NCHD Doctors)  |
                                  +------------------+
```

**Dual scraping strategy:**
- **Vercel Cron** handles fetch-based scrapers (HSE, HealthcareJobs) that don't need a browser
- **GitHub Actions** handles Playwright scrapers (Rezoomo, DoctorJobs) that require browser rendering
- GitHub Actions runs 1 hour after Vercel Cron to avoid overlap

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- A [Supabase](https://supabase.com/) project (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/Chrisfaherty/MEDJOB.git
cd MEDJOB

# Install dependencies
npm install

# Copy environment template and add your Supabase credentials
cp .env.example .env.local

# Start development server
npm run dev
```

The app will be running at `http://localhost:3000`.

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase (required)
# Get these from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Admin emails (comma-separated) - auto-assigned admin role on sign-up
NEXT_PUBLIC_ADMIN_EMAILS=your-email@example.com

# Optional: force localStorage mode for testing without Supabase
NEXT_PUBLIC_USE_LOCAL_STORAGE_FALLBACK=false
```

For GitHub Actions (Playwright scrapers), add these as **repository secrets**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Database Setup

Run these migrations in order via the **Supabase SQL Editor** (Dashboard > SQL Editor > New Query):

### 1. Initial Schema

Run the contents of [`supabase/migrations/20260208_initial_schema.sql`](supabase/migrations/20260208_initial_schema.sql)

This creates:
- `jobs` table (NCHD postings)
- `user_profiles` table (user metadata + roles)
- `user_applications` table (application tracking)
- `user_favorites` table (bookmarked jobs)
- `user_preferences` table (saved filters)
- `scraping_logs` table (scraper run history)
- All RLS policies, indexes, and triggers

### 2. Accommodation Schema

Run the contents of [`supabase/migrations/20260210_accommodation.sql`](supabase/migrations/20260210_accommodation.sql)

This creates:
- `accommodation_listings` table
- `accommodation_inquiries` table
- RLS policies for listings and inquiries

### 3. Accommodation Fixes

Run the contents of [`supabase/migrations/20260210_accommodation_fix.sql`](supabase/migrations/20260210_accommodation_fix.sql)

This fixes:
- FK relationships for PostgREST joins (poster name display)
- Owner visibility for inactive listings

### 4. Storage Bucket

In the Supabase Dashboard:
1. Go to **Storage** > **New Bucket**
2. Name: `accommodation-photos`
3. Public bucket: **Yes**
4. File size limit: **5MB**
5. Allowed MIME types: `image/jpeg, image/png, image/webp`

Then add storage policies:
- **SELECT** (public read): Policy expression `true`
- **INSERT** (authenticated write): Policy expression `auth.role() = 'authenticated'`
- **DELETE** (owner only): Policy expression `auth.uid() = owner`

---

## Deployment

### Vercel (Frontend + Fetch Scrapers)

1. Connect your GitHub repository to [Vercel](https://vercel.com/)
2. Set environment variables in Vercel project settings
3. Deploy — Vercel auto-detects Next.js
4. The cron job (`vercel.json`) will auto-scrape fetch-based sources daily at 2 AM UTC

### GitHub Actions (Playwright Scrapers)

1. Add repository secrets (see [Environment Variables](#environment-variables))
2. The workflow at `.github/workflows/scrape.yml` runs daily at 3 AM UTC
3. Can also be triggered manually from the Actions tab

---

## Scraper Configuration

### Adding a New Scraper

1. Create a new file in `src/lib/scrapers/`
2. Extend `BaseScraper` (for fetch-based) or `PlaywrightBaseScraper` (for browser-based)
3. Implement the `scrape()` method
4. Register in `src/lib/scrapers/orchestrator.ts`

### Hospital Matching

The scraper uses fuzzy matching against `src/data/hospitals.json` which contains 50+ Irish hospitals with:
- Hospital ID, name, short name
- County and hospital group
- Intern training network
- Geo-coordinates

---

## Project Structure

```
medjob/
├── .github/
│   └── workflows/
│       └── scrape.yml              # GitHub Actions: Playwright scrapers
├── docs/
│   └── screenshots/                # README screenshots
├── scripts/
│   └── run-playwright-scrapers.ts  # Playwright scraper entry point
├── src/
│   ├── app/
│   │   ├── page.tsx                # Main dashboard (Jobs + Accommodation tabs)
│   │   ├── layout.tsx              # Root layout with AuthProvider
│   │   ├── globals.css             # Global styles + Apple HIG design tokens
│   │   ├── admin/
│   │   │   ├── page.tsx            # Scraper admin panel
│   │   │   └── users/
│   │   │       └── page.tsx        # User management
│   │   ├── api/
│   │   │   └── scrape/
│   │   │       └── route.ts        # Scraper API endpoint
│   │   └── auth/
│   │       ├── callback/
│   │       │   └── page.tsx        # OAuth PKCE callback handler
│   │       └── reset-password/
│   │           └── page.tsx        # Password reset form
│   ├── components/
│   │   ├── JobCard.tsx             # Job listing card with match badges
│   │   ├── DetailView.tsx          # Job detail right pane
│   │   ├── LoginModal.tsx          # Authentication modal
│   │   ├── ScraperAdmin.tsx        # Admin scraper trigger UI
│   │   └── accommodation/
│   │       ├── AccommodationSection.tsx   # Main two-pane layout
│   │       ├── AccommodationCard.tsx      # Listing card
│   │       ├── AccommodationDetail.tsx    # Detail view with photos + map
│   │       └── CreateListingModal.tsx     # Create listing form + photo upload
│   ├── contexts/
│   │   └── AuthContext.tsx          # Global auth state provider
│   ├── data/
│   │   └── hospitals.json          # 50+ Irish hospital reference data
│   ├── lib/
│   │   ├── auth.ts                 # Supabase auth service
│   │   ├── supabase.ts             # Database API layer (Jobs, Accommodation, etc.)
│   │   ├── localStorage.ts         # Fallback storage API
│   │   ├── matchProbability.ts     # Match rating engine
│   │   ├── emailTemplates.ts       # Contact email utilities
│   │   ├── deadlineNotifications.ts # Deadline urgency system
│   │   ├── pdfParser.ts            # Job spec PDF parser
│   │   └── scrapers/
│   │       ├── base.ts             # Base scraper class
│   │       ├── playwright-base.ts  # Playwright base class
│   │       ├── orchestrator.ts     # Scraper coordinator
│   │       ├── hospital-matcher.ts # Fuzzy hospital matching
│   │       ├── hse-scraper.ts      # HSE job scraper
│   │       ├── healthcarejobs-scraper.ts
│   │       ├── rezoomo-scraper.ts  # Playwright-based
│   │       └── doctorjobs-scraper.ts # Playwright-based
│   └── types/
│       └── database.types.ts       # TypeScript type definitions
├── supabase/
│   └── migrations/
│       ├── 20260208_initial_schema.sql     # Core tables + RLS
│       ├── 20260210_accommodation.sql      # Accommodation tables
│       └── 20260210_accommodation_fix.sql  # FK + RLS fixes
├── vercel.json                     # Vercel cron configuration
├── package.json
└── tsconfig.json
```

---

## Database Schema

```
┌──────────────────────┐     ┌──────────────────────┐
│       jobs           │     │    user_profiles      │
├──────────────────────┤     ├──────────────────────┤
│ id (PK)              │     │ id (PK, FK->auth)    │
│ title                │     │ email                │
│ grade                │     │ name                 │
│ specialty            │     │ role (user/admin)    │
│ hospital_name        │     │ centile              │
│ county               │     └──────────┬───────────┘
│ application_deadline │                │
│ source               │     ┌──────────┴───────────┐
│ is_active            │     │  user_applications   │
└──────────┬───────────┘     ├──────────────────────┤
           │                 │ job_id (FK->jobs)    │
           │                 │ user_id (FK->profiles)│
           │                 │ status               │
           │                 └──────────────────────┘
           │
┌──────────┴───────────┐     ┌──────────────────────────┐
│   user_favorites     │     │ accommodation_listings   │
├──────────────────────┤     ├──────────────────────────┤
│ user_id (FK)         │     │ id (PK)                  │
│ job_id (FK)          │     │ user_id (FK->profiles)   │
└──────────────────────┘     │ title, rent, county      │
                             │ hospital_id, hospital_name│
┌──────────────────────┐     │ photo_urls[], amenities[]│
│   scraping_logs      │     │ available_from/to        │
├──────────────────────┤     └──────────┬───────────────┘
│ source               │                │
│ status               │     ┌──────────┴───────────────┐
│ jobs_found           │     │ accommodation_inquiries  │
│ jobs_new             │     ├──────────────────────────┤
│ duration_seconds     │     │ listing_id (FK)          │
└──────────────────────┘     │ sender_id (FK->profiles) │
                             │ message                  │
                             └──────────────────────────┘
```

---

## Adding Screenshots

To add screenshots to this README:

1. Run the app locally with `npm run dev`
2. Take screenshots of each feature
3. Save them to `docs/screenshots/` with these filenames:

| Filename | What to capture |
|----------|----------------|
| `dashboard-overview.png` | Full dashboard with job listings and header |
| `job-listings.png` | Left sidebar showing job cards |
| `filters-panel.png` | Expanded filter panel with specialties/counties |
| `match-probability.png` | Centile input with match badges on job cards |
| `job-detail.png` | Right pane showing full job details |
| `accommodation-section.png` | Accommodation tab with listings |
| `accommodation-filters.png` | Accommodation filter panel expanded |
| `create-listing.png` | Create listing modal form |
| `accommodation-detail.png` | Accommodation detail with photos and map |
| `login.png` | Login/signup modal |
| `admin-panel.png` | Admin scraper control panel |
| `user-management.png` | Admin user management page |

---

## Contributing

Contributions welcome, especially:
- Hospital data corrections
- New scraper sources
- UI/UX improvements
- Bug fixes

---

## License

Private project. All rights reserved.

---

Built for Irish NCHD doctors by [Chris Faherty](https://github.com/Chrisfaherty).
