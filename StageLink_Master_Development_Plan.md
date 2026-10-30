# StageLink — Master Product & Development Plan

**Document type:** AI coding-agent execution specification  
**Version:** 1.0 — October 30, 2026  
**Status:** Planning baseline; implementation not yet started  
**Product:** Morocco-first internship discovery, recruitment and AI matching platform  
**Working name:** StageLink (renameable; prior working document used “StageConnect CMC”)

> **Instructions for Codex / coding agents:** This file is the authoritative product and technical baseline for this implementation. Read it entirely before coding. Inspect the repository and existing conventions first. Create a task checklist, implement in small vertically integrated increments, run tests, and report real results. Never invent completed features or passing tests. Do not treat example fixtures as live internship opportunities.

## 0. Confirmed decisions and source reconciliation

The existing `StageConnect CMC — Plan.md` is an earlier, narrower PFE concept. It includes a mobile-only, zero-budget, French-first, no-upload, no-chatbot demonstration. **This master specification supersedes those incompatible assumptions** following the latest product discussion, while retaining the valuable focus on Moroccan students, CMC/Tangier as a possible pilot, real company verification, research ethics, and privacy.

| Area | Decision for this build |
|---|---|
| Product audience | Moroccan interns/students and companies; Tangier/CMC may be a pilot, **not a hard restriction** |
| MVP target | **Advanced functional MVP**, not just mockups or static demo |
| Application language | **English only at launch**, architecture must permit French/Arabic/Darija later |
| CV | **Secure PDF upload** + parsing with student confirmation |
| Discovery source | **Only companies and active internship listings stored in the platform database** |
| AI assistant | Profile-aware chatbot, internal search, matching, guidance, application drafting |
| External data | **No browsing, external scraping, or importing jobs from third-party sites** |
| Applications | Submit on platform after explicit student confirmation; track progress |
| Matching | Both student → listings and company → opted-in students; explainable scores |
| Account types | Student, company, admin; institution-ready schema only |
| Operating cost | Prefer a low-cost development path; zero ongoing cost is **not guaranteed** |
| Launch readiness | Security, privacy, permissions, tests, and real workflows required |

**Open product decisions (do not silently assume):** legal entity/ownership; initial pilot school(s); domain and hosting; whether companies can invite students proactively; application attachments beyond CV; commercial pricing. Choose reversible defaults where possible and document assumptions. No payment implementation in this MVP.

## 1. Mission and product outcome

A student creates a professional profile, securely uploads a CV, confirms extracted information, discovers relevant internships, asks an AI assistant to find fitting opportunities from **the internal verified database**, and applies with consent. A company verifies its profile, publishes offers, reviews applications, and discovers candidates who opted into visibility. Administrators review companies and suspicious content and monitor platform activity.

**North-star metric:** number of genuine completed internship placements (only where confirmed). Supporting metrics: verified active listings, completed student profiles, meaningful matches, submitted applications, company response rate, retention, and reported scam incidents.

**Success criteria for pilot:** a complete end-to-end journey works for each role; recommendations are explainable and database-backed; no cross-user private-data leakage; mobile usability; transparent unavailable/empty states; demo dataset clearly labeled.

## 2. Personas and authorization boundaries

- **Guest:** View public published opportunities and publicly visible company details. Cannot see student profiles, chats, private CVs, or applications.
- **Student:** Manage own profile, uploaded CV, preferences, consent, saves, conversations, applications and notification settings. May view own matches and application status history.
- **Company member:** Manage only their organization's profile, listings, candidate inbox and recruitment pipeline. Access only opted-in candidate discovery fields and students who applied to that company. Membership and role must be verified server-side.
- **Platform admin:** Review verification, moderation and reports; use least-privilege tools with audited actions. Admin rights must not be inferred from client-provided role fields.
- **Educational institution:** Future extensibility only. Avoid building unrequested institutional dashboards now.

**Role design:** a user account may eventually belong to multiple organizations. Implement separate `users`, `company_memberships` and role/permission checks rather than relying on an editable `role` string alone.

## 3. Complete user journeys

### 3.1 Student onboarding

1. Sign up → verify email → accept terms/privacy → choose student role.
2. Complete name, city, institution, degree, academic year, availability, preferred locations, modality, duration, fields, languages, skills, portfolio links and optional professional bio.
3. Upload a PDF CV → private storage + type/size validation + malware scanning where supported → text extraction → structured extraction with confidence/uncertainty → review field-by-field → approve changes.
4. Show completeness score and clear next steps; student controls discoverability consent.
5. Display recommended internal, active, verified-company listings with explanations.
6. Save, compare and apply; track application status updates.

### 3.2 Student AI-assisted search

1. Open AI assistant. It may retrieve this authenticated student's approved profile fields and saved search preferences.
2. Student asks, e.g. “Find 2-month UI/UX internships in Tangier where Figma is useful.”
3. Agent calls authorized **internal** search endpoint (never outside the app).
4. Backend filters published, active listings from verified/approved companies, then ranks matches and returns evidence.
5. Assistant renders actual listing cards linked by internal listing ID, explains skills/eligibility/missing requirements, and may ask only necessary follow-ups.
6. If no valid listings exist, say so and suggest adjusting filters—**never invent results**.
7. The assistant can prepare a cover letter or application; the student reviews and explicitly confirms before submission.

### 3.3 Company journey

1. Register → company creation → provide website/identity/contact details → request verification.
2. Admin verifies legitimate company identity; before approval, company cannot publish publicly visible listings or browse candidate directory.
3. Create draft listing with title, sector, department, location, modality, duration, start/deadline, required vs preferred skills, qualifications, languages, paid/unpaid/unspecified, open positions, description, contact policy.
4. Submit for moderation; publish only after approval. Expired/closed listings must not appear in results.
5. View candidate applications, search/filter, shortlist, request interview, record decisions, and notify affected students.
6. Browse **only students who explicitly opted into company discovery**; do not reveal their private CV unless separately authorized.

### 3.4 Admin journey

Review and approve/reject companies with reason and audit event → moderate listings → respond to reports → suspend abusive actors → view aggregates and system health. Restrict and audit any access to sensitive files or personal information.

## 4. Functional modules and acceptance criteria

### F01 Authentication & access

- Email/password login, verification, secure recovery, logout, session refresh, role-specific redirects.
- Server-side route and object-level authorization; no unauthenticated/private leakage.
- **Acceptance:** student A cannot read student B's CV/chat/application; company A cannot read company B's applications; direct endpoint attacks return 403/404.

### F02 Student profile and preferences

- Structured skills, education, projects, languages, links, availability, duration, location, work-mode preferences, profile visibility control.
- Explicit validation, accessible forms, save feedback, profile completeness.
- **Acceptance:** edit, reload and account export/delete requests work as designed; bad URLs and invalid dates rejected.

### F03 Private CV upload and parsing

- PDF only initially; verify MIME signature, file size/page limits, upload permission and private storage; generate a non-public file reference.
- Extract text (with a useful error for unreadable scanned PDFs); extract suggestions using deterministic parsing and optionally an LLM; attach provenance/confidence where possible.
- Always show confirmation diff before writing profile fields; treat CV content as **untrusted data**.
- **Acceptance:** upload and extract a normal text PDF; invalid/oversized files fail; failed extraction never destroys profile; no public CV URL.

### F04 Company verification and internship CRUD

- Company profiles, memberships, submission workflow; listing states `draft`, `pending_review`, `published`, `paused`, `rejected`, `closed`, `expired`.
- Prevent public search access to unverified/declined companies, draft/unapproved/expired offers.
- **Acceptance:** approved company posts and edits listing; unauthorized company cannot mutate it; moderation action logged.

### F05 Discovery and saved listings

- Keyword, field, city, remote/on-site/hybrid, duration, start, paid-status filters; pagination, sort, saved offers.
- Clear status of verified company, updated timestamp, application deadline, detail page and application CTA.
- **Acceptance:** combinations of filters operate on real database records; empty state is honest; bookmark toggle persists.

### F06 Bidirectional matching

- Student → internships and company → discoverable students. Eligibility rules first; rank eligible entities second.
- Explain both matches and gaps. Show score as **compatibility heuristic, not hiring probability**.
- **Acceptance:** hard requirement violation never passes as fully eligible; weights versioned/configurable; deterministic test fixtures produce reproducible rankings.

### F07 Application pipeline

- Draft, submitted, under_review, shortlisted, interview, accepted, rejected, withdrawn; enforce allowed transitions and permissions.
- Student reviews selected CV version, optional message/cover letter and destination before confirmed submit.
- Unique active application constraint; timeline/history of transitions with actor and timestamp.
- **Acceptance:** duplicate submission blocked; company can update only own candidates; student can withdraw when allowed; rejected states not silently reversed.

### F08 AI internship copilot

- English-only; user-specific context; backend tool calls; streamed responses; conversation persistence; profile/offer links; retrieval-based listing cards; application draft.
- Suggested tools: `getMyProfile`, `searchPublishedInternships`, `getInternship`, `rankMyMatches`, `getMyApplications`, `saveInternship`, `prepareApplication`, `submitApplication`.
- `submitApplication` is permitted **only after an explicit, separately validated student confirmation**; no implied consent from AI text.
- **Acceptance:** assistant answers against internal database; cannot use browser/external API/job feeds; cannot hallucinate IDs or statuses; no unauthorized company/student access; prompt injection tests pass.

### F09 Notifications

- In-app notifications for new relevant listings, application status changes, interviews and company actions; read/unread, preferences, deduplication.
- Email delivery optional behind provider abstraction and only for transactional messages, with explicit configuration.
- **Acceptance:** an application status transition creates correct student notification once.

### F10 Admin tools and analytics

- Queues for verification, moderation, reports; safe user suspension; audited actions; aggregate charts.
- **Acceptance:** no student data or CV exposed in aggregate API; nonadmins blocked from all admin endpoints.

## 5. Matching logic — v1 specification

**Step A — query and eligibility:** restrict to internal `published` listings under approved companies, non-expired deadlines, availability and other *explicitly mandatory* criteria. Classify constraints as hard or soft; do not reject students for unverified inferred abilities.

**Step B — normalize:** canonical skill names and synonyms (e.g. UI design / Figma), normalized Morocco city names, consistent duration units and language proficiency. Keep original human-facing text.

**Step C — weighted relevance (initial tunable example):**

| Feature | Weight |
|---|---:|
| Skills overlap (required/preferred separately) | 35% |
| Educational relevance | 15% |
| Location/work modality | 15% |
| Field/career alignment | 15% |
| Availability/duration | 10% |
| Language fit | 10% |

`score = 100 × Σ(weight_i × normalized_feature_i)` with weights summing to 1. Document thresholds, missing-data behavior and version. **Score is not an employment probability**. If mandatory criteria fail, clearly flag `not_eligible` rather than simply lowering the score.

**Step D — optional semantic rerank:** embeddings + pgvector only if quality warrants it; never infer possession of a hard requirement from similarity alone. Avoid costly full-corpus LLM ranking.

**Step E — evidence:** return `score`, `score_version`, eligibility status, factors matched, missing factors, and source listing/student IDs; both dashboards and AI use the same service.

**Privacy:** company-side recommendations include only discoverable students; do not rank by protected traits. Design fairness checks and manual override/review mechanisms.

## 6. AI architecture and safety

**Core architecture:** UI chat ↔ authenticated server endpoint ↔ model provider adapter ↔ approved internal tool registry ↔ application services ↔ PostgreSQL. The LLM does not connect directly to the database or arbitrary URLs.

**Tool contract:** validate schemas, user identity/authorization, input limits, pagination, result provenance, and idempotency. Never let the model invent a tool or access unrestricted SQL. Scope by student/company tenant at the backend.

**Retrieval policy:** only records from the platform's own DB; no web browsing, scraping, external internship APIs or third-party company directories. For a search result, always use canonical listing ID and fresh visibility/status checks.

**Memory:** persist conversation history per student with retention/deletion policy. Summarize long conversations carefully; the current DB remains the source of truth for listings and profile updates.

**Language:** all UI labels, chatbot replies, notification templates and listing-search UX in English. Store UI strings in an i18n-ready structure; add French, Arabic and Moroccan Darija only in future phases. Do not accidentally deploy mixed-language copy.

**Model cost management:** feature flag `AI_ENABLED`; configurable provider; token/rate caps; streaming and short tool outputs; cache non-personal computed match results. Core search must work when AI is offline; show a graceful unavailable state.

**Threats:** treat uploaded CVs, company descriptions and user chat as hostile untrusted text. Prevent prompt injection, secret leakage, cross-tenant tool invocation, unsafe HTML, automated mass application, and fabricated data. Confirm side effects through backend state, never model narrative alone.

## 7. Proposed implementation stack

- **App:** Next.js App Router, React, TypeScript (strict), Tailwind CSS, shadcn/ui; Motion only where beneficial.
- **DB:** PostgreSQL, Prisma migrations and typed data access; pgvector optional later.
- **Auth:** secure proven auth library/provider; sessions protected server-side, separate company memberships.
- **Storage:** private object storage for PDF CVs with short-lived authorized download links and auditability.
- **AI:** model-provider adapter and server-side structured tool calls; budget configurable.
- **Jobs:** durable queue for CV extraction, notifications and match refresh when needed; simple synchronous version only for safe short operations.
- **Testing:** Vitest/unit, API integration tests against test DB, Playwright E2E, accessibility tests.
- **Hosting:** provider-agnostic deployment; decide after budget and availability assessment. Secret management, backups, observability, migrations and SSL mandatory before public release.

Prefer a coherent modular monolith initially; avoid unnecessary microservices.

## 8. Suggested database entities

| Entity | Core content / constraints |
|---|---|
| `users` | identity, verified email, lifecycle state, timestamps |
| `student_profiles` | user FK unique, bio, city, preferences, discoverability consent |
| `student_education` | school, diploma, field, dates |
| `skills`, `student_skills` | normalized catalog; proficiency and evidence optional |
| `student_projects`, `student_languages` | optional student metadata |
| `cv_documents` | owner FK, private storage key, processing status, active version, timestamps |
| `cv_extractions` | structured suggestions, provenance/confidence, approval state |
| `companies` | legal display name, sector, profile, verified status |
| `company_memberships` | company/user FKs, company role, uniqueness |
| `company_verifications` | submitted evidence, admin decision, reason |
| `internships` | company FK, work modality, dates, duration, description, compensation, state |
| `internship_skills` | required/preferred, proficiency requirement |
| `applications` | student/internship FK, CV reference, message, current status, unique constraints |
| `application_events` | status transitions, actor, timestamp, notes |
| `saved_internships` | student/listing unique pair |
| `match_results` | subject/target, algorithm version, result factors, calculated timestamp |
| `chat_conversations`, `chat_messages` | student ownership, turns, tool metadata, retention |
| `notifications` | recipient FK, type, read state, dedupe key |
| `reports`, `audit_events` | abuse reporting and security trail |

**Enforce:** foreign keys, suitable composite indexes and unique constraints, privacy-safe deletes, UTC timestamps, soft delete only where justified, non-public storage keys, robust migration strategy. Document data retention and erasure behavior before production.

## 9. API/service contracts (illustrative; choose exact routing conventions)

| Action | Endpoint / service | Authorized caller |
|---|---|---|
| Read/update my profile | `GET/PATCH /api/me/profile` | Student |
| Upload/process CV | `POST /api/me/cv` | Student |
| Review/apply extraction | `GET/POST /api/me/cv/extractions/:id` | CV owner |
| Search listings | `GET /api/internships` | Public (published only) |
| Listing details | `GET /api/internships/:id` | Public for published listings |
| Create/edit company listing | `POST/PATCH /api/companies/:id/internships` | Authorized company member |
| Submit application | `POST /api/internships/:id/applications` | Student + explicit confirmation |
| My applications | `GET /api/me/applications` | Student |
| Company candidate pipeline | `GET /api/companies/:id/applications` | Authorized company member |
| Get student matches | `GET /api/me/matches` | Student |
| Get candidate matches | `GET /api/companies/:id/candidates` | Verified company + consent rules |
| Chat | `POST /api/ai/chat` | Student, rate-limited |
| Verify company/moderate | `POST /api/admin/...` | Admin only |

Every endpoint: validated input/output, pagination, auth and resource ownership, structured errors, request correlation ID. Maintain API contract tests.

## 10. Navigation and user experience

**Public:** Landing, Explore internships, Internship details, Company profile (public), Login, Register, Privacy, Terms, Contact/report.

**Student:** Dashboard (recommended jobs + completeness), Explore, Saved, Applications, AI Assistant, Profile/CV, Settings/consent, Notifications.

**Company:** Dashboard, Listings, Create/Edit listing, Applications pipeline, Candidate discovery (consent-gated), Company profile, Settings, Notifications.

**Admin:** Overview, Companies verification queue, Internship moderation, Reports, Accounts, Audits, Analytics.

**Design language:** premium modern professional SaaS; clear readable typography; neutral background, restrained primary/accent palette; accessible contrast; responsive and mobile-first; consistent empty/loading/error/success states; keyboard accessibility; clear explanations for AI output and verification badges. Produce low-fi flows → UI tokens/components → polished pages. Do not copy third-party brand designs.

## 11. Realistic delivery phases and gates

**Do not set fictional week estimates.** Estimate after repository inspection, team capacity and hosting choice. Implement one vertical feature at a time; update checklist with actual status.

| Phase | Implementation | Exit gate / evidence |
|---|---|---|
| P0 — Discovery | Repo inspection, reconcile existing code, dependency/budget analysis, PRD, architectural decisions, risk register | Approved assumptions, runnable dev environment, tracked backlog |
| P1 — Foundation | Next.js setup, DB, migrations, auth, sessions, role authorization, component tokens, CI | Signup/login + role protections tested |
| P2 — Profiles | Student forms, company profiles, verification workflow, consent controls | E2E onboarding works, RBAC tests pass |
| P3 — CV pipeline | Secure upload/storage, parsing job, review/approve extraction | Real test PDF to approved profile works; privacy tested |
| P4 — Listings & search | Company listing CRUD, moderation, public search/filter/detail/saves | Verified company publishes, student can discover, inactive invisible |
| P5 — Applications | Submit/withdraw, company pipeline, timeline, notifications | Student and company complete real application journey |
| P6 — Matching | Canonical skills, eligibility, weighted rank, explanations, bi-directional results | Deterministic scoring tests + opt-in privacy checks |
| P7 — AI copilot | Provider abstraction, internal tools, persistent chat, match search, drafting/consent | Evidence-backed AI results; injection and authorization tests |
| P8 — Admin & polish | Reporting, analytics, mobile UI, accessibility, errors, rate limits | Role-specific E2E regression + accessibility audit |
| P9 — Launch prep | Backups, logs, secret audit, privacy/legal review, deployment, monitoring, demo data | Production checklist signed; no fabricated offers |

**Suggested milestone demonstrations:** 1) onboard a student, 2) verify company and publish job, 3) submit application and change status, 4) get explainable recommendation, 5) chat finds same live record, 6) prove no unauthorized access.

## 12. Test matrix (minimum)

- **Auth/RBAC:** unauthenticated access; wrong student; wrong company; forged role; suspended account; stale session.
- **CV:** valid PDF, bad MIME/signature, oversized, blank/scanned PDF, malicious prompt text, unauthorized retrieval, upload cancellation.
- **Listings:** company draft, pending verification, rejected moderation, deadline elapsed, paused/closed, deleted, search/filter combinations, pagination.
- **Matching:** identical skills, synonym normalization, mandatory requirement failure, absent profile values, explainability, weighting reproducibility, opt-out.
- **Applications:** duplicate submission, race condition, illegal state transition, missing consent, unauthorized edits, notification dedupe.
- **Chat:** empty DB (says none); profile restriction; unapproved listing; malicious posting instructing AI to ignore policy; nonexistent listing ID; API outage; out-of-budget; explicit confirmation for submit.
- **UX:** mobile widths, focus order, keyboard, contrast, loading/error/offline/retry, text truncation, accessible forms.
- **Operations:** migration on fresh DB, backup restore dry run, missing env settings, healthcheck and structured logs.

## 13. Security, privacy and compliance

Personal data and CVs require a privacy-first approach. Collect minimum necessary information; explicit consent for candidate discoverability; private CV storage; authorization on every read; audit high-risk actions; protect data in transit/at rest; retention/deletion workflows; data access/export pathway. Legal review of Moroccan Law 09-08 and applicable CNDP obligations **before real launch**. Never imply legal compliance without review.

For anti-fraud, require company verification, content moderation, report pathways and a visible warning against sharing sensitive documents outside the platform. Distinguish verified organization identity from a guarantee of employment or safety.

## 14. Seed data and pilot strategy

Use fictional, clearly marked `DEMO` companies/listings only in development and demonstrations. Never present them as real opportunities. Pilot initially with CMC Tangier or another participating school **only with permission**; recruit and verify genuine partner companies before claiming an operational marketplace. Validate problem hypotheses with opt-in student surveys and company interviews; report real sample sizes honestly.

## 15. Developer workflow and agent operating rules

1. Read this plan and inspect repo tree, `README`, package files, DB state and existing tests.
2. Produce `docs/architecture.md`, `docs/decisions.md`, `docs/permissions-matrix.md` and `docs/api-contracts.md` as needed; do not stall on elaborate docs before building.
3. Maintain `TASKS.md` with ordered backlog items, dependencies and checkboxes; mark complete **only** after verification.
4. Design DB/access boundaries first, then develop vertical slices (UI + backend + migration + validation + tests).
5. Prefer stable, accessible components and clear naming; no giant unmaintainable files.
6. Use environment variables for secrets, supply `.env.example` without real keys; never commit CV files or credentials.
7. After each slice run lint, typecheck, unit/integration tests; run E2E at milestones. Record commands, outcomes and outstanding errors accurately.
8. If AI billing/inference access is unavailable, implement provider adapter and test doubles **clearly labeled**, not claim real AI is operating.
9. Stop and request explicit approval only for irreversible, cost-bearing or externally consequential actions (deployment, service purchases, emailing real people, submissions).
10. Never assume the earlier French-first/no-upload/no-AI PFE document overrides the current English-first advanced MVP.

## 16. Definition of Done

The advanced MVP is done **only when** a real authenticated student can register, upload and approve CV extraction, see real verified internal listings, obtain explainable recommendations, use the English chatbot to search **only those records**, explicitly submit an application, track its state; a verified company can post approved listings and process applicants; an admin can review verification/moderation; access tests and security/privacy checks pass; and the app is deployed to an approved environment with working logs and no mislabeled demo data.

## 17. Immediate next actions for the coding agent

1. Confirm whether a repository exists and inventory existing work before generating code.
2. Convert this document into prioritized backlog with critical path and acceptance-test links.
3. Decide and document hosting, auth/storage provider and AI budget assumptions (recommend low-cost defaults, no unapproved spending).
4. Implement P1 foundation as the first verified vertical increment.
5. Report what is genuinely working, how to run it, tests run, blockers and next milestone.

---

**Non-negotiable summary:** English-only MVP. Internal platform companies and listings exclusively. Secure PDF CV upload with confirmed parsing. Two-way explainable matching. AI chatbot that can discover and help apply but never submits without explicit confirmation. Real authorization, verification, privacy and end-to-end functionality—not a visual-only mockup.
