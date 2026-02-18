'use client';

import { motion } from 'framer-motion';
import {
  Stethoscope,
  Briefcase,
  Search,
  SlidersHorizontal,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Target,
  Home,
  ArrowLeftRight,
  Shield,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  UserPlus,
  ArrowRight,
  MapPin,
  Calendar,
  Lock,
} from 'lucide-react';

// ─── Animation Variants ──────────────────────────────────

const ease = [0.25, 0.1, 0.25, 1] as const;

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease },
};

const fadeInLeft = {
  initial: { opacity: 0, x: -30 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease },
};

const fadeInRight = {
  initial: { opacity: 0, x: 30 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease },
};

// ─── Main Component ──────────────────────────────────────

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-apple-gray">
      <StickyNav onGetStarted={onGetStarted} onSignIn={onSignIn} />
      <HeroSection onGetStarted={onGetStarted} />
      <StatsBar />
      <FeatureJobs />
      <FeatureMatch />
      <FeatureAccommodation />
      <FeatureScrapers />
      <HowItWorks onGetStarted={onGetStarted} />
      <FinalCTA onGetStarted={onGetStarted} />
      <Footer onGetStarted={onGetStarted} onSignIn={onSignIn} />
    </div>
  );
}

// ─── 1. Sticky Nav ───────────────────────────────────────

function StickyNav({ onGetStarted, onSignIn }: { onGetStarted: () => void; onSignIn: () => void }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/50">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-teal rounded-xl flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <span className="text-[15px] font-bold text-apple-black tracking-tight">MedMatch-IE</span>
        </div>

        {/* Center links — desktop */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-[13px] text-apple-secondary hover:text-apple-black font-medium transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-[13px] text-apple-secondary hover:text-apple-black font-medium transition-colors">
            How It Works
          </a>
        </div>

        {/* CTA buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onSignIn}
            className="px-3 sm:px-4 py-2 text-[12px] sm:text-[13px] font-semibold text-apple-black hover:bg-slate-100/80 rounded-xl transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            className="px-3 sm:px-4 py-2 text-[12px] sm:text-[13px] font-semibold bg-teal text-white rounded-xl hover:bg-teal-dark transition-colors shadow-sm"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── 2. Hero Section ─────────────────────────────────────

function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="hero-gradient pt-24 pb-12 sm:pt-28 sm:pb-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto text-center">
        {/* Overline badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium bg-teal/8 text-teal rounded-full border border-teal/15">
            <Stethoscope className="w-3 h-3" />
            Built for Irish NCHDs
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="mt-6 text-4xl sm:text-5xl lg:text-7xl font-bold text-apple-black tracking-tight leading-[1.08]"
        >
          Find Your Next{' '}
          <span className="text-gradient-teal">Hospital Post</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease }}
          className="mt-6 text-base sm:text-lg lg:text-xl text-apple-secondary max-w-2xl mx-auto leading-relaxed"
        >
          Stop trawling through four different job boards every rotation.
          Every NCHD post in Ireland, searchable in one place — with centile-based match predictions.
        </motion.p>

        {/* CTA Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-3.5 bg-teal text-white text-[15px] font-semibold rounded-2xl hover:bg-teal-dark transition-colors shadow-bloom inline-flex items-center justify-center gap-2"
          >
            Create Free Account
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-3.5 border border-slate-200/80 text-apple-black text-[15px] font-semibold rounded-2xl hover:bg-white transition-colors text-center"
          >
            Learn More
          </a>
        </motion.div>

        {/* Dashboard Preview (desktop only) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease }}
          className="hidden lg:block mt-16 max-w-4xl mx-auto"
        >
          <div
            className="rounded-2xl shadow-bloom-lg border border-slate-200/60 bg-white overflow-hidden"
            style={{ transform: 'perspective(1200px) rotateX(2deg)' }}
          >
            {/* Fake header */}
            <div className="glass border-b border-slate-200/50 h-10 flex items-center px-4 gap-2">
              <div className="w-6 h-6 bg-teal rounded-lg flex items-center justify-center">
                <Stethoscope className="w-3 h-3 text-white" />
              </div>
              <span className="text-[11px] font-bold text-apple-black">MedMatch-IE</span>
              <div className="flex bg-slate-100/80 rounded-lg p-0.5 ml-4">
                <div className="px-2.5 py-0.5 bg-white rounded-md text-[9px] font-semibold text-apple-black shadow-sm">Jobs</div>
                <div className="px-2.5 py-0.5 text-[9px] font-medium text-apple-secondary">Accommodation</div>
              </div>
              <div className="ml-auto flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-200" />
                <div className="w-2 h-2 rounded-full bg-slate-200" />
                <div className="w-2 h-2 rounded-full bg-slate-200" />
              </div>
            </div>
            {/* Fake two-column content */}
            <div className="flex h-72">
              {/* Sidebar */}
              <div className="w-1/3 border-r border-slate-100 p-3 space-y-2">
                {[true, false, false].map((selected, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl ${
                      selected ? 'bg-teal-50/60 border-l-[3px] border-l-teal' : 'border-l-[3px] border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center">
                        <span className="text-[7px] font-bold text-slate-400">
                          {['M', 'B', 'S'][i]}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded flex-1" />
                    </div>
                    <div className="h-2 bg-slate-100 rounded w-full mb-2 ml-6" />
                    <div className="flex gap-1 ml-6">
                      <div className="h-3.5 w-10 bg-slate-700 rounded-full" />
                      <div className="h-3.5 w-14 bg-badge-specialty/15 rounded-full" />
                      {i === 0 && <div className="h-3.5 w-12 bg-badge-match-green/15 rounded-full" />}
                      {i === 1 && <div className="h-3.5 w-12 bg-badge-match-amber/15 rounded-full" />}
                    </div>
                  </div>
                ))}
              </div>
              {/* Detail pane */}
              <div className="flex-1 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100" />
                  <div>
                    <div className="h-3 bg-slate-200 rounded w-40 mb-1" />
                    <div className="h-2 bg-slate-100 rounded w-28" />
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded w-full mb-3 mt-3" />
                <div className="flex gap-1.5 mb-4">
                  <div className="h-5 w-20 bg-slate-700 rounded-full" />
                  <div className="h-5 w-24 bg-badge-specialty/15 rounded-full" />
                  <div className="h-5 w-20 bg-badge-match-green/15 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="h-14 bg-apple-gray/60 rounded-xl" />
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <div className="h-9 flex-1 bg-teal/10 rounded-xl" />
                  <div className="h-9 w-24 bg-apple-gray/60 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── 3. Stats Bar ────────────────────────────────────────

function StatsBar() {
  const stats = [
    { value: '50+', label: 'Hospitals Covered' },
    { value: '4', label: 'Job Board Sources' },
    { value: '20+', label: 'Medical Specialties' },
    { value: 'Free', label: 'Always, No Catch' },
  ];

  return (
    <section className="py-10 sm:py-12 border-y border-slate-200/60 bg-white/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: i * 0.1, ease }}
            className="text-center"
          >
            <p className="text-3xl sm:text-4xl font-bold text-apple-black tracking-tight">{stat.value}</p>
            <p className="text-[13px] text-apple-secondary mt-1 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── 4. Feature: Job Aggregation ─────────────────────────

function FeatureJobs() {
  return (
    <section id="features" className="py-16 lg:py-24 px-4 sm:px-6 scroll-mt-16">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Text */}
        <motion.div {...fadeInLeft}>
          <p className="text-[12px] font-semibold text-teal uppercase tracking-widest">Job Aggregation</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-apple-black tracking-tight leading-tight mt-3">
            Every NCHD Post.{'\n'}One Dashboard.
          </h2>
          <p className="text-[15px] text-apple-secondary leading-relaxed mt-4 max-w-lg">
            No more opening four tabs every morning. We pull SHO, Registrar, and SpR posts from
            HSE, Rezoomo, HealthcareJobs.ie, and DoctorJobs.ie into a single searchable dashboard.
          </p>
          <div className="mt-6 space-y-3">
            <FeatureBullet icon={<Search className="w-4 h-4 text-teal" />} text="Search across all four sources by title, hospital, or county" />
            <FeatureBullet icon={<SlidersHorizontal className="w-4 h-4 text-teal" />} text="Filter by specialty, grade, hospital group, and scheme type" />
            <FeatureBullet icon={<RefreshCw className="w-4 h-4 text-teal" />} text="Auto-deduplication removes cross-posted listings" />
          </div>
        </motion.div>

        {/* Visual: Mock job cards */}
        <motion.div {...fadeInRight}>
          <div className="bg-apple-gray rounded-2xl p-4 sm:p-6 shadow-card">
            {/* Source pills */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['HSE', 'Rezoomo', 'HealthcareJobs', 'DoctorJobs'].map(s => (
                <span key={s} className="px-2.5 py-1 text-[10px] font-semibold bg-white rounded-full shadow-sm border border-slate-200/60">
                  {s}
                </span>
              ))}
            </div>
            {/* Mock cards */}
            <div className="space-y-3">
              {[
                { hospital: 'Mater Hospital', title: 'SHO in General Medicine', badges: ['SHO', 'Gen Med', 'Likely Match'], match: 'green' },
                { hospital: 'Beaumont Hospital', title: 'Registrar in Cardiology', badges: ['REG', 'Cardiology', 'Competitive'], match: 'amber' },
                { hospital: 'St. James\'s Hospital', title: 'SHO in Emergency Medicine', badges: ['SHO', 'EM'], match: null },
              ].map((card, i) => (
                <div key={i} className={`bg-white rounded-xl p-3.5 border border-slate-100/80 ${i === 0 ? 'ring-1 ring-teal/20' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-slate-500">{card.hospital[0]}</span>
                    </div>
                    <span className="text-[12px] font-semibold text-apple-black">{card.hospital}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2 pl-8">{card.title}</p>
                  <div className="flex gap-1 pl-8">
                    <span className="px-2 py-[2px] text-[9px] font-semibold bg-slate-700 text-white rounded-full">{card.badges[0]}</span>
                    <span className="px-2 py-[2px] text-[9px] font-medium bg-badge-specialty/10 text-badge-specialty rounded-full">{card.badges[1]}</span>
                    {card.badges[2] && (
                      <span className={`px-2 py-[2px] text-[9px] font-semibold rounded-full ${
                        card.match === 'green'
                          ? 'bg-badge-match-green/10 text-badge-match-green'
                          : 'bg-badge-match-amber/10 text-badge-match-amber'
                      }`}>
                        {card.badges[2]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── 5. Feature: Match Engine ────────────────────────────

function FeatureMatch() {
  return (
    <section className="py-16 lg:py-24 px-4 sm:px-6 bg-apple-gray/50">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Visual: Match probability card */}
        <motion.div {...fadeInLeft} className="order-2 lg:order-1">
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-float border border-slate-200/40">
            {/* Centile input mock */}
            <div className="flex items-center gap-3 mb-5">
              <TrendingUp className="w-5 h-5 text-teal" />
              <span className="text-[13px] font-semibold text-apple-black">Your Centile:</span>
              <span className="px-3 py-1 bg-teal/8 text-teal text-[14px] font-bold rounded-lg">72nd</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-teal to-teal-light rounded-full" style={{ width: '72%' }} />
            </div>
            {/* Hospital matches */}
            <div className="space-y-3">
              {[
                { name: "St. James's Hospital", rating: 'Likely Match', color: 'bg-badge-match-green/10 text-badge-match-green' },
                { name: 'Beaumont Hospital', rating: 'Competitive', color: 'bg-badge-match-amber/10 text-badge-match-amber' },
                { name: 'Cork University Hospital', rating: 'Likely Match', color: 'bg-badge-match-green/10 text-badge-match-green' },
              ].map(h => (
                <div key={h.name} className="flex items-center justify-between py-2 border-b border-slate-100/80 last:border-0">
                  <span className="text-[13px] font-medium text-slate-600 truncate mr-2">{h.name}</span>
                  <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-full whitespace-nowrap ${h.color}`}>
                    {h.rating}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Text */}
        <motion.div {...fadeInRight} className="order-1 lg:order-2">
          <p className="text-[12px] font-semibold text-teal uppercase tracking-widest">Match Engine</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-apple-black tracking-tight leading-tight mt-3">
            Know Your Odds{'\n'}Before You Apply.
          </h2>
          <p className="text-[15px] text-apple-secondary leading-relaxed mt-4 max-w-lg">
            Wondering if your centile is high enough for Mater or if Beaumont is a safer bet?
            Enter your score and see colour-coded match predictions for every hospital.
          </p>
          <div className="mt-6 space-y-3">
            <FeatureBullet icon={<TrendingUp className="w-4 h-4 text-teal" />} text="Three-tier system: Top Tier, Mid Tier, Safety Net" />
            <FeatureBullet icon={<BarChart3 className="w-4 h-4 text-teal" />} text="Based on historical centile cutoff data" />
            <FeatureBullet icon={<Target className="w-4 h-4 text-teal" />} text="Colour-coded: Likely Match, Competitive, Reach" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── 6. Feature: Accommodation ───────────────────────────

function FeatureAccommodation() {
  return (
    <section className="py-16 lg:py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Text */}
        <motion.div {...fadeInLeft}>
          <p className="text-[12px] font-semibold text-teal uppercase tracking-widest">Accommodation</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-apple-black tracking-tight leading-tight mt-3">
            Rotating Hospital?{'\n'}Find Your Next Home.
          </h2>
          <p className="text-[15px] text-apple-secondary leading-relaxed mt-4 max-w-lg">
            Every rotation means a new commute — or a new home. Browse rooms listed by other
            NCHDs leaving their post, or list your own place for the next person rotating in.
          </p>
          <div className="mt-6 space-y-3">
            <FeatureBullet icon={<Home className="w-4 h-4 text-teal" />} text="Browse listings near your next rotation hospital" />
            <FeatureBullet icon={<ArrowLeftRight className="w-4 h-4 text-teal" />} text="Peer-to-peer: listed by fellow NCHDs leaving their post" />
            <FeatureBullet icon={<Shield className="w-4 h-4 text-teal" />} text="Verified users only — direct contact between doctors" />
          </div>
        </motion.div>

        {/* Visual: Mock accommodation card */}
        <motion.div {...fadeInRight}>
          <div className="bg-apple-gray rounded-2xl p-4 sm:p-6 shadow-card">
            <div className="bg-white rounded-xl overflow-hidden border border-slate-100/80">
              {/* Photo placeholder */}
              <div className="h-36 sm:h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <Home className="w-10 h-10 text-slate-300" />
              </div>
              {/* Card body */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="text-[14px] font-bold text-apple-black">Bright room near Beaumont</h4>
                    <div className="flex items-center gap-1 text-[11px] text-apple-secondary mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span>Dublin 9</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-teal">&euro;850</p>
                    <p className="text-[10px] text-apple-secondary">per month</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-3">
                  <span className="px-2 py-[3px] text-[10px] font-medium bg-slate-100 text-slate-600 rounded-full">Private Room</span>
                  <span className="px-2 py-[3px] text-[10px] font-medium bg-green-50 text-green-600 rounded-full">Bills incl.</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {['WiFi', 'Furnished', 'Parking'].map(a => (
                    <span key={a} className="px-2 py-[3px] text-[10px] font-medium bg-apple-gray/60 text-slate-500 rounded-lg">{a}</span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-apple-secondary mt-3">
                  <Calendar className="w-3 h-3" />
                  <span>Available from Jul 2026</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── 7. Feature: Fresh Data ──────────────────────────────

function FeatureScrapers() {
  return (
    <section className="py-16 lg:py-24 px-4 sm:px-6 bg-teal-50/30">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Visual: Scraper status card */}
        <motion.div {...fadeInLeft} className="order-2 lg:order-1">
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-float border border-slate-200/40">
            <div className="flex items-center gap-2 mb-5">
              <RefreshCw className="w-4 h-4 text-teal" />
              <span className="text-[13px] font-semibold text-apple-black">Scraper Status</span>
              <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold bg-green-50 text-green-600 rounded-full">All Healthy</span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'HSE Jobs', time: '12 mins ago', method: 'Fetch' },
                { name: 'Rezoomo', time: '3 hrs ago', method: 'Playwright' },
                { name: 'HealthcareJobs.ie', time: '6 hrs ago', method: 'Fetch' },
                { name: 'DoctorJobs.ie', time: '12 hrs ago', method: 'Playwright' },
              ].map(s => (
                <div key={s.name} className="flex items-center gap-3 py-2 border-b border-slate-100/80 last:border-0">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-apple-black truncate">{s.name}</p>
                    <p className="text-[10px] text-apple-secondary">{s.method}</p>
                  </div>
                  <span className="text-[11px] text-apple-secondary whitespace-nowrap">{s.time}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Text */}
        <motion.div {...fadeInRight} className="order-1 lg:order-2">
          <p className="text-[12px] font-semibold text-teal uppercase tracking-widest">Always Fresh</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-apple-black tracking-tight leading-tight mt-3">
            Updated Daily.{'\n'}Automatically.
          </h2>
          <p className="text-[15px] text-apple-secondary leading-relaxed mt-4 max-w-lg">
            New posts appear within hours of going live on any board. Expired listings are
            automatically removed so you never waste time on a closed deadline.
          </p>
          <div className="mt-6 space-y-3">
            <FeatureBullet icon={<RefreshCw className="w-4 h-4 text-teal" />} text="Automated daily scraping of all 4 sources" />
            <FeatureBullet icon={<Zap className="w-4 h-4 text-teal" />} text="Smart deduplication across job boards" />
            <FeatureBullet icon={<Clock className="w-4 h-4 text-teal" />} text="Deadline tracking with colour-coded urgency" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── 8. How It Works ─────────────────────────────────────

function HowItWorks({ onGetStarted }: { onGetStarted: () => void }) {
  const steps = [
    { icon: <UserPlus className="w-6 h-6 text-teal" />, num: '1', title: 'Create Account', desc: 'Sign up with your email in under a minute. No verification hoops — just name and password.' },
    { icon: <TrendingUp className="w-6 h-6 text-teal" />, num: '2', title: 'Enter Your Centile', desc: 'Add your HSE interview centile to see personalised match predictions for every hospital.' },
    { icon: <Search className="w-6 h-6 text-teal" />, num: '3', title: 'Browse & Apply', desc: 'Filter by specialty, hospital group, or county. Found a post? Apply directly on the source site.' },
  ];

  return (
    <section id="how-it-works" className="py-16 lg:py-24 px-4 sm:px-6 bg-white scroll-mt-16">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div {...fadeInUp}>
          <p className="text-[12px] font-semibold text-teal uppercase tracking-widest">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-apple-black tracking-tight leading-tight mt-3">
            Up and Running{'\n'}in Three Steps.
          </h2>
        </motion.div>

        <div className="mt-10 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.15, ease }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-teal/8 border border-teal/12 flex items-center justify-center mx-auto">
                {step.icon}
              </div>
              <h3 className="text-[17px] font-bold text-apple-black mt-5">{step.title}</h3>
              <p className="text-[13px] text-apple-secondary mt-2 leading-relaxed max-w-xs mx-auto">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5, ease }}
          className="mt-12"
        >
          <button
            onClick={onGetStarted}
            className="px-8 py-3.5 bg-teal text-white text-[15px] font-semibold rounded-2xl hover:bg-teal-dark transition-colors shadow-bloom inline-flex items-center gap-2"
          >
            Create Free Account
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}

// ─── 9. Final CTA ────────────────────────────────────────

function FinalCTA({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section
      className="py-16 lg:py-24 px-4 sm:px-6"
      style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(0, 122, 126, 0.06) 0%, transparent 70%)' }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2
          {...fadeInUp}
          className="text-4xl sm:text-5xl font-bold text-apple-black tracking-tight leading-tight"
        >
          Ready to Find{'\n'}Your Next Post?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="text-[15px] sm:text-lg text-apple-secondary mt-4 max-w-xl mx-auto leading-relaxed"
        >
          Join Irish NCHDs already using MedMatch-IE to search, match, and apply to
          hospital positions across the country.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2, ease }}
          className="mt-8"
        >
          <button
            onClick={onGetStarted}
            className="px-10 py-4 bg-teal text-white text-[16px] font-semibold rounded-2xl hover:bg-teal-dark transition-colors shadow-bloom inline-flex items-center gap-2"
          >
            Create Free Account
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4, ease }}
          className="mt-5 flex items-center justify-center gap-4 sm:gap-6 text-[12px] text-apple-secondary"
        >
          <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Your data stays private</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> No ads, no spam</span>
        </motion.div>
      </div>
    </section>
  );
}

// ─── 10. Footer ──────────────────────────────────────────

function Footer({ onGetStarted, onSignIn }: { onGetStarted: () => void; onSignIn: () => void }) {
  return (
    <footer className="py-10 sm:py-12 px-4 sm:px-6 border-t border-slate-200/60 bg-apple-gray">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-teal rounded-lg flex items-center justify-center">
              <Stethoscope className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <span className="text-[13px] font-bold text-apple-black">MedMatch-IE</span>
              <p className="text-[10px] text-apple-secondary">NCHD Jobs Ireland</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <a href="#features" className="text-[12px] text-apple-secondary hover:text-apple-black font-medium transition-colors">Features</a>
            <a href="#how-it-works" className="text-[12px] text-apple-secondary hover:text-apple-black font-medium transition-colors">How It Works</a>
            <button onClick={onSignIn} className="text-[12px] text-apple-secondary hover:text-apple-black font-medium transition-colors">Sign In</button>
            <button onClick={onGetStarted} className="text-[12px] text-teal hover:text-teal-dark font-semibold transition-colors">Get Started</button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200/60 text-center space-y-1.5">
          <p className="text-[11px] text-apple-secondary">
            &copy; 2026 MedMatch-IE. Built for Irish NCHDs. Not affiliated with the HSE or any hospital group.
          </p>
          <p className="text-[10px] text-slate-400">
            Free to use. We never share your data with employers or third parties.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Shared Sub-components ───────────────────────────────

function FeatureBullet({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-teal/8 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <p className="text-[13px] text-slate-600 leading-relaxed">{text}</p>
    </div>
  );
}
