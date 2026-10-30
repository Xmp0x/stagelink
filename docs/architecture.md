# StageLink — System Architecture Specification

## 1. Architectural Philosophy & Strategy

StageLink is architected as a clean, cohesive **Modular Monolith** using the Next.js App Router (React Server Components + Server Actions / Route Handlers) with PostgreSQL and Prisma ORM.

### Key Architectural Tenets:
1. **Zero External Scraping**: All companies, internships, and candidates reside directly within the internal PostgreSQL database. No external job board scrapers or third-party web crawlers.
2. **Strict Multi-Tenant Isolation**: Students, Company Members, and Platform Administrators operate under distinct authorization contexts. All database queries enforce tenant ownership at the service layer.
3. **Private File Storage**: Uploaded CVs (PDF) are never stored in public directories or served via unauthenticated URLs. Access requires authenticated session validation with signed/streamed tokenized access.
4. **Sandboxed AI Copilot**: The AI copilot does not have direct database access, network socket privileges, or autonomous mutation capabilities. It interacts exclusively via a whitelist of authenticated internal tool handlers.
5. **Deterministic Baseline with Optional AI**: Core platform search, matching, and application lifecycles remain 100% functional even when AI features or external LLM APIs are offline.

---

## 2. System Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                               │
│  Next.js 14/15 Responsive UI (React Server Components + Client Hydration)│
│  - Public Portal: Explore, Listing Detail, Login, Registration        │
│  - Student Portal: Dashboard, Profile, CV Diff, Matches, Applications  │
│  - Company Portal: Pipeline ATS, Listing Editor, Verified Candidate Dir│
│  - Admin Portal: Verification Queue, Moderation, Audit Trails          │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTPS / JSON
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            APPLICATION TIER                            │
│  Next.js App Router (Route Handlers / API Endpoints)                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Auth & RBAC Guard: Session Validation, Tenant Scoping, Rate Limit│  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │ Domain Service Modules:                                          │  │
│  │  - AuthService           - MatchingService (V1 Heuristic Engine) │  │
│  │  - StudentService        - AICopilotService (Tool Orchestration) │  │
│  │  - CompanyService        - NotificationService                   │  │
│  │  - InternshipService     - AuditService                          │  │
│  │  - ApplicationService    - StorageService (Local / S3 Provider)  │  │
│  │  - CVParsingService                                              │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌─────────────────────────────────────┐     ┌───────────────────────────────────┐
│              DATA TIER              │     │       FILE & EXTERNAL TIER        │
│  PostgreSQL Database                │     │  - Private Storage (/storage)     │
│  - Users & Roles                    │     │  - PDF Text Extraction Worker     │
│  - Students & Companies             │     │  - AI Provider Adapter            │
│  - Listings & Applications          │     │    (Mock / Gemini / OpenAI)       │
│  - Matches & Audit Events           │     └───────────────────────────────────┘
│  - Prisma ORM Data Access Layer     │
└─────────────────────────────────────┘
```

---

## 3. Core Component Design

### 3.1 Data Access Layer (Prisma ORM)
All database interactions flow through typed Prisma models. Direct SQL execution is avoided unless required for specific vector operations (pgvector) in future revisions.

### 3.2 Private Storage Service (`StorageService`)
CV documents are stored using a provider-agnostic interface:
```typescript
export interface StorageProvider {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getDownloadUrl(key: string, expiresInSeconds: number): Promise<string>;
}
```
In local development, files are stored under `./storage/private/`, completely detached from the `public/` web directory.

### 3.3 AI Copilot Architecture (`AICopilotService`)
The AI engine runs server-side:
1. Student sends message with conversation context.
2. Server loads authenticated student profile.
3. System prompt instructs model to act as the StageLink Copilot with strict boundaries.
4. Model issues structured tool calls (`getMyProfile`, `searchPublishedInternships`, `rankMyMatches`, etc.).
5. Server verifies authorization for each tool call, executes against the internal database, and returns structured data.
6. Model synthesizes response.
7. Any state mutation (e.g., submitting an application) CANNOT be executed automatically by the model; instead, the model outputs an interactive application confirmation card for explicit user submission.

---

## 4. Scalability & Operational Strategy

- **Stateless Web Tier**: Session tokens are cryptographically verified; web nodes can scale horizontally behind a reverse proxy.
- **Database Indexing**: Targeted composite indexes on `(companyId, status)`, `(studentId, status)`, and `(status, deadline)` ensure fast query execution.
- **Graceful Degradation**: If the AI provider is unavailable or out of quota, fallback mechanisms ensure all search, filtering, and application workflows proceed smoothly.
