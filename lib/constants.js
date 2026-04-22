/**
 * lib/constants.js — App-wide constants
 * Import individual exports rather than the whole module to keep bundle size small.
 */

// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE     = 100;

// ─── Map / geo ────────────────────────────────────────────────────────────────
export const DEFAULT_MAP_CENTER  = { lat: 10.8505, lng: 76.2711 }; // Kerala centre
export const DEFAULT_MAP_ZOOM    = 8;
export const DEFAULT_SEARCH_RADIUS_KM = 25;
export const EARTH_RADIUS_KM     = 6371;

// ─── Cache TTLs (seconds) ─────────────────────────────────────────────────────
export const CACHE_TTL_SHORT  = 60;
export const CACHE_TTL_MEDIUM = 300;
export const CACHE_TTL_LONG   = 3600;
export const CACHE_TTL_DAY    = 86400;

// ─── Job enums (mirrored from schema for client-side use) ─────────────────────
export const JOB_CATEGORIES = [
  { value: 'EngineeringSoftwareQA',          label: 'Engineering & Software' },
  { value: 'DataScienceAnalytics',            label: 'Data Science & Analytics' },
  { value: 'UXDesignArchitecture',            label: 'UX / Design' },
  { value: 'HumanResources',                  label: 'Human Resources' },
  { value: 'ProjectProgramManagement',        label: 'Project Management' },
  { value: 'ProductManagement',               label: 'Product Management' },
  { value: 'EngineeringHardwareNetworks',     label: 'Hardware & Networks' },
  { value: 'QualityAssurance',                label: 'Quality Assurance' },
  { value: 'FinanceAccounting',               label: 'Finance & Accounting' },
  { value: 'ITInformationSecurity',           label: 'IT & Security' },
  { value: 'MarketingCommunication',          label: 'Marketing & Comms' },
  { value: 'SalesBusinessDevelopment',        label: 'Sales & Biz Dev' },
  { value: 'AdministrationFacilities',        label: 'Administration' },
  { value: 'CustomerSuccessServiceOperations',label: 'Customer Success' },
  { value: 'Consulting',                      label: 'Consulting' },
  { value: 'ContentEditorialJournalism',      label: 'Content & Journalism' },
  { value: 'LegalRegulatory',                 label: 'Legal & Regulatory' },
  { value: 'ResearchDevelopment',             label: 'R&D' },
  { value: 'StrategicTopManagement',          label: 'Strategy & Leadership' },
  { value: 'MobileDevelopment',               label: 'Mobile Development' },
  { value: 'GraphicDesign',                   label: 'Graphic Design' },
  { value: 'SEO',                             label: 'SEO' },
  { value: 'DevOpsCloud',                     label: 'DevOps & Cloud' },
  { value: 'SupportCustomerCare',             label: 'Support & Customer Care' },
  { value: 'EducationTraining',               label: 'Education & Training' },
  { value: 'HealthcareLifeSciences',          label: 'Healthcare & Life Sciences' },
  { value: 'SupplyChainLogistics',            label: 'Supply Chain & Logistics' },
  { value: 'BusinessOperations',              label: 'Business Operations' },
  { value: 'GrowthPartnerships',              label: 'Growth & Partnerships' },
  { value: 'TechnicalWriting',                label: 'Technical Writing' },
  { value: 'BrandCreative',                   label: 'Brand & Creative' },
];

export const JOB_TYPES = [
  { value: 'FullTime',   label: 'Full Time' },
  { value: 'PartTime',   label: 'Part Time' },
  { value: 'Contract',   label: 'Contract' },
  { value: 'Internship', label: 'Internship' },
  { value: 'Freelance',  label: 'Freelance' },
  { value: 'Temporary',  label: 'Temporary' },
];

export const WORK_MODES = [
  { value: 'OnSite', label: 'On-Site' },
  { value: 'Remote', label: 'Remote' },
  { value: 'Hybrid', label: 'Hybrid' },
];

export const EXPERIENCE_LEVELS = [
  { value: 'Fresher',   label: 'Fresher (0–1 yr)' },
  { value: 'Junior',    label: 'Junior (1–3 yrs)' },
  { value: 'Mid',       label: 'Mid-level (3–5 yrs)' },
  { value: 'Senior',    label: 'Senior (5–8 yrs)' },
  { value: 'Lead',      label: 'Lead (8–12 yrs)' },
  { value: 'Executive', label: 'Executive (12+ yrs)' },
];

export const APPLICATION_STATUSES = [
  { value: 'Applied',        label: 'Applied',         color: 'blue' },
  { value: 'Shortlisted',    label: 'Shortlisted',     color: 'yellow' },
  { value: 'Interviewing',   label: 'Interviewing',    color: 'purple' },
  { value: 'OfferExtended',  label: 'Offer Extended',  color: 'green' },
  { value: 'Hired',          label: 'Hired',           color: 'emerald' },
  { value: 'Rejected',       label: 'Rejected',        color: 'red' },
  { value: 'Withdrawn',      label: 'Withdrawn',       color: 'gray' },
];

export const COMPANY_SIZES = [
  { value: 'Micro',      label: '1–10 employees' },
  { value: 'Small',      label: '11–50 employees' },
  { value: 'Medium',     label: '51–200 employees' },
  { value: 'Large',      label: '201–1,000 employees' },
  { value: 'Enterprise', label: '1,000+ employees' },
];

export const FUNDING_SERIES = [
  { value: 'Bootstrapped', label: 'Bootstrapped' },
  { value: 'Seed',         label: 'Seed' },
  { value: 'SeriesA',      label: 'Series A' },
  { value: 'SeriesB',      label: 'Series B' },
  { value: 'SeriesC',      label: 'Series C' },
  { value: 'SeriesD',      label: 'Series D' },
  { value: 'SeriesE',      label: 'Series E' },
  { value: 'IPO',          label: 'IPO' },
];

export const SUBSCRIPTION_PLANS = [
  { value: 'Free',       label: 'Free',       priceMonthly: 0 },
  { value: 'Basic',      label: 'Basic',      priceMonthly: 999 },
  { value: 'Pro',        label: 'Pro',        priceMonthly: 2999 },
  { value: 'Enterprise', label: 'Enterprise', priceMonthly: 9999 },
];

// ─── API response codes ────────────────────────────────────────────────────────
export const HTTP = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  SERVER_ERROR: 500,
};

// ─── Razorpay ─────────────────────────────────────────────────────────────────
export const RAZORPAY_CURRENCY = 'INR';

// ─── Email ────────────────────────────────────────────────────────────────────
export const EMAIL_TEMPLATES = {
  WELCOME:               'welcome',
  APPLICATION_RECEIVED:  'application_received',
  APPLICATION_STATUS:    'application_status',
  EMPLOYER_NOTIFICATION: 'employer_notification',
  PASSWORD_RESET:        'password_reset',
};
