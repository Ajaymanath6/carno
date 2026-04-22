# mapmyGig

A production-ready, location-aware jobs marketplace built as a single **Next.js** monolith. Job seekers can browse and apply to jobs on an interactive map; employers can post jobs and manage their company profiles; admins can moderate the platform.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15+ (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| Language | JavaScript (.js / .jsx) |
| Auth | Clerk (`@clerk/nextjs`) |
| Database | PostgreSQL via Prisma ORM |
| Cache | Redis (`ioredis`) with in-memory fallback |
| Maps | Leaflet + react-leaflet |
| Payments | Razorpay |
| Email | nodemailer |
| Realtime | Server-Sent Events (SSE) |
| Icons | @carbon/icons-react, @remixicon/react |
| Search | fuse.js (fuzzy) |

---

## Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ running locally (or a cloud DB URL)
- Redis (optional — app falls back to in-memory cache)
- A [Clerk](https://clerk.com) account
- A [Razorpay](https://razorpay.com) account (test keys work for dev)

### 1. Clone and install

```bash
git clone https://github.com/Ajaymanath6/carno.git
cd carno            # or whatever the folder is named
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in every variable. See the sections below for each service.

### 3. Database (Prisma + PostgreSQL)

```bash
# Push the schema to your database (dev / first run)
npx prisma migrate dev --name init

# Generate the Prisma client
npx prisma generate

# Optional: open Prisma Studio to inspect the DB
npx prisma studio
```

### 4. Seed the database

```bash
node prisma/seed.js
```

This populates reference tables (pincodes, job titles, colleges) and creates a demo admin user.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | Non-pooled URL (for Prisma migrations behind a pooler) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Path for sign-in page (e.g. `/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Path for sign-up page (e.g. `/sign-up`) |
| `REDIS_URL` | Redis connection string — leave empty for in-memory fallback |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP port (usually `587` or `465`) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `EMAIL_FROM` | From address for outgoing emails |
| `NEXT_PUBLIC_APP_URL` | Public URL of your deployment |

---

## Clerk Setup

1. Create a new application at [dashboard.clerk.com](https://dashboard.clerk.com).
2. Under **API Keys**, copy the publishable key and secret key into `.env.local`.
3. Under **Paths**, set:
   - Sign-in URL → `/sign-in`
   - Sign-up URL → `/sign-up`
   - After sign-in → `/dashboard`
   - After sign-up → `/onboarding`
4. *(Optional)* If you are deploying to a custom domain, configure a **proxy URL** (see `proxy.ts`) so Clerk traffic passes through your domain.

---

## Redis Setup

Redis is **optional**. If `REDIS_URL` is not set (or Redis is unreachable), the app automatically uses an in-memory `Map` as a fallback cache.

For local development:

```bash
# macOS with Homebrew
brew install redis
brew services start redis

# Ubuntu / Debian
sudo apt install redis-server
sudo systemctl start redis
```

For production, use a managed service such as [Upstash](https://upstash.com) (serverless-friendly) or [Redis Cloud](https://redis.com/redis-enterprise-cloud/).

---

## Razorpay Setup

1. Sign up at [razorpay.com](https://razorpay.com) and create a test account.
2. Go to **Settings → API Keys** and generate a key pair.
3. Copy `Key ID` → `RAZORPAY_KEY_ID` and `Key Secret` → `RAZORPAY_KEY_SECRET` in `.env.local`.
4. For webhooks (payment verification), set your webhook endpoint to `https://yourdomain.com/api/payments/verify` and add the webhook secret if used.

---

## Deployment Notes

### Vercel (recommended)

```bash
npm install -g vercel
vercel --prod
```

- Set all environment variables in the Vercel dashboard under **Settings → Environment Variables**.
- For Prisma, set `DATABASE_URL` to a connection-pooled URL and `DIRECT_URL` to a direct URL (required for migrations).
- Run migrations via `npx prisma migrate deploy` in the Vercel build command or a separate CI step.

### Docker / self-hosted

```bash
# Build production image
docker build -t mapmygig .

# Run (pass env via --env-file or -e flags)
docker run -p 3000:3000 --env-file .env.production mapmygig
```

---

## Project Structure (phases)

```
/app              # Next.js App Router pages and API routes
  /api            # REST-style JSON route handlers
  /(public)       # Unauthenticated pages (landing, jobs, companies)
  /(auth)         # Clerk sign-in / sign-up pages
  /onboarding     # New-user onboarding flow
  /dashboard      # Authenticated user dashboard
  /profile        # User profile management
  /applications   # Application tracking
  /messages       # Chat / conversations
  /admin          # Admin panel
/components       # Shared React components
/lib              # Utilities, services, Prisma, Redis helpers
  /services       # Business logic (job, user, company, search, …)
/prisma           # Schema + seed
/public           # Static assets
```

---

## Phase Build Plan

| Phase | Contents | Status |
|---|---|---|
| 1 | Project bootstrap (config, layout, env) | ✅ Complete |
| 2 | Prisma schema + seed + lib/prisma.js | Pending |
| 3 | Clerk auth, middleware, onboarding | Pending |
| 4 | Services and utilities (redis, cache, email, …) | Pending |
| 5 | API routes | Pending |
| 6 | UI pages and components | Pending |
| 7 | Final polish, seed data, README update | Pending |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:migrate:prod` | Deploy migrations (production) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed the database |
| `npm run db:reset` | Reset DB and re-run migrations (dev only) |

---

## License

MIT
