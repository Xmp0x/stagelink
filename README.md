# StageLink 🎓

> **AI-powered internship matching platform for Moroccan students and companies.**  
> Built with Next.js 14 App Router · PostgreSQL / Prisma · Tailwind CSS · AI Copilot

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Local Development](#local-development)
4. [Running Tests](#running-tests)
5. [Deploy to Vercel (Recommended)](#deploy-to-vercel-recommended)
6. [Deploy to Netlify](#deploy-to-netlify)
7. [Environment Variables Reference](#environment-variables-reference)
8. [Demo Accounts](#demo-accounts)
9. [Architecture Notes](#architecture-notes)

---

## Project Overview

StageLink is a full-stack web application that connects Moroccan university students with internship opportunities at Moroccan companies. Key features include:

- **Student profiles** with CV upload (PDF extraction & parsing)
- **Company internship listings** with detailed requirements
- **Explainable AI matching engine** — scores candidates and provides human-readable match explanations
- **Application pipeline** (ATS) — complete from apply → shortlist → interview → offer → accepted
- **AI Internship Copilot** — conversational assistant that helps students find and apply to internships
- **Admin portal** — anonymized analytics, audit log, user governance
- **Privacy controls** — Moroccan Law 09-08 consent management

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2 (App Router, React Server Components) |
| Language | TypeScript 5 |
| Database | PostgreSQL 14+ via Prisma ORM |
| Styling | Tailwind CSS 3 |
| Auth | Custom JWT sessions (jose) |
| AI | Pluggable provider (mock / Gemini / OpenAI) |
| File Storage | Local filesystem (dev) / S3-compatible (prod) |
| Testing | Vitest + Testing Library |
| Deployment | Netlify (Functions + CDN) |

---

## Local Development

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL) **or** a PostgreSQL 14+ instance

### 1 — Clone and install

```bash
git clone https://github.com/YOUR-ORG/stagelink.git
cd stagelink
npm install
```

### 2 — Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and set at minimum:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stagelink?schema=public"
NEXTAUTH_SECRET="any-32-char-random-string-for-dev"
NEXTAUTH_URL="http://localhost:3000"
```

### 3 — Start PostgreSQL with Docker

```bash
docker run -d \
  --name stagelink-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=stagelink \
  -p 5432:5432 \
  postgres:16-alpine
```

### 4 — Push the database schema

```bash
npx prisma db push
```

### 5 — Seed demo data (optional)

```bash
node scripts/seed.mjs
```

Seed creates Moroccan demo companies, student profiles, internship listings, and an admin account. All seed records are clearly labeled `[DEMO]`.

### 6 — Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Running Tests

```bash
npm test           # run all tests once
npm run test:watch # watch mode
```

All 49 tests across 13 suites should pass.

---

## Deploy to Vercel (Recommended)

Vercel provides native, zero-configuration hosting for Next.js App Router applications.

### Step 1 — Import Project to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Connect your GitHub account and import the repository: **`Xmp0x/stagelink`**
3. Framework Preset: **Next.js** (auto-detected)
4. Root Directory: `./` (default)

### Step 2 — Provision a Cloud Database
Before finishing the import, ensure you have a cloud PostgreSQL database:
- **[Neon](https://neon.tech)** (Recommended: free serverless PostgreSQL, zero idle cost)
- Or **[Supabase](https://supabase.com)** (Free PostgreSQL + optional S3-compatible storage)

Copy the database connection string:
```
postgresql://USER:PASSWORD@HOST:5432/stagelink?sslmode=require
```

### Step 3 — Configure Environment Variables in Vercel
In the Vercel project configuration page (before clicking Deploy), expand **Environment Variables** and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | Connection string to cloud database |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` output | Secret string (at least 32 characters) |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` | (Or set to your production domain) |
| `NODE_ENV` | `production` | Set by Vercel automatically |
| `AI_ENABLED` | `true` | Enable Copilot features |
| `AI_PROVIDER` | `mock` | Use `mock` for zero-cost demo or `gemini` for live AI |
| `STORAGE_PROVIDER` | `local` | Or `s3` for persistent cloud storage |
| `ADMIN_INITIAL_EMAIL` | `admin@stagelink.ma` | Admin account for seed script |
| `ADMIN_INITIAL_PASSWORD` | `Admin123!` | Secure admin password |

### Step 4 — Deploy
Click **Deploy**. Vercel will install dependencies, generate Prisma Client via `postinstall`, and build the static & serverless routes.

### Step 5 — Initialize Database Schema & Demo Data
From your local machine or terminal, run once against the cloud database:
```bash
# Push Prisma schema to your cloud DB
npx prisma db push

# (Optional) Seed Moroccan demo data (companies, listings, demo students)
node scripts/seed.mjs
```

---

## Deploy to Netlify

### Step 1 — Push to GitHub

```bash
git remote add origin https://github.com/YOUR-ORG/stagelink.git
git push -u origin master
```

### Step 2 — Provision a Cloud PostgreSQL Database

Netlify does **not** provide a database. Use one of:

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| **[Neon](https://neon.tech)** | ✅ Generous | Serverless Postgres, fastest cold-start |
| **[Supabase](https://supabase.com)** | ✅ 500 MB | Also provides S3-compatible file storage |
| **[Railway](https://railway.app)** | ✅ \$5 credit | Simple setup |

After creating the database, copy the connection string (PostgreSQL URL). It looks like:

```
postgresql://USER:PASSWORD@HOST:5432/stagelink?sslmode=require
```

### Step 3 — Connect Repo to Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Choose **GitHub** and select your repository
3. Netlify auto-detects Next.js; confirm the build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
4. Click **Deploy site** (the first deploy will fail — that's OK, we need env vars first)

### Step 4 — Set Environment Variables in Netlify

Go to **Site → Environment variables** and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your cloud PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random 32-byte secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://YOUR-SITE.netlify.app` |
| `NODE_ENV` | `production` |
| `AI_PROVIDER` | `mock` (or `gemini` for live AI) |
| `AI_API_KEY` | Your Gemini/OpenAI API key (if not mock) |
| `AI_ENABLED` | `true` |
| `STORAGE_PROVIDER` | `local` (demo) or `s3` (persistent) |
| `ADMIN_INITIAL_EMAIL` | `admin@stagelink.ma` |
| `ADMIN_INITIAL_PASSWORD` | A strong password |

### Step 5 — Apply Database Schema

Run this once from your local machine against the production database:

```bash
DATABASE_URL="postgresql://..." npx prisma db push
```

Or using the Netlify CLI:

```bash
npm install -g netlify-cli
netlify env:set DATABASE_URL "postgresql://..."
netlify dev          # opens a local proxy with prod env vars
# then in another terminal:
npx prisma db push
```

### Step 6 — Seed Production Data (Optional)

```bash
DATABASE_URL="postgresql://..." node scripts/seed.mjs
```

### Step 7 — Trigger a New Deploy

In the Netlify dashboard → **Deploys** → **Trigger deploy** → **Deploy site**.

### Step 8 — Verify

- Open `https://YOUR-SITE.netlify.app/api/health` — should return `{ "status": "ok" }`
- Log in with `admin@stagelink.ma` and verify the admin portal

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | — | JWT signing secret (32+ bytes) |
| `NEXTAUTH_URL` | ✅ | — | Public URL of the deployment |
| `NODE_ENV` | — | `development` | `production` on Netlify |
| `AI_ENABLED` | — | `true` | Enable/disable AI copilot |
| `AI_PROVIDER` | — | `mock` | `mock` / `gemini` / `openai` |
| `AI_API_KEY` | — | — | API key for live AI provider |
| `AI_MODEL` | — | `gemini-1.5-flash` | Model name |
| `STORAGE_PROVIDER` | — | `local` | `local` / `s3` |
| `STORAGE_LOCAL_PATH` | — | `./storage/private` | Local storage directory |
| `STORAGE_S3_BUCKET` | — | — | S3 bucket name |
| `STORAGE_S3_REGION` | — | `auto` | S3 region |
| `STORAGE_S3_ENDPOINT` | — | — | Custom S3 endpoint (R2, Supabase) |
| `STORAGE_S3_ACCESS_KEY_ID` | — | — | S3 access key |
| `STORAGE_S3_SECRET_ACCESS_KEY` | — | — | S3 secret key |
| `ADMIN_INITIAL_EMAIL` | — | — | Admin account email for seed |
| `ADMIN_INITIAL_PASSWORD` | — | — | Admin account password for seed |
| `RATE_LIMIT_AI_RPM` | — | `10` | AI requests per minute |
| `RATE_LIMIT_API_RPM` | — | `60` | General API requests per minute |

---

## Demo Accounts

After running `node scripts/seed.mjs`:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@stagelink.ma` | `Admin123!` |
| Student | `student1@student.ma` | `Student123!` |
| Company HR | `hr@ynna.ma` | `Company123!` |

> All demo accounts are labeled `[DEMO]` and are for demonstration purposes only.

---

## Architecture Notes

### Storage — ⚠️ Netlify Ephemeral Filesystem

Netlify functions run on ephemeral containers. Files written to the filesystem (including CV PDFs with `STORAGE_PROVIDER=local`) **will be lost on the next function invocation** or deploy.

**For demo/PFE presentation**: `local` storage is acceptable — uploaded CVs survive within a warm Lambda instance. Live demonstrations work fine.

**For production persistence**: Switch to `STORAGE_PROVIDER=s3` and configure Cloudflare R2 (free egress) or AWS S3. The `StorageProvider` interface in `src/lib/storage/index.ts` is designed for this swap.

### AI Copilot

- `AI_PROVIDER=mock` uses a zero-cost deterministic response generator — safe for demos.
- `AI_PROVIDER=gemini` requires a valid `AI_API_KEY` from [Google AI Studio](https://aistudio.google.com).

### Database Cold Start

Prisma generates a Lambda-compatible binary (`rhel-openssl-3.0.x`) included in the Netlify function bundle. The first request after a cold start may take 2–3 seconds. Subsequent requests are fast.

---

## License

Academic / PFE project. All rights reserved.
