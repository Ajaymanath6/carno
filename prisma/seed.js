/**
 * Seed script for mapmyGig
 * Run: node prisma/seed.js
 *
 * Populates:
 *  - Reference data: Pincodes, JobTitles, Colleges
 *  - Demo users: one admin, two employers, four job seekers
 *  - Two demo companies with jobs and locations
 *  - Sample applications, conversations, and messages
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Reference data ───────────────────────────────────────────────────────────

const PINCODES = [
  { pincode: '695001', localityName: 'Thiruvananthapuram East', district: 'Thiruvananthapuram', state: 'Kerala', latitude: 8.4855, longitude: 76.9492 },
  { pincode: '682001', localityName: 'Ernakulam North', district: 'Ernakulam', state: 'Kerala', latitude: 9.9816, longitude: 76.2999 },
  { pincode: '673001', localityName: 'Kozhikode East', district: 'Kozhikode', state: 'Kerala', latitude: 11.2588, longitude: 75.7804 },
  { pincode: '500001', localityName: 'Hyderabad Central', district: 'Hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867 },
  { pincode: '600001', localityName: 'Chennai Central', district: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
  { pincode: '560001', localityName: 'Bangalore Central', district: 'Bengaluru Urban', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
  { pincode: '400001', localityName: 'Mumbai CST', district: 'Mumbai', state: 'Maharashtra', latitude: 18.9387, longitude: 72.8354 },
  { pincode: '110001', localityName: 'New Delhi Central', district: 'New Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
];

const JOB_TITLES = [
  { title: 'Software Engineer', category: 'EngineeringSoftwareQA' },
  { title: 'Senior Software Engineer', category: 'EngineeringSoftwareQA' },
  { title: 'Full Stack Developer', category: 'EngineeringSoftwareQA' },
  { title: 'Frontend Developer', category: 'EngineeringSoftwareQA' },
  { title: 'Backend Developer', category: 'EngineeringSoftwareQA' },
  { title: 'DevOps Engineer', category: 'DevOpsCloud' },
  { title: 'Cloud Architect', category: 'DevOpsCloud' },
  { title: 'Data Scientist', category: 'DataScienceAnalytics' },
  { title: 'Data Analyst', category: 'DataScienceAnalytics' },
  { title: 'Machine Learning Engineer', category: 'DataScienceAnalytics' },
  { title: 'Product Manager', category: 'ProductManagement' },
  { title: 'UX Designer', category: 'UXDesignArchitecture' },
  { title: 'UI Designer', category: 'UXDesignArchitecture' },
  { title: 'HR Manager', category: 'HumanResources' },
  { title: 'Recruiter', category: 'HumanResources' },
  { title: 'Sales Executive', category: 'SalesBusinessDevelopment' },
  { title: 'Business Development Manager', category: 'SalesBusinessDevelopment' },
  { title: 'Marketing Manager', category: 'MarketingCommunication' },
  { title: 'Content Writer', category: 'ContentEditorialJournalism' },
  { title: 'SEO Specialist', category: 'SEO' },
  { title: 'Mobile Developer', category: 'MobileDevelopment' },
  { title: 'iOS Developer', category: 'MobileDevelopment' },
  { title: 'Android Developer', category: 'MobileDevelopment' },
  { title: 'QA Engineer', category: 'QualityAssurance' },
  { title: 'IT Support Specialist', category: 'ITInformationSecurity' },
  { title: 'Cybersecurity Analyst', category: 'ITInformationSecurity' },
  { title: 'Project Manager', category: 'ProjectProgramManagement' },
  { title: 'Finance Analyst', category: 'FinanceAccounting' },
  { title: 'Graphic Designer', category: 'GraphicDesign' },
  { title: 'Customer Support Executive', category: 'SupportCustomerCare' },
];

const COLLEGES = [
  { name: 'College of Engineering Trivandrum', category: 'Engineering', pincode: '695016', locality: 'Thiruvananthapuram', district: 'Thiruvananthapuram', state: 'Kerala', latitude: 8.5490, longitude: 76.9162 },
  { name: 'Model Engineering College', category: 'Engineering', pincode: '682021', locality: 'Thrikkakara', district: 'Ernakulam', state: 'Kerala', latitude: 10.0269, longitude: 76.3297 },
  { name: 'NIT Calicut', category: 'Engineering', pincode: '673601', locality: 'Kozhikode', district: 'Kozhikode', state: 'Kerala', latitude: 11.3219, longitude: 75.9331 },
  { name: 'IIT Madras', category: 'Engineering', pincode: '600036', locality: 'Adyar', district: 'Chennai', state: 'Tamil Nadu', latitude: 12.9916, longitude: 80.2336 },
  { name: 'BITS Pilani Hyderabad', category: 'Engineering', pincode: '500078', locality: 'Jawahar Nagar', district: 'Hyderabad', state: 'Telangana', latitude: 17.5449, longitude: 78.5716 },
];

// ─── Demo users ───────────────────────────────────────────────────────────────

const DEMO_USERS = [
  {
    clerkId: 'user_admin_seed_001',
    email: 'admin@mapmygig.com',
    accountType: 'Admin',
    isOnboarded: true,
    profile: {
      firstName: 'Admin',
      lastName: 'User',
      phone: '+919999000001',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
    },
  },
  {
    clerkId: 'user_employer_seed_001',
    email: 'priya.sharma@techwave.in',
    accountType: 'Employer',
    isOnboarded: true,
    profile: {
      firstName: 'Priya',
      lastName: 'Sharma',
      phone: '+918800111222',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
    },
  },
  {
    clerkId: 'user_employer_seed_002',
    email: 'rahul.nair@brightminds.io',
    accountType: 'Employer',
    isOnboarded: true,
    profile: {
      firstName: 'Rahul',
      lastName: 'Nair',
      phone: '+919900222333',
      city: 'Ernakulam',
      state: 'Kerala',
      pincode: '682001',
      latitude: 9.9816,
      longitude: 76.2999,
    },
  },
  {
    clerkId: 'user_seeker_seed_001',
    email: 'arun.krishna@example.com',
    accountType: 'JobSeeker',
    isOnboarded: true,
    profile: {
      firstName: 'Arun',
      lastName: 'Krishna',
      phone: '+917700333444',
      city: 'Thiruvananthapuram',
      state: 'Kerala',
      pincode: '695001',
      latitude: 8.4855,
      longitude: 76.9492,
      skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
      jobTitles: ['Full Stack Developer', 'Frontend Developer'],
      experienceYears: 3,
      experienceLevel: 'Mid',
    },
  },
  {
    clerkId: 'user_seeker_seed_002',
    email: 'sneha.pillai@example.com',
    accountType: 'JobSeeker',
    isOnboarded: true,
    profile: {
      firstName: 'Sneha',
      lastName: 'Pillai',
      phone: '+916600444555',
      city: 'Ernakulam',
      state: 'Kerala',
      pincode: '682001',
      latitude: 9.9816,
      longitude: 76.2999,
      skills: ['Python', 'Machine Learning', 'Data Analysis', 'TensorFlow'],
      jobTitles: ['Data Scientist', 'Machine Learning Engineer'],
      experienceYears: 2,
      experienceLevel: 'Junior',
    },
  },
  {
    clerkId: 'user_seeker_seed_003',
    email: 'vikram.menon@example.com',
    accountType: 'JobSeeker',
    isOnboarded: true,
    profile: {
      firstName: 'Vikram',
      lastName: 'Menon',
      phone: '+915500555666',
      city: 'Kozhikode',
      state: 'Kerala',
      pincode: '673001',
      latitude: 11.2588,
      longitude: 75.7804,
      skills: ['UX Research', 'Figma', 'Prototyping', 'User Testing'],
      jobTitles: ['UX Designer', 'UI Designer'],
      experienceYears: 4,
      experienceLevel: 'Senior',
    },
  },
  {
    clerkId: 'user_seeker_seed_004',
    email: 'deepa.george@example.com',
    accountType: 'JobSeeker',
    isOnboarded: true,
    profile: {
      firstName: 'Deepa',
      lastName: 'George',
      phone: '+914400666777',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
      jobTitles: ['DevOps Engineer', 'Cloud Architect'],
      experienceYears: 5,
      experienceLevel: 'Senior',
    },
  },
];

// ─── Demo companies ───────────────────────────────────────────────────────────

const DEMO_COMPANIES = [
  {
    ownerEmail: 'priya.sharma@techwave.in',
    name: 'TechWave Solutions',
    slug: 'techwave-solutions',
    description: 'TechWave Solutions is a fast-growing product company building SaaS tools for SMEs across India. We believe in remote-first culture, async communication, and continuous learning.',
    websiteUrl: 'https://techwave.in',
    size: 'Medium',
    fundingSeries: 'SeriesA',
    industry: 'Software & Technology',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    latitude: 12.9716,
    longitude: 77.5946,
    isVerified: true,
  },
  {
    ownerEmail: 'rahul.nair@brightminds.io',
    name: 'BrightMinds EdTech',
    slug: 'brightminds-edtech',
    description: 'BrightMinds is an edtech startup on a mission to make quality education accessible. We build mobile-first learning platforms for students across Tier 2 and Tier 3 cities.',
    websiteUrl: 'https://brightminds.io',
    size: 'Small',
    fundingSeries: 'Seed',
    industry: 'Education Technology',
    city: 'Ernakulam',
    state: 'Kerala',
    pincode: '682001',
    latitude: 9.9816,
    longitude: 76.2999,
    isVerified: true,
  },
];

// ─── Demo jobs ────────────────────────────────────────────────────────────────

const DEMO_JOBS = [
  {
    companySlug: 'techwave-solutions',
    title: 'Senior Full Stack Developer',
    slug: 'senior-full-stack-developer-techwave-2024',
    description: `We are looking for a Senior Full Stack Developer to join our product team. You will own end-to-end features, mentor junior engineers, and help shape our technical roadmap.

**What you'll do**
- Design, build, and maintain scalable web applications using React and Node.js
- Collaborate closely with product managers and designers
- Write clean, well-tested code
- Participate in code reviews and architectural discussions

**What we offer**
- Fully remote work with flexible hours
- Competitive salary + ESOPs
- Annual learning budget of ₹50,000
- Health insurance for you and your family`,
    requirements: 'B.Tech/B.E. in Computer Science or equivalent. 4+ years professional experience.',
    responsibilities: 'Own feature development, code reviews, production support.',
    category: 'EngineeringSoftwareQA',
    jobType: 'FullTime',
    workMode: 'Remote',
    experienceLevel: 'Senior',
    skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'Docker', 'AWS'],
    salaryMin: 2000000,
    salaryMax: 3500000,
    location: {
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      locality: 'Koramangala',
    },
  },
  {
    companySlug: 'techwave-solutions',
    title: 'Data Scientist',
    slug: 'data-scientist-techwave-2024',
    description: `Join our data team to build ML models that power intelligent features across our products. You'll work on recommendation engines, churn prediction, and NLP pipelines.

**What you'll do**
- Develop and deploy machine learning models to production
- Analyze large datasets to extract business insights
- Collaborate with engineering to integrate ML outputs into the product
- Write clear documentation and present findings to stakeholders`,
    requirements: 'MSc/B.Tech in Statistics, Mathematics, or Computer Science. 2+ years in an ML role.',
    responsibilities: 'Build, train, deploy and monitor ML models. Data pipeline maintenance.',
    category: 'DataScienceAnalytics',
    jobType: 'FullTime',
    workMode: 'Hybrid',
    experienceLevel: 'Mid',
    skills: ['Python', 'scikit-learn', 'TensorFlow', 'SQL', 'Spark', 'Airflow'],
    salaryMin: 1500000,
    salaryMax: 2500000,
    location: {
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      locality: 'HSR Layout',
    },
  },
  {
    companySlug: 'techwave-solutions',
    title: 'DevOps Engineer',
    slug: 'devops-engineer-techwave-2024',
    description: `We are scaling our infrastructure and need a DevOps engineer to help us build a robust, secure, and observable platform.

**What you'll do**
- Manage and improve our CI/CD pipelines
- Maintain Kubernetes clusters on AWS EKS
- Implement Infrastructure as Code using Terraform
- Monitor system health and drive incident response`,
    requirements: '3+ years in a DevOps or Site Reliability Engineering role.',
    responsibilities: 'CI/CD, cloud infra, Kubernetes management, security hardening.',
    category: 'DevOpsCloud',
    jobType: 'FullTime',
    workMode: 'Remote',
    experienceLevel: 'Mid',
    skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'GitHub Actions', 'Prometheus'],
    salaryMin: 1800000,
    salaryMax: 2800000,
    location: {
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      locality: 'Whitefield',
    },
  },
  {
    companySlug: 'brightminds-edtech',
    title: 'Mobile App Developer (React Native)',
    slug: 'mobile-developer-brightminds-2024',
    description: `BrightMinds is looking for a passionate Mobile Developer to build and improve our student learning app used by 200,000+ students.

**What you'll do**
- Build new features in our React Native app
- Optimize app performance and bundle size
- Integrate with REST APIs and push notification services
- Work in a fast-paced startup environment`,
    requirements: '2+ years of React Native development. Published apps on Play Store/App Store preferred.',
    responsibilities: 'Feature development, performance optimization, App Store deployments.',
    category: 'MobileDevelopment',
    jobType: 'FullTime',
    workMode: 'OnSite',
    experienceLevel: 'Junior',
    skills: ['React Native', 'JavaScript', 'Redux', 'Firebase', 'REST APIs'],
    salaryMin: 800000,
    salaryMax: 1500000,
    location: {
      city: 'Ernakulam',
      state: 'Kerala',
      pincode: '682001',
      latitude: 9.9816,
      longitude: 76.2999,
      locality: 'Kakkanad',
    },
  },
  {
    companySlug: 'brightminds-edtech',
    title: 'UX Designer',
    slug: 'ux-designer-brightminds-2024',
    description: `We are looking for a UX Designer to design intuitive learning experiences for students aged 10-18.

**What you'll do**
- Conduct user research and usability testing
- Create wireframes, prototypes, and high-fidelity designs in Figma
- Collaborate with product and engineering teams
- Define and maintain the design system`,
    requirements: '2+ years of product/UX design experience. Strong portfolio required.',
    responsibilities: 'End-to-end UX design, user research, design system maintenance.',
    category: 'UXDesignArchitecture',
    jobType: 'FullTime',
    workMode: 'Hybrid',
    experienceLevel: 'Mid',
    skills: ['Figma', 'UX Research', 'Prototyping', 'User Testing', 'Design Systems'],
    salaryMin: 900000,
    salaryMax: 1600000,
    location: {
      city: 'Ernakulam',
      state: 'Kerala',
      pincode: '682001',
      latitude: 9.9816,
      longitude: 76.2999,
      locality: 'Edapally',
    },
  },
];

// ─── Seed functions ────────────────────────────────────────────────────────────

async function seedPincodes() {
  console.warn('Seeding pincodes...');
  for (const p of PINCODES) {
    await prisma.pincode.upsert({
      where: { pincode: p.pincode },
      update: {},
      create: p,
    });
  }
  console.warn(`  ✓ ${PINCODES.length} pincodes`);
}

async function seedJobTitles() {
  console.warn('Seeding job titles...');
  for (const jt of JOB_TITLES) {
    await prisma.jobTitle.upsert({
      where: { title: jt.title },
      update: {},
      create: jt,
    });
  }
  console.warn(`  ✓ ${JOB_TITLES.length} job titles`);
}

async function seedColleges() {
  console.warn('Seeding colleges...');
  for (const c of COLLEGES) {
    await prisma.college.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
  }
  console.warn(`  ✓ ${COLLEGES.length} colleges`);
}

async function seedUsers() {
  console.warn('Seeding demo users...');
  const createdUsers = {};

  for (const u of DEMO_USERS) {
    const { profile: profileData, ...userData } = u;

    const user = await prisma.user.upsert({
      where: { clerkId: userData.clerkId },
      update: {},
      create: {
        ...userData,
        profile: {
          create: profileData,
        },
      },
    });

    createdUsers[u.email] = user;
  }

  console.warn(`  ✓ ${DEMO_USERS.length} users with profiles`);
  return createdUsers;
}

async function seedCompanies(userMap) {
  console.warn('Seeding demo companies...');
  const createdCompanies = {};

  for (const c of DEMO_COMPANIES) {
    const { ownerEmail, ...companyData } = c;
    const owner = userMap[ownerEmail];
    if (!owner) {
      console.warn(`  ⚠ Owner not found for company: ${c.name}`);
      continue;
    }

    const company = await prisma.company.upsert({
      where: { slug: companyData.slug },
      update: {},
      create: {
        ...companyData,
        ownerId: owner.id,
      },
    });

    createdCompanies[c.slug] = company;
  }

  console.warn(`  ✓ ${DEMO_COMPANIES.length} companies`);
  return createdCompanies;
}

async function seedJobs(companyMap) {
  console.warn('Seeding demo jobs...');
  const createdJobs = {};

  for (const j of DEMO_JOBS) {
    const { companySlug, location, ...jobData } = j;
    const company = companyMap[companySlug];
    if (!company) {
      console.warn(`  ⚠ Company not found for job: ${j.title}`);
      continue;
    }

    const job = await prisma.job.upsert({
      where: { slug: jobData.slug },
      update: {},
      create: {
        ...jobData,
        companyId: company.id,
        location: {
          create: location,
        },
      },
    });

    createdJobs[j.slug] = job;
  }

  console.warn(`  ✓ ${DEMO_JOBS.length} jobs`);
  return createdJobs;
}

async function seedApplicationsAndChat(userMap, jobMap) {
  console.warn('Seeding demo applications and conversations...');

  const arun = userMap['arun.krishna@example.com'];
  const sneha = userMap['sneha.pillai@example.com'];
  const vikram = userMap['vikram.menon@example.com'];

  const fsJob = jobMap['senior-full-stack-developer-techwave-2024'];
  const dsJob = jobMap['data-scientist-techwave-2024'];
  const uxJob = jobMap['ux-designer-brightminds-2024'];

  const applicationsToCreate = [
    {
      jobId: fsJob?.id,
      applicantId: arun?.id,
      status: 'Shortlisted',
      coverLetter: "Hi, I'm Arun. I have 3 years of full-stack experience with React and Node.js and would love to bring that expertise to TechWave.",
    },
    {
      jobId: dsJob?.id,
      applicantId: sneha?.id,
      status: 'Interviewing',
      coverLetter: "I'm Sneha, a data scientist with hands-on experience in ML model deployment. Excited to apply for this role.",
    },
    {
      jobId: uxJob?.id,
      applicantId: vikram?.id,
      status: 'Applied',
      coverLetter: "I'm Vikram, a UX designer passionate about education products. My portfolio includes mobile learning apps for 50k+ users.",
    },
  ];

  for (const appData of applicationsToCreate) {
    if (!appData.jobId || !appData.applicantId) continue;

    // Check if application already exists
    const existing = await prisma.application.findUnique({
      where: { jobId_applicantId: { jobId: appData.jobId, applicantId: appData.applicantId } },
    });
    if (existing) continue;

    const application = await prisma.application.create({ data: appData });

    // Create a conversation thread for the application
    const conversation = await prisma.conversation.create({
      data: {
        applicationId: application.id,
        subject: 'Application follow-up',
        lastMessageAt: new Date(),
        participants: {
          create: [
            { userId: appData.applicantId },
          ],
        },
      },
    });

    // Seed opening system message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: null,
        senderType: 'System',
        body: 'Your application has been received. The recruiter will reach out to you here.',
      },
    });
  }

  console.warn(`  ✓ ${applicationsToCreate.length} applications with conversations`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.warn('\n🌱 Starting mapmyGig seed...\n');

  await seedPincodes();
  await seedJobTitles();
  await seedColleges();

  const userMap = await seedUsers();
  const companyMap = await seedCompanies(userMap);
  const jobMap = await seedJobs(companyMap);

  await seedApplicationsAndChat(userMap, jobMap);

  console.warn('\n✅ Seed complete.\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
