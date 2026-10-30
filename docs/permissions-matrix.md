# StageLink — Permissions & Authorization Matrix (RBAC & Object-Level Security)

## 1. Actor Roles & Definitions

| Role Identifier | Description | Assignment Mechanism |
|---|---|---|
| `GUEST` | Unauthenticated public visitor | Default when no valid session is present |
| `STUDENT` | Verified student seeking internships | Selected upon registration, confirmed via profile setup |
| `COMPANY_MEMBER` | Staff member of an organization | Invited or assigned to a specific Company via `CompanyMembership` |
| `COMPANY_ADMIN` | Primary manager/recruiter of a Company | Creator or promoted admin in `CompanyMembership` |
| `PLATFORM_ADMIN` | StageLink system administrator | Explicit server-level assignment (never client-selected) |

---

## 2. Resource Permissions Matrix

| Resource / Action | GUEST | STUDENT | COMPANY MEMBER | COMPANY ADMIN | PLATFORM ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| **Public Listings (Published & Active)** | View | View | View | View | View |
| **Draft / Pending / Paused Listings** | ❌ | ❌ | View/Edit (Own) | View/Edit (Own) | View/Moderate (All) |
| **Create Internship Listing** | ❌ | ❌ | Create (If Verified) | Create (If Verified) | ❌ |
| **Company Profile (Public View)** | View | View | View | View | View |
| **Company Profile (Edit)** | ❌ | ❌ | Edit (Own) | Edit (Own) | Edit/Suspend (All) |
| **Company Verification Request** | ❌ | ❌ | View Status | Submit / Re-submit | Review & Decide |
| **Student Profile (Own)** | ❌ | Read/Write | ❌ | ❌ | Audit Only |
| **Student Profile (Discoverable)** | ❌ | ❌ | View Opted-in | View Opted-in | Audit Only |
| **Student Profile (Private / Non-opted)**| ❌ | ❌ | ❌ | ❌ | Audit Only |
| **CV Document (Upload / Parse)** | ❌ | Create (Own) | ❌ | ❌ | ❌ |
| **CV Document (Download / View)** | ❌ | Read (Own) | Read (Applicant Only)| Read (Applicant Only)| Audit Only |
| **Submit Application** | ❌ | Create (Once) | ❌ | ❌ | ❌ |
| **Withdraw Application** | ❌ | Update (Own) | ❌ | ❌ | ❌ |
| **Review Candidate Pipeline** | ❌ | ❌ | View/Update (Own Co)| View/Update (Own Co)| View (Audit) |
| **Saved Listings** | ❌ | Read/Write (Own)| ❌ | ❌ | ❌ |
| **AI Copilot (Chat & Matches)** | ❌ | Execute (Own) | ❌ | ❌ | Test Console |
| **Admin Verification & Moderation** | ❌ | ❌ | ❌ | ❌ | Full Access |
| **System Health & Aggregates** | ❌ | ❌ | ❌ | ❌ | Full Access |

---

## 3. Object-Level Tenant Isolation Rules

1. **CV Protection Rule**: A company member can **only** download or view a student's CV if that student has an active application submitted to one of their company's listings.
2. **Discoverability Consent Rule**: Candidate discovery endpoints strictly filter `studentProfile.discoverabilityConsent == true`. Unconsenting student profiles are completely invisible to company searches.
3. **Company Membership Validation**: Membership and role are resolved dynamically from the database (`CompanyMembership` table), not stored blindly in client session tokens.
4. **Moderation Integrity**: Unverified companies cannot set listings to `published`. Listings must transition through `pending_review` and receive approval from a `PLATFORM_ADMIN`.
5. **Direct Object Reference (IDOR) Defense**: All mutating endpoints verify `record.ownerId === session.userId` or `record.companyId === session.activeCompanyId`. Violations return standard `403 Forbidden` or `404 Not Found`.
