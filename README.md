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
- A Supabase account (free tier works)
- Optional: Anthropic API key for PDF parsing

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Chrisfaherty/MEDJOB.git
cd medjob
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase/schema.sql` in the SQL Editor
3. Copy your project URL and anon key

### 4. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📁 Project Structure

```
medjob/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main dashboard
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   └── JobCard.tsx           # Job listing card component
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client & API functions
│   │   ├── pdfParser.ts          # HSE job spec PDF parser
│   │   └── deadlineNotifications.ts  # Deadline alert system
│   ├── types/
│   │   └── database.types.ts     # TypeScript type definitions
│   └── data/
│       └── hospitals.json        # Irish hospital mapping (50+ hospitals)
├── supabase/
│   └── schema.sql                # Database schema
├── tailwind.config.ts            # Tailwind configuration
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

## 🤖 Future Features (Roadmap)

### Phase 1: Core Functionality ✅
- [x] Database schema
- [x] Job card component
- [x] Dashboard layout
- [x] Deadline notifications
- [x] Hospital mapping

### Phase 2: Data Aggregation (In Progress)
- [ ] HSE NRS scraper (Playwright)
- [ ] Rezoomo scraper
- [ ] about.hse.ie scraper
- [ ] Automated daily scraping cron job

### Phase 3: Premium Features
- [ ] PDF parsing with Claude API
- [ ] Email notifications (SMTP integration)
- [ ] User authentication (Supabase Auth)
- [ ] Saved searches & filters
- [ ] Application timeline tracking

### Phase 4: Advanced
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
