# StageLink — API & Service Contracts Specification

## 1. Global Request & Response Conventions

### 1.1 Standard Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "correlationId": "req_01h8x4k2a9zb...",
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

### 1.2 Standard Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The submitted payload contains 2 invalid fields.",
    "details": [
      { "field": "deadline", "message": "Deadline cannot be in the past" }
    ]
  },
  "correlationId": "req_01h8x4k2a9zb...",
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

### 1.3 Common HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Schema validation failure or malformed payload.
- `401 Unauthorized`: Missing or invalid session token.
- `403 Forbidden`: Authenticated user lacks permission for target object/tenant.
- `404 Not Found`: Resource does not exist or caller cannot view it.
- `409 Conflict`: Business rule violation (e.g. duplicate application).
- `422 Unprocessable Content`: Unreadable or malformed uploaded file.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Unhandled server exception.

---

## 2. Core API Endpoints

### 2.1 Authentication & Session
- `POST /api/auth/register` — Create account (`email`, `password`, `name`, `role: "STUDENT" | "COMPANY"`).
- `POST /api/auth/login` — Authenticate and receive session cookie.
- `POST /api/auth/logout` — Invalidate session.
- `GET /api/auth/me` — Return current session user, profile state, and company memberships.

### 2.2 Student Profile & CV
- `GET /api/me/profile` — Fetch student profile, skills, education, completeness score, and consent state.
- `PATCH /api/me/profile` — Update student profile fields and discoverability consent.
- `POST /api/me/cv` — Upload PDF CV (multipart/form-data). Triggers extraction pipeline.
- `GET /api/me/cv/extractions/:id` — Retrieve extracted suggestions and confidence scores.
- `POST /api/me/cv/extractions/:id/apply` — Apply approved diff items to student profile.
- `GET /api/me/matches` — Return explainable internship recommendations with heuristic scores.
- `GET /api/me/applications` — List all submitted applications and status histories.
- `GET /api/me/saved` — List student bookmarked internships.
- `POST /api/me/saved/:listingId` — Bookmark an internship.
- `DELETE /api/me/saved/:listingId` — Remove bookmark.

### 2.3 Internship Discovery & Applications (Public / Student)
- `GET /api/internships` — Search active published internships (`q`, `city`, `field`, `modality`, `duration`, `page`, `limit`).
- `GET /api/internships/:id` — Get listing details, company verification badge, and requirements.
- `POST /api/internships/:id/applications` — Submit application with CV reference and motivation note.

### 2.4 Company Management & Pipeline
- `GET /api/companies/:id` — Company public/private details.
- `PATCH /api/companies/:id` — Edit company information.
- `POST /api/companies/:id/verification` — Submit company legal registration documents for admin review.
- `GET /api/companies/:id/internships` — View all company listings (all states: draft, pending, published, closed).
- `POST /api/companies/:id/internships` — Create new internship listing.
- `PATCH /api/companies/:id/internships/:listingId` — Update listing details or transition lifecycle state.
- `GET /api/companies/:id/applications` — Review candidate pipeline for company listings.
- `PATCH /api/companies/:id/applications/:appId` — Transition application state (`under_review`, `shortlisted`, `interview`, `accepted`, `rejected`).
- `GET /api/companies/:id/candidates` — Search discoverable candidates who have opted into visibility.

### 2.5 AI Internship Copilot
- `POST /api/ai/chat` — Send message to profile-aware assistant. Streams or returns response with tool executions.
- `GET /api/ai/conversations` — Fetch chat history for authenticated student.

### 2.6 Admin Moderation & Operations
- `GET /api/admin/verifications` — Queue of pending company verifications.
- `POST /api/admin/verifications/:id/decision` — Approve or reject company verification with audit notes.
- `GET /api/admin/moderation/listings` — Queue of pending internship listings.
- `POST /api/admin/moderation/listings/:id/decision` — Approve or reject listing publication.
- `GET /api/admin/analytics` — Platform aggregates (verified counts, placement pipeline metrics).
- `GET /api/admin/audits` — Immutable audit log of high-risk actions.

### 2.7 System Operations
- `GET /api/health` — Platform health check, database ping, and storage status.
