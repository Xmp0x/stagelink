# StageLink — Master Implementation Backlog & Checklist

**Document status:** Living Backlog  
**Last updated:** October 30, 2026  
**Primary Specification:** [StageLink_Master_Development_Plan.md](file:///e:/Xmp1X-Projects/hamza-project/StageLink_Master_Development_Plan.md)

---

## 🧭 Critical Path Overview

```
[P0: Discovery & Setup]
        │
        ▼
[P1: Core Foundation (Next.js + Prisma DB + RBAC Auth)]
        │
        ▼
[P2: Profiles & Verification (Student Profile + Company Onboarding + Consent)]
        │
        ▼
[P3: Private CV Upload & Extraction Pipeline]
        │
        ▼
[P4: Listings CRUD & Search Engine (Internal Verified Listings Only)]
        │
        ▼
[P5: Applications Lifecycle & Pipeline]
        │
        ▼
[P6: Bi-directional Explainable Matching Engine]
        │
        ▼
[P7: AI Internship Copilot (Internal Tools + Safety Guards)]
        │
        ▼
[P8: Admin Portal, Moderation, Analytics & A11y]
        │
        ▼
[P9: Production Readiness, Seed Data & Security Audit]
```

---

## Phase P0: Discovery, Architecture & Baseline Setup
*Exit Gate: Approved assumptions, runnable baseline repo structure, documented architecture and permissions matrix.*

- [x] **P0.1: Repository & Runtime Inspection**
  - Verify workspace state (confirmed clean repository, Node.js v24.14.1, npm 11.11.0, pnpm 8.15.5, Git 2.53.0).
  - Verify database and Docker status (Docker present; local DB connection strategy decided).
- [x] **P0.2: Project Reconciliations & Decisions Documented**
  - Confirm English-only MVP, internal verified database only, PDF CV upload, explainable matching.
  - Create [docs/decisions.md](file:///e:/Xmp1X-Projects/hamza-project/docs/decisions.md).
- [x] **P0.3: System Architecture Specification**
  - Modular monolith, Next.js App Router, Prisma ORM, private file storage abstraction, AI provider adapter pattern.
  - Create [docs/architecture.md](file:///e:/Xmp1X-Projects/hamza-project/docs/architecture.md).
- [x] **P0.4: Authorization & Permissions Matrix**
  - Object-level security matrix across Guest, Student, Company Member, Company Admin, Platform Admin.
  - Create [docs/permissions-matrix.md](file:///e:/Xmp1X-Projects/hamza-project/docs/permissions-matrix.md).
- [x] **P0.5: API & Service Contracts**
  - Document all public, student, company, and admin endpoints with request/response schemas and error models.
  - Create [docs/api-contracts.md](file:///e:/Xmp1X-Projects/hamza-project/docs/api-contracts.md).
- [x] **P0.6: Risk Register & Privacy Safeguards**
  - Untrusted CV handling, prompt injection defense, CNDP / Moroccan Law 09-08 compliance outline, scam prevention.
  - Create [docs/risk-register.md](file:///e:/Xmp1X-Projects/hamza-project/docs/risk-register.md).
- [x] **P0.7: Version Control & Environment Templates**
  - Initialize Git repo, create `.gitignore` and comprehensive `.env.example`.

---

## Phase P1: Foundation (App Core, Database, Auth & Design System)
*Exit Gate: Signup/login with secure session, role redirection, RBAC middleware, typed Prisma models, design tokens, unit/integration tests passing.*

- [x] **P1.1: Next.js + TypeScript + Tailwind Setup**
  - Initialize Next.js 14 App Router project with TypeScript strict mode and Tailwind CSS.
  - Configure path aliases (`@/*`).
  - Configure base layout, typography, and color tokens (premium modern professional SaaS theme).
- [x] **P1.2: Prisma Database Schema & Client**
  - Define schema: `User`, `StudentProfile`, `Company`, `CompanyMembership`, `CompanyVerification`, `Internship`, `Application`, `CVDocument`, `CVExtraction`, `Skill`, `MatchResult`, `ChatConversation`, `ChatMessage`, `Notification`, `AuditEvent`.
  - Add indexes, unique constraints, foreign keys, and soft delete / audit fields.
  - Setup migration workflow and seed script foundation.
- [x] **P1.3: Authentication & Session Management**
  - Implement secure password hashing (Argon2id / bcrypt).
  - Implement email/password signup and login endpoints.
  - Session management with JWT or secure server-side session cookies.
  - Role-based redirection (Student -> `/student/dashboard`, Company -> `/company/dashboard`, Admin -> `/admin`).
- [x] **P1.4: Server-Side Authorization Guard & Middleware**
  - RBAC utility helpers (`requireUser`, `requireRole`, `requireCompanyMembership`).
  - Strict tenant boundary checks to prevent IDOR vulnerabilities.
- [x] **P1.5: Shared UI Shell & Component Library**
  - Navbar with role-specific navigation and state.
  - Accessible button, input, badge, modal, card, and toast components.
  - Responsive layout shells for Public, Student, Company, and Admin portals.
- [x] **P1.6: P1 Verification & Testing**
  - Unit tests for password hashing and auth utilities.
  - Integration tests for signup, login, session validation, and unauthorized 401/403 protection.
  - Full production build (`npm run build`) passing with static + dynamic route generation.

---

## Phase P2: Profiles & Organization Verification
*Exit Gate: Student profile completion with discoverability consent; Company profile creation and Admin verification workflow.*

- [x] **P2.1: Student Profile CRUD & Completeness Engine**
  - Profile fields: bio, city, institution, degree, academic year, availability dates, preferred modality, duration.
  - Education, skills, languages, and portfolio link management.
  - Profile completeness percentage calculator with actionable next steps.
  - Candidate discoverability consent toggle (defaults to false / private per Moroccan Law 09-08).
- [x] **P2.2: Company Onboarding & Profile Management**
  - Company creation: legal name, sector, city, address, website, description, contact details.
  - Company membership roles (`OWNER`, `MEMBER`, `RECRUITER`).
  - Verification submission with RC/ICE registration numbers and audit logging.
- [x] **P2.3: Admin Verification Queue**
  - Admin view of pending company verification requests.
  - Approve / Reject action with mandatory reason, status updates, and audit log creation.
  - Guard: Unverified companies cannot publish listings or search candidates.
- [x] **P2.4: P2 Verification & Testing**
  - Test student profile completeness engine and discoverability privacy defaults.
  - Full production build (`npm run build`) passing with all P2 API routes and UI pages.

---

## Phase P3: Private CV Upload & Extraction Pipeline
*Exit Gate: Secure PDF upload, private storage access control, deterministic + LLM-assisted text parsing, user review diff, and safe profile sync.*

- [ ] **P3.1: Private Storage Service Abstraction**
  - Local disk adapter (dev) and S3/R2 adapter (prod).
  - Storage paths outside public root (`/storage/private/...`).
  - Short-lived signed download tokens for authorized callers only.
- [ ] **P3.2: PDF Upload Endpoint & Strict Validation**
  - MIME type verification (magic bytes check, not just file extension).
  - File size limits (max 5MB) and page limit safeguards.
  - Rejection of corrupt or malicious files.
- [ ] **P3.3: CV Text & Entity Extraction Pipeline**
  - Deterministic text extractor (pdf-parse / pdf2json) with scanned PDF fallback warning.
  - Structured extraction parser: skills, education, experience, languages, contact info.
  - Confidence scoring and provenance per extracted field.
- [ ] **P3.4: Student Extraction Review & Diff UI**
  - Visual diff: current profile vs. CV extracted suggestions.
  - Field-by-field acceptance or dismissal before writing to DB.
  - Zero destructive changes without explicit student confirmation.
- [ ] **P3.5: P3 Verification & Testing**
  - Test valid PDF upload, corrupted upload rejection, oversized file rejection.
  - Test private storage access authorization (Student B cannot access Student A's CV).
  - Test profile diff application.

---

## Phase P4: Internship Listings & Search Engine
*Exit Gate: Verified companies can create/manage listings; moderation workflow; public search with multi-criteria filters over real DB records.*

- [ ] **P4.1: Internship Listing CRUD & State Machine**
  - States: `draft` -> `pending_review` -> `published` -> `paused` -> `closed` -> `expired`.
  - Fields: title, sector, location (Moroccan cities), modality (remote/on-site/hybrid), duration, start/deadline, required/preferred skills, compensation.
  - Form validation with strict date ordering (deadline >= today, start >= deadline).
- [ ] **P4.2: Admin Moderation Workflow**
  - Admin queue for `pending_review` listings.
  - Approve, reject with reason, or pause listings.
- [ ] **P4.3: Public & Student Search API**
  - Multi-attribute filtering: keyword, field, Moroccan city, modality, duration, paid/unpaid.
  - Strict visibility filter: ONLY `published` listings from `approved` companies where deadline is active.
  - Database pagination, sorting (newest, deadline approaching).
- [ ] **P4.4: Search UI & Listing Details**
  - Responsive search interface with filter sidebar and active filter chips.
  - Listing detail page with company badge, requirements, eligibility check, and application CTA.
  - Honest empty states when no listings match (never inject third-party or fake listings).
- [ ] **P4.5: Saved / Bookmarked Listings**
  - Toggle save listing for authenticated students.
  - Student "Saved Opportunities" management view.
- [ ] **P4.6: P4 Verification & Testing**
  - Test listing state transitions and permissions.
  - Verify unpublished/draft/expired listings never appear in public search.
  - Test search filters with exact database fixtures.

---

## Phase P5: Application Pipeline & Candidate Management
*Exit Gate: Students submit applications with CV selection & message; companies manage pipeline; full state transition audit trail.*

- [ ] **P5.1: Application Submission & Integrity Constraints**
  - Submission modal: CV selection, cover note / motivation, destination confirmation.
  - Hard constraint: Unique active application per (student, internship).
  - State machine: `submitted` -> `under_review` -> `shortlisted` -> `interview` -> `accepted` | `rejected` | `withdrawn`.
- [ ] **P5.2: Student Application Tracking**
  - Student "My Applications" dashboard.
  - Status progression timeline with timestamps and feedback notes.
  - Student withdrawal capability (if in allowed state).
- [ ] **P5.3: Company Candidate Pipeline (ATS)**
  - Kanban / column view of applicants by status.
  - Candidate detail modal with CV view, profile summary, and match explanation.
  - Status change actions (shortlist, invite to interview, reject with feedback).
  - Access control: Company members can ONLY see applications to their own listings.
- [ ] **P5.4: Application Event Audit & Notifications**
  - Record every transition in `ApplicationEvent` with actor ID and timestamp.
  - In-app notification generated for student upon status update.
- [ ] **P5.5: P5 Verification & Testing**
  - Test duplicate application prevention.
  - Test valid vs. invalid status transitions.
  - Test tenant isolation (Company B cannot read Company A's applicants).

---

## Phase P6: Bi-directional Explainable Matching Engine
*Exit Gate: Deterministic compatibility algorithm with hard criteria filtering, skill taxonomy normalization, and transparent score explanations.*

- [ ] **P6.1: Skills & Taxonomy Normalization Catalog**
  - Canonical skills dictionary with synonyms (e.g., "React.js" = "React", "Figma" = "UI Design").
  - Moroccan city normalization.
- [ ] **P6.2: Eligibility Rules Engine (Step A & B)**
  - Hard constraints: availability date, minimum duration, mandatory required skills, modality.
  - Categorical eligibility determination (`eligible` vs `not_eligible` with specific reason).
- [ ] **P6.3: Weighted Relevance Scoring (Step C)**
  - Configurable weights: Skills (35%), Education (15%), Location/Modality (15%), Field (15%), Duration (10%), Language (10%).
  - Heuristic score calculation: `0` to `100`.
  - Versioned scoring algorithm (`score_version: "1.0.0"`).
- [ ] **P6.4: Explainability & Evidence Breakdown (Step E)**
  - Matched skills list, missing required skills list, location compatibility explanation.
  - Clear UI disclaimer: "Compatibility heuristic, not an employment guarantee".
- [ ] **P6.5: Company-Side Candidate Discovery**
  - Recommend discoverable students to verified companies for specific active listings.
  - Strict privacy rule: ONLY students with `discoverabilityConsent = true` are queryable.
- [ ] **P6.6: P6 Verification & Testing**
  - Deterministic test fixtures verifying reproducible score outputs.
  - Hard requirement failure immediately returns `not_eligible`.
  - Privacy test verifying opted-out students are excluded.

---

## Phase P7: AI Internship Copilot (Internal Tools & Safety)
*Exit Gate: Profile-aware chat assistant querying only internal DB through vetted tools; strict prompt injection defenses; no auto-submit without student confirmation.*

- [ ] **P7.1: Model Provider Adapter & Fallback**
  - Unified interface: `generateResponse`, `streamResponse`.
  - Mock provider (zero cost, predictable test double) + Gemini/OpenAI adapter.
  - Graceful fallback when AI is disabled (`AI_ENABLED=false`).
- [ ] **P7.2: Internal Authorized Tool Registry**
  - `getMyProfile`: retrieves authenticated student profile only.
  - `searchPublishedInternships`: queries internal DB for active published offers.
  - `getInternship`: retrieves details for specific internal listing ID.
  - `rankMyMatches`: runs Phase 6 matching engine for current student.
  - `getMyApplications`: retrieves active applications for current student.
  - `saveInternship`: bookmarks listing for current student.
  - `prepareApplicationDraft`: generates personalized motivation letter.
- [ ] **P7.3: Safety Boundaries & Submission Guard**
  - Tool execution security: tenant boundaries enforced in backend tool handlers.
  - ABSOLUTE GUARD: `submitApplication` cannot be triggered autonomously by LLM. Must render interactive confirmation card for student click.
  - Strict prompt instructions forbidding hallucinated listings or external web data.
- [ ] **P7.4: Chat UI & Interactive Cards**
  - Persistent conversation history per student.
  - Listing result cards rendered directly in chat with direct links.
  - Rate limiting (token caps and requests per minute).
- [ ] **P7.5: P7 Verification & Testing**
  - Test tool execution scoping (student cannot query another student's profile via AI).
  - Test anti-hallucination guard when database has 0 matching listings.
  - Test prompt injection defense (CV or user prompt instructing AI to bypass permissions).

---

## Phase P8: Admin Portal, Moderation, Analytics & A11y
*Exit Gate: Full moderation and auditing capability, security controls, accessible UI, responsive design.*

- [ ] **P8.1: Platform Admin Operations**
  - Company verification review with document preview.
  - Internship listing moderation queue.
  - User suspension and report handling.
  - Comprehensive audit event log viewer.
- [ ] **P8.2: Platform Health & Aggregated Analytics**
  - Metrics: active listings, registered students, submitted applications, verified companies.
  - Privacy guarantee: No personal identifiable data or CVs in aggregate endpoints.
- [ ] **P8.3: Accessibility (WCAG 2.1 AA) & Mobile Responsiveness**
  - Full keyboard navigation and visible focus rings.
  - Semantic HTML landmarks and ARIA attributes for dialogs and menus.
  - Color contrast verification across all themes.
  - Mobile testing across responsive viewports.
- [ ] **P8.4: P8 Verification & Testing**
  - RBAC security test: non-admin accounts blocked from all `/api/admin/*` endpoints.
  - Accessibility audit via automated checks.

---

## Phase P9: Production Readiness, Seed Data & Release Gates
*Exit Gate: Robust migration pipeline, realistic labeled DEMO data, health check, automated test suite passing.*

- [ ] **P9.1: Realistic Moroccan Demo Seed Data**
  - Labeled `[DEMO]` companies (e.g., Tangier Med Logistics, Casablanca Fintech Lab).
  - Labeled `[DEMO]` internships across Moroccan tech, engineering, and business hubs.
  - Demo student accounts for end-to-end testing.
- [ ] **P9.2: Operations, Logging & Healthcheck**
  - `/api/health` endpoint verifying database connectivity.
  - Structured request logging with request correlation IDs.
- [ ] **P9.3: Comprehensive E2E Verification**
  - Journey 1: Student registration -> Profile -> CV upload & parse -> Save job -> Apply.
  - Journey 2: Company registration -> Verification request -> Admin approval -> Post listing.
  - Journey 3: Company reviews candidate -> Changes status to interview -> Student receives notification.
  - Journey 4: Student queries AI copilot -> Gets verified internal listing card -> Confirmed application draft.
  - Journey 5: Security boundary tests (IDOR, role spoofing, cross-tenant isolation).
