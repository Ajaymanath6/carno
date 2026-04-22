import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';

const STATS = [
  { label: 'Jobs Posted', value: '12,000+' },
  { label: 'Companies', value: '3,500+' },
  { label: 'Cities Covered', value: '200+' },
  { label: 'Hires Made', value: '50,000+' },
];

const CATEGORIES = [
  { label: 'Technology', emoji: '💻', query: 'Technology' },
  { label: 'Healthcare', emoji: '🏥', query: 'Healthcare' },
  { label: 'Finance', emoji: '💰', query: 'Finance' },
  { label: 'Education', emoji: '🎓', query: 'Education' },
  { label: 'Retail', emoji: '🛒', query: 'Retail' },
  { label: 'Manufacturing', emoji: '🏭', query: 'Manufacturing' },
  { label: 'Logistics', emoji: '🚚', query: 'Logistics' },
  { label: 'Hospitality', emoji: '🏨', query: 'Hospitality' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create Your Profile',
    desc: 'Sign up in seconds. Tell us who you are — job seeker or employer.',
    icon: '👤',
  },
  {
    step: '02',
    title: 'Find Jobs on the Map',
    desc: 'Browse hundreds of local openings on an interactive map near you.',
    icon: '📍',
  },
  {
    step: '03',
    title: 'Apply & Chat',
    desc: 'Apply with one click. Chat directly with employers in real time.',
    icon: '💬',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-brand-300 blur-3xl" />
        </div>

        <div className="content-container relative py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Location-aware job discovery across India
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight">
            Find Jobs Near You.
            <br />
            <span className="text-brand-200">On the Map.</span>
          </h1>
          <p className="text-base md:text-lg text-brand-100 max-w-xl mx-auto mb-10">
            mapmyGig connects job seekers and local employers across India. Browse opportunities pinned to a map and apply in seconds.
          </p>

          <div className="max-w-lg mx-auto mb-8">
            <SearchBar placeholder="Search jobs, skills, companies or locations…" />
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/jobs"
              className="px-6 py-3 rounded-xl bg-white text-brand-700 font-semibold text-sm hover:bg-brand-50 transition-colors shadow-md"
            >
              Browse All Jobs
            </Link>
            <Link
              href="/sign-up"
              className="px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold text-sm border border-white/20 hover:bg-brand-400 transition-colors"
            >
              Post a Job — Free
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100 bg-white">
        <div className="content-container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl md:text-3xl font-extrabold text-brand-600">{value}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-gray-50 py-14">
        <div className="content-container">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Browse by Category</h2>
          <p className="text-sm text-gray-500 text-center mb-8">Explore roles across top industries</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map(({ label, emoji, query }) => (
              <Link
                key={label}
                href={`/jobs?category=${encodeURIComponent(query)}`}
                className="card p-4 text-center group hover:border-brand-300 hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-2">{emoji}</div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-brand-600 transition-colors">
                  {label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="content-container">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">How mapmyGig Works</h2>
          <p className="text-sm text-gray-500 text-center mb-10">Simple. Fast. Local.</p>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc, icon }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-4 text-2xl">
                  {icon}
                </div>
                <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">{step}</span>
                <h3 className="text-lg font-bold text-gray-900 mt-1 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-brand-600 py-14">
        <div className="content-container text-center text-white">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Ready to find your next gig?</h2>
          <p className="text-brand-100 text-sm mb-8 max-w-sm mx-auto">
            Join thousands of professionals already using mapmyGig to find and post local jobs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/sign-up"
              className="px-8 py-3 rounded-xl bg-white text-brand-700 font-bold text-sm hover:bg-brand-50 transition-colors shadow-lg"
            >
              Get Started Free
            </Link>
            <Link
              href="/jobs"
              className="px-8 py-3 rounded-xl border border-white/30 text-white font-bold text-sm hover:bg-white/10 transition-colors"
            >
              Explore Jobs
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
