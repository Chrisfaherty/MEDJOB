# 🏥 MedMatch-IE - The Intern's Transition Tool

**A hyper-specific job aggregator for Medical Interns in Ireland transitioning to SHO/Registrar roles for the July 2026 rotation.**

## 🎯 Project Overview

MedMatch-IE is designed specifically for current medical interns in Ireland who need to make critical career decisions about their next rotation. The platform aggregates opportunities from multiple sources and presents them with an "intern-lens" - focusing on the data that truly matters when choosing your next post.

### Key Features

- **Dual-Stream Aggregation**: Tracks both HSE National Recruitment Service (NRS) campaigns and direct hospital hires
- **Logistics-First Design**: Filter by hospital groups, counties, and commute considerations
- **Career-Critical Data**: Highlights training vs non-training posts, rotational details, and clinical leads
- **LinkedIn-Style UI**: Clean, professional interface optimized for quick decision-making
- **Deadline Management**: Smart countdown timers and 48-hour warnings for applications
- **Status Tracking**: Mark jobs as Applied, Interview Offered, or Shortlisted

### ✨ What's Working Right Now

The app is **production-ready** and includes:

- **🏃 Works Immediately**: No database setup required - uses browser localStorage
- **📦 Sample Data**: 10 realistic job postings with dynamic deadlines
- **🔐 Simple Login**: Email-only authentication (no password needed)
- **🔍 Smart Filters**: Filter by specialty, hospital group, county, scheme type
- **📊 Detailed Views**: Click any job to see full details in right panel
- **🔔 Deadline Alerts**: Notification dropdown with urgency-based badges
- **✅ Status Tracking**: Track applications (Applied, Interview, Shortlisted)
- **🎨 Beautiful UI**: LinkedIn-inspired design with professional aesthetics
- **📱 Fully Responsive**: Works on desktop, tablet, and mobile

**Ready to deploy to Vercel in under 60 seconds!**

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router & TypeScript
- **Styling**: Tailwind CSS (LinkedIn-inspired palette)
- **Database**: Supabase (PostgreSQL)
- **Date Handling**: date-fns
- **Icons**: Lucide React
- **State Management**: Zustand
- **Web Scraping**: Playwright (for future implementation)
- **PDF Parsing**: Claude API integration (optional premium feature)

## 📋 Prerequisites

- Node.js 18+ and npm
- **Optional**: A Supabase account (free tier works) for production data
- **Optional**: Anthropic API key for PDF parsing

## 🚀 Quick Start (No Setup Required!)

The app works immediately with **local storage** - no database setup needed:

```bash
git clone https://github.com/Chrisfaherty/MEDJOB.git
cd medjob
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **"Try Demo Account"** to start exploring with sample data.

All your data is stored locally in your browser using localStorage. Perfect for testing and personal use!

## 🛠️ Full Installation (with Supabase)

For production use with persistent cloud storage:

### 1. Clone the Repository

```bash
git clone https://github.com/Chrisfaherty/MEDJOB.git
cd medjob
npm install
```

### 2. Set Up Supabase (Optional)

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase/schema.sql` in the SQL Editor
3. Copy your project URL and anon key

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🌐 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Chrisfaherty/MEDJOB)

Or manually:

```bash
npm install -g vercel
vercel
```

The app works immediately without any environment variables. Add Supabase credentials later in the Vercel dashboard for cloud storage.

### Environment Variables for Production

In your Vercel project settings, add:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `ANTHROPIC_API_KEY` - (Optional) For PDF parsing feature

## 📁 Project Structure

```
medjob/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main dashboard with auth, filters, notifications
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   ├── JobCard.tsx           # Job listing card component
│   │   └── LoginModal.tsx        # Email-only authentication modal
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client & API functions
│   │   ├── localStorage.ts       # Local storage system (works without Supabase!)
│   │   ├── pdfParser.ts          # HSE job spec PDF parser
│   │   └── deadlineNotifications.ts  # Deadline alert system
│   ├── types/
│   │   └── database.types.ts     # TypeScript type definitions
│   └── data/
│       ├── hospitals.json        # Irish hospital mapping (50+ hospitals)
│       └── sampleJobs.ts         # 10 realistic sample jobs for demo
├── supabase/
│   └── schema.sql                # Database schema
├── tailwind.config.ts            # Tailwind configuration
├── .env.example                  # Environment variables template
└── package.json
```

## 🗄️ Database Schema

The Supabase database includes:

- **jobs** - NCHD job postings with full details
- **user_applications** - Track application status per user
- **user_preferences** - Saved filters and notification settings
- **scraping_logs** - Track scraper runs and data freshness

### Key Enums

- `nchd_grade`: SHO, REGISTRAR, SPECIALIST_REGISTRAR
- `specialty_type`: 20+ medical specialties
- `scheme_type`: TRAINING_BST, TRAINING_HST, NON_TRAINING_SERVICE
- `hospital_group`: IEHG, DMHG, RCSI, SAOLTA, SSWHG, MWHG, UL

## 🏥 Hospital Network Mapping

The app includes a comprehensive mapping of 50+ Irish hospitals to their:

- Hospital Group (e.g., IEHG, RCSI, Saolta)
- Intern Training Network
- County & City
- Teaching Hospital Status
- Affiliated University

This enables powerful filtering like:
- "Show me all posts in Dublin North"
- "Find training schemes in teaching hospitals"
- "Filter by RCSI Hospital Group"

## 🎨 UI Design Philosophy

### LinkedIn-Inspired Aesthetic

- **Color Palette**: Slate/Blue/White (professional, medical-appropriate)
- **Typography**: Clean, readable fonts optimized for scanning
- **Cards**: Shadow-based elevation with hover states
- **Status Colors**: Green (Applied), Amber (Interview), Purple (Shortlisted)

### Dual-Pane Layout

- **Left Pane**: Scrollable job cards with countdown timers
- **Right Pane**: Detailed job view with full specifications

## 📅 Deadline Management

The system includes intelligent deadline tracking:

```typescript
// Urgency Levels
- Critical: < 48 hours (Red badge, browser notifications)
- Warning: 2-7 days (Amber badge, daily digests)
- Normal: > 7 days (Green badge)
```

### Notification Strategy

- **48-hour warnings**: Browser push notifications
- **Daily digests**: Email summaries of upcoming deadlines
- **Status integration**: Only notify for jobs you haven't applied to

## 🔍 PDF Parser

The optional PDF parser extracts key information from HSE Job Specification PDFs:

- Informal Enquiries email (crucial for "scoping out" departments)
- Clinical Lead/Consultant name
- Closing date
- Rotational detail (e.g., "6 months Cardiology / 6 months Respiratory")

### Usage

```typescript
import { parseWithClaude } from '@/lib/pdfParser';

const pdfUrl = 'https://hse.ie/jobs/spec/12345.pdf';
const parsed = await fetchAndParsePDF(pdfUrl);
console.log(parsed.informalEnquiriesEmail); // "consultant@hse.ie"
```

## 🤖 Features & Roadmap

### ✅ Phase 1: Core Functionality (COMPLETE)
- [x] Database schema
- [x] Job card component with deadline countdown
- [x] Dual-pane dashboard layout
- [x] Deadline notifications with urgency levels
- [x] Hospital mapping (50+ hospitals)
- [x] **Local storage system** (works without Supabase!)
- [x] **Sample data** (10 realistic jobs)
- [x] **Email-only authentication** (no password required)
- [x] **Filter system** (specialty, hospital group, county, scheme type)
- [x] **Detailed job view panel**
- [x] **Notification dropdown UI**
- [x] **Application status tracking**
- [x] **Search functionality**

### 🚧 Phase 2: Data Aggregation (Planned)
- [ ] HSE NRS scraper (Playwright)
- [ ] Rezoomo scraper
- [ ] about.hse.ie scraper
- [ ] Automated daily scraping cron job

### 📋 Phase 3: Premium Features (Planned)
- [x] PDF parsing with Claude API (implemented, needs API key)
- [ ] Email notifications (SMTP integration)
- [ ] Enhanced user authentication (Supabase Auth)
- [ ] Saved searches & filters
- [ ] Application timeline tracking

### 🎯 Phase 4: Advanced (Future)
- [ ] Interview scheduler
- [ ] Contract comparison tool
- [ ] Salary calculator (with IMO pay scales)
- [ ] Colleague finder (who else is applying)

## 🧪 Development Notes

### Adding New Hospitals

Edit `src/data/hospitals.json`:

```json
{
  "id": "newhos",
  "name": "New Hospital",
  "shortName": "NewHosp",
  "county": "Cork",
  "hospitalGroup": "SSWHG",
  "internNetwork": "CORK",
  "location": { "city": "Cork", "lat": 51.8969, "lng": -8.4863 },
  "isTeachingHospital": false,
  "university": null
}
```

### Adding New Specialties

Update `src/types/database.types.ts`:

1. Add to `SpecialtyType` union
2. Add to `SPECIALTY_LABELS` object
3. Update Supabase enum: `ALTER TYPE specialty_type ADD VALUE 'NEW_SPECIALTY'`

## 📝 Contributing

This is a specialized tool for Irish medical interns. Contributions welcome, especially:

- Hospital data corrections
- Scraper improvements
- UI/UX enhancements
- Bug fixes

## 📄 License

MIT License - see LICENSE file

## 🆘 Support & Feedback

- **Issues**: Report bugs via [GitHub Issues](https://github.com/Chrisfaherty/MEDJOB/issues)
- **Feature Requests**: Open a discussion in GitHub
- **Contact**: For intern-specific queries about using the tool

## 🎓 For Medical Interns

### How to Use This Tool

1. **Set up your account** (coming soon - auth feature)
2. **Configure your preferences**: Specialties you're interested in, counties you can work in
3. **Browse jobs**: Use filters to find posts that match your needs
4. **Track applications**: Mark posts as you apply
5. **Stay on top of deadlines**: Enable notifications to never miss a closing date

### The July 2026 Context

This tool is specifically designed for the July 13, 2026 changeover date. Key dates:

- **March-April 2026**: National schemes open (BST, HST)
- **April-June 2026**: Individual hospital posts advertised
- **May-June 2026**: Interview season
- **June 2026**: Contract offers
- **July 13, 2026**: Changeover day

### Critical Data Points to Consider

1. **Training vs Non-Training**: Will this count toward specialization?
2. **Rotational Detail**: What sub-specialties will you cover?
3. **Hospital Group**: Affects leave policies, on-call arrangements
4. **Location**: Commute time, accommodation options
5. **Clinical Lead**: Research their team before applying
6. **Informal Enquiries**: Always email before applying

---

**Built for interns, by someone who understands the stress of July rotation applications. Good luck! 🍀**
