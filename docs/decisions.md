# StageLink — Architecture Decision Records (ADR) & Reconciliations

## ADR 01: Superseding Prior PFE Concept ("StageConnect CMC")

### Context
An earlier preliminary document (`StageConnect CMC — Plan.md`) scoped a mobile-only, zero-budget, French-first, no-upload, static-mockup demonstration for Tangier/CMC students.

### Decision
`StageLink_Master_Development_Plan.md` supersedes those constraints with an **Advanced Functional MVP**:
1. **Audience**: All Moroccan university and vocational students and companies, with Tangier / CMC serving as an initial pilot partner rather than a rigid boundary.
2. **Language**: English-only at MVP launch to establish a clean international foundation, with architecture structured for future localization (French, Modern Standard Arabic, Moroccan Darija).
3. **Internal Data Exclusivity**: 100% of companies and internships originate in the internal database. No web scraping, LinkedIn/Indeed crawling, or fake dummy listings presented as live opportunities.
4. **Real CV Upload & Parsing**: Secure PDF upload, extraction of skills/education, and a transparent review diff before saving to the student profile.
5. **AI Assistant**: Authentic profile-aware copilot with strict authorization controls, queryable internal database tools, and guaranteed student confirmation before any application submission.

---

## ADR 02: Modular Monolith with Next.js App Router & Prisma

### Context
We need a robust, modern full-stack web application with minimal operational complexity, fast feedback loops, and strong type safety.

### Decision
Adopt **Next.js App Router (React Server Components) + TypeScript + Prisma ORM + PostgreSQL**.
- Rationale: Single repository, unified type safety from database models to frontend components, built-in API route handlers, and straightforward server-side authorization checks.
- Avoid microservices for the MVP to prevent network latency overhead, distributed transaction complexity, and excessive infrastructure costs.

---

## ADR 03: Private Storage & Access Control Strategy

### Context
Uploaded CVs contain highly sensitive personal identifiable information (PII) subject to Moroccan Law 09-08 and global privacy standards.

### Decision
1. CV PDFs must never be placed inside the `public/` directory or served via predictable URLs.
2. Store files in a segregated directory (`/storage/private`) in local development or private S3-compatible buckets in production.
3. Access to CV documents is restricted strictly to:
   - The student owner.
   - Authorized members of a company to which the student has actively submitted an application.
   - Platform administrators for audit/compliance investigations.
4. Implement an abstract `StorageProvider` allowing seamless switching between local disk and cloud storage without altering business logic.

---

## ADR 04: Two-Way Explainable Matching Algorithm (V1)

### Context
Students need clear guidance on why an internship fits them, and companies need relevant candidates without opaque, non-deterministic black-box scoring.

### Decision
Implement a deterministic heuristic matching engine:
1. **Hard Eligibility First**: Verify availability dates, minimum duration, and mandatory required skills. If any hard constraint fails, mark status as `not_eligible` with explicit reasons.
2. **Weighted Relevance**:
   - Skills Overlap (Required & Preferred): 35%
   - Educational Relevance: 15%
   - Location & Work Modality: 15%
   - Field / Career Alignment: 15%
   - Availability & Duration: 10%
   - Language Fit: 10%
3. **Explicit Disclaimer**: Always present the matching score as a "compatibility heuristic" rather than a hiring guarantee.
4. **Discoverability Consent**: Companies may only discover and rank candidates who have explicitly enabled candidate discovery (`discoverabilityConsent = true`).

---

## ADR 05: Cost & Budget Governance

### Context
The plan specifies preference for low-cost development with zero ongoing cost not guaranteed, but unapproved commercial spend is prohibited.

### Decision
1. **Development & Testing**: Use zero-cost local defaults (local PostgreSQL, local disk storage, local mock AI provider).
2. **AI Provider Adapter**: Support a pluggable architecture. The default environment runs `AI_PROVIDER=mock`, returning realistic, context-aware responses and tool execution simulations without requiring paid API keys.
3. **Optional External Providers**: Gemini, OpenAI, or Anthropic can be configured via environment variables with token and rate caps (`AI_MAX_TOKENS_PER_REQUEST`, `RATE_LIMIT_AI_RPM`).
